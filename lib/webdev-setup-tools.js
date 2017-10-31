// this file intended to parse the package.json file to find any dependencies that need to be updated
const semver = require('semver');
const os = require('os');
const globals = require('../../../package.json');
const webdevSetupTools = globals['web-dev-setup-tools'];
const {exec} = require('child_process');
const request = require('request');
const fs = require('fs');
const readline = require('readline');

const operatingSystem = os.platform().trim(); // supported values are darwin (osx), linux (ubuntu), and win32 ()
const scriptsDirectory = __dirname;
const formattedOutputOptions = {
    resolve: (resolve, data) => {
        resolve(data);
    },
    stdout: data => {
        process.stdout.write(data);
    }
};

let getOutputOptions  = () => formattedOutputOptions;
let getProjectGlobals  = (packageName) => {
    return webdevSetupTools[packageName];
};
// userGlobals - object mapping packages to versions
// projectGlobals - global object listed in package.json at root
// packageArray - array of module objects with name and highestCompatibleVersion properties
let findRequiredAndOptionalUpdates = (userGlobals, projectGlobals, packageArray) => {
    let optionalInstall = [];
    let requiredInstall = [];
    for (let index = 0; index < packageArray.length; index++) {
        let module = packageArray[index];
        if (!userGlobals[module.name]) { // install nonexistent
            console.log('missing required project package ' + module.name + '.');
            requiredInstall.push(module);
        } else if (semver.outside(userGlobals[module.name], projectGlobals[module.name], '<')) { // install incompatible
            console.log('package ' + module.name + ' version ' + userGlobals[module.name] + ' is not compatible with the project.');
            requiredInstall.push(module);
        } else if (semver.gt(module.highestCompatibleVersion, userGlobals[module.name])) { // optional update
            optionalInstall.push(module);
        }
    }
    return {required: requiredInstall, optional: optionalInstall};
};

let runListOfPromises  = (projectGlobals, promise) => {
    let promises = [];
    Object.keys(projectGlobals).forEach(dependency => {
        promises.push(promise(dependency, projectGlobals));
    });
    return Promise.all(promises).then(packageVersions => {
        return packageVersions;
    }, error => {
        return error;
    });
};

let getInstallationCommand = (packages, command, separator) => {
    let installCommand = command;
    for (let index = 0; index < packages.length; index++) {
        installCommand += ' ' + packages[index].name + separator + packages[index].highestCompatibleVersion;
    }
    return installCommand;
};

let handleUnresponsiveSystem = (delayTime, delayMessage) => {
    return new Promise((resolve) => {
        (function waitForSystemResponse() {
            let onTimeoutFunction = () => displayUserPrompt(delayMessage)
                .then(response => {
                    if (!response.startsWith('y')) {
                        resolve();
                    } else {
                        console.log('waiting for response from system...');
                        waitForSystemResponse();
                    }
                });
            setTimeout(onTimeoutFunction, delayTime);
        })();
    });
};

let executeSystemCommand = (commandToExecute, outputOptions) => {
    return new Promise((resolve, reject) => {
        let systemCommand = exec(commandToExecute, {maxBuffer: 1024 * 500}, (error, osResponse, stderr) => {
            if (error) {
                reject(Error(error));
            } else if (stderr && !outputOptions.stderr) {
                console.log(stderr);
            }
            outputOptions.resolve(resolve, osResponse);
        });
        if (outputOptions.stdout) {
            systemCommand.stdout.on('data', data => {
                outputOptions.stdout(data);
            });
        }
        if (outputOptions.stderr) {
            systemCommand.stderr.on('data', data => {
                outputOptions.stderr(resolve, reject, data);
            });
        }
        if (outputOptions.exit) {
            systemCommand.on('exit', data => {
                outputOptions.exit(resolve, reject, data);
            });
        }
    });
};

let findHighestCompatibleVersion = (globalPackage, projectGlobals, listVersionsCommand) => { // get highest version from terminal or prompt output
    let versionPattern = /([0-9]+(?:\.[0-9-a-z]+)+)/g;
    let matchVersionsOptions = {
        resolve: (resolve, data) => {
            let match = versionPattern.exec(data);
            let allVersions = [];
            while (match !== null) {
                allVersions.push(match[0]);
                match = versionPattern.exec(data);
            }
            let tool = {};
            tool.name = globalPackage;
            tool.highestCompatibleVersion = semver.maxSatisfying(allVersions, projectGlobals[globalPackage]);
            resolve(tool);
        }
    };
    return executeSystemCommand(listVersionsCommand, matchVersionsOptions);
};

let confirmOptionalInstallation = (displayPrompt, installCallback) => {
    return displayUserPrompt(displayPrompt)
        .then(response => {
            if (!response.startsWith('n')) {
                console.log('updating packages');
                return installCallback();
            } else {
                console.log('update aborted');
            }
        });
};

let getAllUserGlobals = (installedModules, modulePattern) => { // return a map of all modules user has installed
    let match = modulePattern.exec(installedModules);
    let userGlobals = {};
    let globalName = 1;
    let globalVersion = 2;
    while (match !== null) {
        userGlobals[match[globalName]] = match[globalVersion];
        match = modulePattern.exec(installedModules);
    }
    return userGlobals;
};

let findUserGlobals = (listGlobalsCommand, getGlobals) => {
    let findGlobalsOptions = {
        resolve: (resolve, data) => {
            resolve(getGlobals(data));
        }
    };
    return executeSystemCommand(listGlobalsCommand, findGlobalsOptions);
};

let listOptionals = optionalPackages => {
    for (let index = 0; index < optionalPackages.length; index++) {
        console.log(optionalPackages[index].name);
    }
};

let getVersionWithRequest = (productUrl, hyperlinkPattern, range) => {
    return new Promise((resolve, reject) => {
        request({
            followAllRedirects: true,
            agent: false,
            url: productUrl,
            method: 'GET'
        }, (error, response, body) => {
            if (error) {
                reject(error);
            }
            let match = hyperlinkPattern.exec(body);
            let versionMap = {};
            while (match !== null) {
                let downloadLink = match[0];
                let version = match[1];
                versionMap[version] = downloadLink;
                match = hyperlinkPattern.exec(body);
            }
            let arrayOfVersions = Object.keys(versionMap);
            let highestVersion = semver.maxSatisfying(arrayOfVersions, range);
            let highestVersionObj = {};
            highestVersionObj.downloadHyperlink = versionMap[highestVersion];
            highestVersionObj.version = highestVersion;
            resolve(highestVersionObj);
        });
    });
};

let downloadPackage = (hyperlink, downloadPath) => {
    return new Promise((resolve, reject) => {
        let downloadFile = fs.createWriteStream(downloadPath);
        let stream = request(hyperlink).pipe(downloadFile);
        stream.on('finish', () => {
            console.log('download complete');
        });
        stream.on('error', err => {
            console.log(err);
            reject(err);
        });
        downloadFile.on('close', () => {
            resolve(downloadPath);
        });
    });
};

let displayUserPrompt = displayPrompt => new Promise((resolve) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(displayPrompt, (answer) => {
        resolve(answer);
        rl.close();
    });
});

// refresh the path before running every command in powershell to handle full install
let convertToPowershellCommand = systemCommand => 'powershell.exe -command \"$env:Path = ' + getSystemEnvironmentVariableForWindows('Path') + '; ' + systemCommand + ';\"';
let convertToBashLoginCommand = systemCommand => 'bash -l -c \"' + systemCommand + '\"';
let getSystemCmd = systemCommand => (operatingSystem === 'win32') ? convertToPowershellCommand(systemCommand) : convertToBashLoginCommand(systemCommand);

let goUpDirectories = numberOfDirectories => {
    let splitValue = (operatingSystem === 'win32') ? '\\' : '/';
    return scriptsDirectory.split(splitValue).slice(0, -numberOfDirectories).join(splitValue) + splitValue;
};

let getSystemEnvironmentVariableForWindows = variableName => '[Environment]::GetEnvironmentVariable(\'' + variableName + '\', \'Machine\')';
let setSystemEnvironmentVariable = (variableName, variableValue) => '[Environment]::SetEnvironmentVariable(\'' + variableName + '\', ' + variableValue + ', \'Machine\')';

let endProcessWithMessage = (message, delay, exitCode) => {
    console.log(message);
    setTimeout(() => {
        process.exit(exitCode);
    }, delay);
};
let getVariablesFromUser = (arrayOfConfigVariables, validateInputFunc) => {
    return arrayOfConfigVariables.reduce((promise, variable) => promise.then((responseObject) => new Promise((resolve) => {
        let promptForValue = () => {
            let promptForUser = 'please enter a valid value for ' + variable + ': ';
            return displayUserPrompt(promptForUser)
                .then(output => {
                    if (validateInputFunc(output)) {
                        responseObject[variable] = output;
                        resolve(responseObject);
                    } else {
                        promptForValue();
                    }
                });
        };
        promptForValue();
    })), Promise.resolve({}));
};
let getVariablesFromFile = (filePath) => {
    let setupRcContent = fs.readFileSync(filePath, 'utf8');
    let userVariables = {};
    setupRcContent.split(/\r?\n/).forEach(line => {
        let keyVal = line.split('=');
        if (keyVal.length === 2) {
            userVariables[keyVal[0]] = keyVal[1];
        }
    });
    return userVariables;
};
let getMissingVariables = (setuprcPath, arrayOfConfigVariables) => {
    let missingVariables = [];
    let foundVariables = getVariablesFromFile(setuprcPath);
    for (let index = 0; index < arrayOfConfigVariables.length; index++) {
        let variable = arrayOfConfigVariables[index];
        if (!foundVariables[variable]) {
            missingVariables.push(variable);
        }
    }
    return {missingVariables: missingVariables, foundVariables: foundVariables};
};
let shouldModifyGitIgnore = (isAGitRepo, gitIgnorePath, fileName) => {
    return isAGitRepo && (!fs.existsSync(gitIgnorePath) || !fs.readFileSync(gitIgnorePath, 'utf8').includes(fileName));
};
// requestedConfigVariables - an array of string variables to be found
// validateInputFunc - function used to accept or reject user input for the configuration variables
let getConfigVariables = (requestedConfigVariables, validateInputFunc) => {
  let userConfigVariables = requestedConfigVariables || [];
  let validationFunction = (validateInputFunc) ? validateInputFunc : input => input;
  let isAGitRepo = fs.existsSync('../.git');
  if (!isAGitRepo) {
    let alertNonGitUser = 'It looks like you are not using a git repository.\n' +
      'It will be your responsibility to ignore the .setuprc that is created by this procedure.\n' +
      'Check with your version control system documentation for this information.';
    console.log(alertNonGitUser);
  }
  let folderSeparator = (operatingSystem === 'win32') ? '\\' : '/';
  let lineSeparator = os.EOL;

  let setuprcPath = fs.realpathSync('../') + folderSeparator +'.setuprc';
  let existingSetupRc = fs.existsSync(setuprcPath);
  if (shouldModifyGitIgnore(isAGitRepo, '../.gitignore','.setuprc')) {
    let gitIgnorePath = fs.realpathSync('../') + folderSeparator + '.gitignore';
    fs.appendFileSync(gitIgnorePath, '.setuprc' + lineSeparator);
  }
  let userVariables = {};
  let variablesToConfigure = userConfigVariables;
  if (existingSetupRc) {
    let configVariables = getMissingVariables(setuprcPath, userConfigVariables);
    variablesToConfigure = configVariables.missingVariables;
    userVariables = configVariables.foundVariables;
  }
  return getVariablesFromUser(variablesToConfigure, validationFunction)
    .then(userResponseMap => { // write text to file then return user responses
      if (variablesToConfigure.length === 0) {
        return userVariables;
      }
      let fileText = '';
      Object.keys(userResponseMap).forEach(variable => {
        fileText += variable + '=' + userResponseMap[variable] + lineSeparator;
      });
      fs.appendFileSync(setuprcPath, fileText);
      return Object.assign(userVariables, userResponseMap);
    });
};
module.exports = {
    getSystemCommand: getSystemCmd,
    findHighestCompatibleVersion: findHighestCompatibleVersion,
    findUserGlobals: findUserGlobals,
    getAllUserGlobals: getAllUserGlobals,
    runListOfPromises: runListOfPromises,
    findRequiredAndOptionalUpdates: findRequiredAndOptionalUpdates,
    handleUnresponsiveSystem: handleUnresponsiveSystem,
    executeSystemCommand: executeSystemCommand,
    confirmOptionalInstallation: confirmOptionalInstallation,
    getVersionWithRequest: getVersionWithRequest,
    downloadPackage: downloadPackage,
    convertToBashLoginCommand: convertToBashLoginCommand,
    convertToPowershellCommand: convertToPowershellCommand,
    displayUserPrompt: displayUserPrompt,
    getWindowsEnvironmentVariable: getSystemEnvironmentVariableForWindows,
    setWindowsEnvironmentVariable: setSystemEnvironmentVariable,
    getOutputOptions: getOutputOptions,
    getProjectGlobals: getProjectGlobals,
    getInstallationCommand: getInstallationCommand,
    listOptionals: listOptionals,
    goUpDirectories: goUpDirectories,
    endProcessWithMessage: endProcessWithMessage,
    getConfigVariables: getConfigVariables
};