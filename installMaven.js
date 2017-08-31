/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js');
const operatingSystem = setup.getOperatingSystem();
const options = setup.getOptions();
const requiredMavenVersion = setup.getProjectGlobals('maven');
const versionPattern = setup.getVersionPattern();
const homeDirectory = setup.getHomeDirectory();
let installMavenOnHost = () => {
    let downloadPattern = (operatingSystem === 'win32') ? /http[^"]+maven-([0-9.]+)-bin\.zip/g : /http[^"]+maven-([0-9.]+)-bin\.tar\.gz/g;
    let unzippedFolderPath = (operatingSystem === 'win32') ?  'C:\\Program Files\\' : '/usr/local/';
    let mavenUrl = 'https://maven.apache.org/download.cgi';
    let mavenVersion;
    return setup.getVersionWithRequest(mavenUrl, downloadPattern, requiredMavenVersion) // scrape the maven homepage to get version and download link
        .then(download => {
            let path = download.downloadHyperlink;
            console.log('downloading maven version from the following link:\n' + path);
            let fileName = path.substring(path.lastIndexOf('/') + 1, path.length);
            unzippedFolderPath += fileName.substring(0, fileName.indexOf(download.version) + download.version.length);
            let folderSeparator = (operatingSystem === 'win32') ? '\\' : '/';
            let downloadPath = homeDirectory + folderSeparator + 'Downloads' + folderSeparator + fileName;
            mavenVersion = download.version;
            return setup.downloadPackage(path, downloadPath);
        })
        .then(downloadPath => { // unzip the downloaded package
            let unzipCommand;
            if (operatingSystem === 'win32') {
                unzipCommand = 'powershell.exe -command \"Add-Type -AssemblyName System.IO.Compression.FileSystem; ' +
                    '[System.IO.Compression.ZipFile]::ExtractToDirectory(' + '\'' + downloadPath + '\', \'C:\\Program Files\\\');\"';
            } else {
                unzipCommand = 'sudo tar -xvzf ' + downloadPath + ' -C /usr/local/';
            }
            return setup.executeSystemCommand(unzipCommand, options);
        })
        .then(() => { // set environment variables
            console.log('setting your maven system environment variables.');
            let outFile = (operatingSystem === 'darwin') ? '.bash_profile' : '.bashrc';
            let commandSeparator = (operatingSystem === 'win32') ? '; ' : ' && ';
            let setM2Home = (operatingSystem === 'win32') ? setup.setWindowsEnvironmentVariable('M2_HOME', '\'' + unzippedFolderPath + '\'') :
                'echo "export M2_HOME=/usr/local/maven" >> ' + homeDirectory + '/' + outFile;
            let setMavenHome = (operatingSystem === 'win32') ? setup.setWindowsEnvironmentVariable('MAVEN_HOME', '\'' + unzippedFolderPath + '\'') :
                'echo "export MAVEN_HOME=/usr/local/maven" >> ' + homeDirectory + '/' + outFile;
            let setSystemPath = (operatingSystem === 'win32') ? '$old_path = ' + setup.getWindowsEnvironmentVariable('path') +
                '; $new_path = $old_path + \';\' + \'' + unzippedFolderPath + '\' + \'\\bin\'; ' +
                setup.setWindowsEnvironmentVariable('path', '$new_path') : 'echo "export PATH=/usr/local/maven/bin:\\$PATH" >> ' + homeDirectory + '/' + outFile;
            let createSymbolicLinkToMaven = 'sudo ln -s ' + unzippedFolderPath + ' /usr/local/maven';
            let setAllPathVariables = setM2Home + commandSeparator + setMavenHome + commandSeparator + setSystemPath;
            setAllPathVariables = (operatingSystem === 'win32') ? setup.getSystemCommand(setAllPathVariables) : setAllPathVariables + commandSeparator + createSymbolicLinkToMaven;
            return setup.executeSystemCommand(setAllPathVariables, options);
        })
        .then(() => { // notify user of success
            console.log('successfully installed maven version ' + mavenVersion);
        })
        .catch(error => { // notify user of failure and reason
            console.log('could not set environment variables at this time.');
            console.log(error);
        });
};
let installMaven = () => {
    const checkMavenVersion = setup.getSystemCommand('mvn -v');
    return setup.executeSystemCommand(checkMavenVersion, {resolve: options.resolve})
        .catch(() => {
            console.log('No version of maven detected. Installing maven now.');
            return installMavenOnHost();
        })
        .then(mavenVersion => {
            if (mavenVersion) {
                console.log('found maven version ' + mavenVersion.match(versionPattern)[0]);
            }
        });
};

module.exports = {
    installMaven: installMaven
};