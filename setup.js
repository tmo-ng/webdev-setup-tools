// this file intended to parse the package.json file to find any dependencies that need to be updated
const semver = require('semver');
const os = require('os');
const operatingSystem = os.platform().trim(); // supported values are darwin (osx), linux (ubuntu), and win32 ()
const packageGlobals = require('../../package.json').globals;
const {exec} = require('child_process');
const request = require('request');
const fs = require('fs');
const versionPattern = /([0-9]+(?:\.[0-9]+)+)/g;
const readline = require('readline');
const scriptsDirectory = __dirname;
const projectRoot = 2;
const options = {
    resolve: (resolve, data) => {
        resolve(data);
    },
    stdout: data => {
        process.stdout.write(data);
    }
};
let getOperatingSystem  = () => operatingSystem;
let getOptions  = () => options;
let getVersionPattern  = () => versionPattern;
let getProjectGlobals  = (packageName) => {
    return packageGlobals[packageName];
};
let getHomeDirectory  = () => os.homedir();
let getMaxCompatibleVersion = (arrayOfVersions, globalVersion) => {
    return semver.maxSatisfying(arrayOfVersions, globalVersion);
};
let isPackageCompatible = (version, range) => {
    return !semver.outside(version, range, '<');
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
    const nodeVersionPattern = /([0-9]+(?:\.[0-9-a-z]+)+)/g;
    let matchVersionsOptions = {
        resolve: (resolve, data) => {
            let match = nodeVersionPattern.exec(data);
            let allVersions = [];
            while (match !== null) {
                allVersions.push(match[0]);
                match = nodeVersionPattern.exec(data);
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
    let GLOBAL_NAME = 1;
    let GLOBAL_VERSION = 2;
    while (match !== null) {
        userGlobals[match[GLOBAL_NAME]] = match[GLOBAL_VERSION];
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

let getVersionsWithRequest = (productUrl, hyperlinkPattern, range) => {
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

let installAngularUiDependenciesWithYarn = () => {
    console.log('installing npm dependencies in angular-ui project folder.');
    let installAngularUiYarn = 'cd ' + goUpDirectories(projectRoot) + 'angular-ui';
    installAngularUiYarn += (operatingSystem === 'win32') ? ';' + getNpmPathOnWindows() + '\\yarn.cmd install' : ' && yarn install';
    return executeSystemCommand(getSystemCmd(installAngularUiYarn), options)
        .catch(error => {
            console.log('npm install failed in angular ui folder with the following message:\n');
            console.log(error);
        });
};
let updateWebdriver = () => {
    console.log('updating webdriver in angular-ui project folder.');
    let updateWebDriver = 'cd ' + goUpDirectories(projectRoot) + 'angular-ui';
    updateWebDriver += (operatingSystem === 'win32') ? '; npm run update-webdriver' : ' && npm run update-webdriver';
    return executeSystemCommand(getSystemCmd(updateWebDriver), options)
        .catch(error => {
            console.log('updating webdriver failed in angular-ui project folder with the following message:\n');
            console.log(error);
        });
};
let getNpmPathOnWindows = () => {
    const windowsDirectoryPattern = /C:\\[^;]+npm/g;
    let pathToNpm = windowsDirectoryPattern.exec(process.env.Path);
    return (pathToNpm) ? pathToNpm[0] : process.env.APPDATA + '\\npm';
};
let runGruntPremerge = () => {
    let premergeOptions = {};
    premergeOptions.resolve = options.resolve;
    premergeOptions.stdout = options.stdout;
    premergeOptions.exit = (resolve, reject, data) => {
        resolve(data);
    };

    let gruntCmd = 'cd ' + goUpDirectories(projectRoot) + 'angular-ui';

    // handle older versions of windows that do not source npm cmd's correctly
    gruntCmd += (operatingSystem === 'win32') ? ';' + getNpmPathOnWindows() + '\\grunt.cmd pre-merge' : ' && grunt pre-merge';
    let fullGruntCmd = getSystemCmd(gruntCmd);
    return executeSystemCommand(fullGruntCmd, premergeOptions)
        .catch(error => {
            console.log('failed to complete grunt pre-merge, failed with message:\n');
            console.log(error);
        });
};
let endProcessWithMessage = (message, delay, exitCode) => {
    console.log(message);
    setTimeout(() => {
        process.exit(exitCode);
    }, delay);
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
    getVersionWithRequest: getVersionsWithRequest,
    downloadPackage: downloadPackage,
    convertToBashLoginCommand: convertToBashLoginCommand,
    displayUserPrompt: displayUserPrompt,
    getWindowsEnvironmentVariable: getSystemEnvironmentVariableForWindows,
    setWindowsEnvironmentVariable: setSystemEnvironmentVariable,
    getOperatingSystem: getOperatingSystem,
    getOptions: getOptions,
    getVersionPattern: getVersionPattern,
    getProjectGlobals: getProjectGlobals,
    getHomeDirectory: getHomeDirectory,
    getMaxCompatibleVersion: getMaxCompatibleVersion,
    getInstallationCommand: getInstallationCommand,
    listOptionals: listOptionals,
    isPackageCompatible: isPackageCompatible,
    goUpDirectories: goUpDirectories,
    endProcessWithMessage: endProcessWithMessage,
    runGruntPremerge: runGruntPremerge,
    installAngularUiDependenciesWithYarn: installAngularUiDependenciesWithYarn,
    updateWebdriver: updateWebdriver
};