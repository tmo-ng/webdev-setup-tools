/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js'); // core module
const fs = require('fs');
const request = require('request');
const operatingSystem = setup.getOperatingSystem();
const options = setup.getOptions();
const aemGlobals = setup.getProjectGlobals('aem');
const homeDirectory = setup.getHomeDirectory();
const findPortProcessWindows = 'netstat -a -n -o | findstr :4502';
const findPortProcessOsxLinux = 'lsof -i TCP:4502';
const seconds = 1000;
const projectRoot = 2;
const projectRootUpOne = 3;
let installAemDependencies = () => {
    console.log('checking for Aem dependencies now..');
    const windowsFindQuickstart = 'dir C:\\*crx-quickstart /ad /b /s';
    const osxLinuxFindQuickstart = 'sudo find ' + homeDirectory + ' -type d -name "crx-quickstart"';
    let findQuickstart = (operatingSystem === 'win32') ? windowsFindQuickstart : osxLinuxFindQuickstart;
    return setup.executeSystemCommand(findQuickstart, { resolve: options.resolve })
        .then(osResponse => {
            if (osResponse !== '') {
                console.log('found an existing aem installation at ' + osResponse.trim() + '.');
                return;
            }
            console.log('missing aem dependencies, installing all aem dependencies now...');
            return aemInstallationProcedure();
        })
        .catch(() => {
            // AEM is not installed, run full aem installation procedure here
            console.log('installing all aem dependencies now...');
            return aemInstallationProcedure();
        });
};
let waitForServerStartup = () => {
    console.log('waiting for server to startup...');
    let portListenCommand = (operatingSystem === 'win32') ? findPortProcessWindows : findPortProcessOsxLinux;
    return new Promise((resolve) => {
        (function waitForEstablishedConnection() {
            return setup.executeSystemCommand(portListenCommand, {resolve: options.resolve})
                .then(osResponse => {
                    if (osResponse.includes('ESTABLISHED')) {
                        console.log(osResponse);
                        resolve(osResponse);
                    } else {
                        console.log('server is listening, waiting for connection to be established');
                        setTimeout(waitForEstablishedConnection, 3 * seconds);
                    }
                })
                .catch(() => {
                    console.log('did not find any process at port 4502, checking again.');
                    setTimeout(waitForEstablishedConnection, 5 * seconds);
                });
        })();
    });
};

let uploadAndInstallAllAemPackages = folderSeparator => {
    console.log('server started, installing local packages now...');
    let packageArray = Object.keys(aemGlobals.zip_files);
    const crxInstallUrl = 'http://admin:admin@localhost:4502/crx/packmgr/service.jsp';
    return packageArray.reduce((promise, zipFile) => promise.then(() => new Promise((resolve) => {
        (function waitForEstablishedConnection() {
            let formData = {
                file: fs.createReadStream(homeDirectory + folderSeparator + 'Downloads' + folderSeparator + zipFile),
                name: zipFile,
                force: 'true',
                install: 'true'
            };
            request.post({url: crxInstallUrl, formData: formData}, (err, httpResponse, body) => {
                if (err) {
                    console.log('upload and install failed with the following message:\n' + err);
                    setTimeout(waitForEstablishedConnection, 5 * seconds);
                } else if (httpResponse.statusCode === 200) {
                    console.log('Upload successful!  Server responded with:', body);
                    resolve(body);
                } else {
                    console.log('Upload failed,  Server responded with:', body);
                    setTimeout(waitForEstablishedConnection, 5 * seconds);
                }
            });
        })();
    })), Promise.resolve());
};
let mavenCleanAndAutoInstall = (commandSeparator, folderSeparator) => {
    let outFile = setup.goUpDirectories(projectRootUpOne) + 'AEM' + folderSeparator + 'mvnOutput.log';

    //need to check whether JAVA_HOME has been set here for windows machines, if not, this can be executed with the command below
    let runMavenCleanInstall = (operatingSystem === 'win32' && !process.env.JAVA_HOME) ? '$env:JAVA_HOME = ' + setup.getWindowsEnvironmentVariable('JAVA_HOME') + commandSeparator : '';
    runMavenCleanInstall += 'cd ' + setup.goUpDirectories(projectRoot) + 't-mobile' + commandSeparator + 'mvn clean install \-PautoInstallPackage > ' + outFile;

    console.log('running mvn clean and auto package install.\nOutput is being sent to the file ' + outFile);
    return setup.executeSystemCommand(setup.getSystemCommand(runMavenCleanInstall), options);
};
let copyNodeFile = folderSeparator => () => {
    let nodeFolderPath = setup.goUpDirectories(projectRoot) + 't-mobile' + folderSeparator + 'node';
    console.log('copying node file into ' + nodeFolderPath);
    return setup.executeSystemCommand('mkdir ' + nodeFolderPath, options)
        .then(() => {
            let nodePath = process.execPath;
            let copyNodeFile = (operatingSystem === 'win32') ? 'copy ' : 'cp ';
            copyNodeFile += '\"' + nodePath + '\" ' + nodeFolderPath + folderSeparator;
            return setup.executeSystemCommand(copyNodeFile, options);
        });
};
let startAemServer = (commandSeparator, jarName) =>{
    console.log('starting jar file AEM folder.');
    let startServer = 'cd ' + setup.goUpDirectories(projectRootUpOne) + 'AEM' + commandSeparator;
    startServer += (operatingSystem === 'win32') ? 'Start-Process java -ArgumentList \'-jar\', \'' + jarName + '\'' : 'java -jar ' + jarName + ' &';
    setup.executeSystemCommand(setup.getSystemCommand(startServer), options);
};
let downloadAllAemFiles = folderSeparator => () => {
    return setup.runListOfPromises(aemGlobals.zip_files, (dependency, globalPackage) => {
        console.log('downloading aem dependency ' + dependency);
        return setup.downloadPackage(globalPackage[dependency], homeDirectory + folderSeparator + 'Downloads' + folderSeparator + dependency);
    });
};
let stopAemProcess = () => {
    let findPortProcess = (operatingSystem === 'win32') ? findPortProcessWindows : findPortProcessOsxLinux;
    return setup.executeSystemCommand(findPortProcess, {resolve: options.resolve})
        .then(output => {
            console.log(output);
            let process = /LISTENING.*?([0-9]+)/g.exec(output);
            return process[1]; // return the process id
        })
        .then(processId => {
            console.log('ending process number ' + processId);
            let endPortProcess = (operatingSystem === 'win32') ? 'taskkill /F /PID ' : 'kill ';
            return setup.executeSystemCommand(endPortProcess + processId, options);
        });
};
let aemInstallationProcedure = () => {
    let folderSeparator = (operatingSystem === 'win32') ? '\\' : '/';
    let commandSeparator = (operatingSystem === 'win32') ? '; ' : ' && ';
    let aemFolderPath = setup.goUpDirectories(projectRootUpOne) + 'AEM';
    let downloadFile = (dependency, globalPackage) => {
        return setup.downloadPackage(globalPackage[dependency], aemFolderPath + folderSeparator + dependency)
            .then(() => dependency);
    };
    let jarName = '';
    console.log('creating AEM directory at ' + aemFolderPath);
    return setup.executeSystemCommand('mkdir ' + aemFolderPath, options)
        .then(() => {
            console.log('downloading jar file into AEM folder.');
            return setup.runListOfPromises(aemGlobals.jar_files, downloadFile);
        })
        .then(fileName => {
            jarName = fileName;
            console.log('downloading license file into AEM folder.');
            return setup.runListOfPromises(aemGlobals.license, downloadFile);
        })
        .then(copyNodeFile(folderSeparator))
        .then(() => startAemServer(commandSeparator, jarName))
        .then(downloadAllAemFiles(folderSeparator))
        .then(() => waitForServerStartup())
        .then(() => uploadAndInstallAllAemPackages(folderSeparator))
        .then(() => mavenCleanAndAutoInstall(commandSeparator, folderSeparator))
        .then(() => stopAemProcess())
        .then(() => {
            console.log('successfully built project with mvn.');
        })
        .catch(error => {
            console.log('failed to build maven in t-mobile folder with the following message\n' + error);
        });
};

module.exports = {
    installAem: installAemDependencies
};