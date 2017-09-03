/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js');
const options = setup.getOptions();
const operatingSystem = setup.getOperatingSystem();
const versionPattern = setup.getVersionPattern();
const rubyVersion = setup.getProjectGlobals('ruby'); // global semantic version range
const rubyVersionObject = {ruby: rubyVersion};
const homeDirectory = setup.getHomeDirectory();

let installRuby = () => {
    return (operatingSystem === 'win32') ? checkRubyInstallWindows() : checkRvmInstallMacLinux();
};

let installRubyOnWindowsHost = remoteRubyVersion => {
    let path = remoteRubyVersion.downloadHyperlink;
    let rubyDownloadPath = process.env.USERPROFILE + '\\Downloads\\' +
        path.substring(path.lastIndexOf('/') + 1, path.length);
    return setup.downloadPackage(path, rubyDownloadPath)
        .then(rubyFilePath => {
            let startRubyInstall = rubyFilePath + ' /verysilent /tasks="modpath"';
            return setup.executeSystemCommand(startRubyInstall, options);
        });
};
let checkRubyInstallWindows = () => {
    let rubyUrlWindows = 'https://rubyinstaller.org/downloads/archives/';
    let rubyHyperlinkPattern = /https[^"]+rubyinstaller-([0-9.]+)[0-9-p]*x64.exe/g;
    let getRubyVersion = setup.getSystemCommand('ruby -v');
    let localRuby = {};
    return setup.executeSystemCommand(getRubyVersion, {resolve: options.resolve}) // check for existing ruby
        .catch(() => {
            console.log('no version of ruby is installed on this computer');
        })
        .then(localRubyMessage => {
            if (localRubyMessage) {
                let localRubyVersion = localRubyMessage.match(versionPattern)[0];
                localRuby = {ruby: localRubyVersion};
            }
        })
        .then(() => setup.getVersionWithRequest(rubyUrlWindows, rubyHyperlinkPattern, rubyVersion))
        .then(remoteRubyVersion => {
            let rubyUpdates = setup.findRequiredAndOptionalUpdates(localRuby, rubyVersionObject, [{name: 'ruby', highestCompatibleVersion: remoteRubyVersion.version}]);
            if (rubyUpdates.required.length > 0) {
                console.log('installing ruby now.');
                return installRubyOnWindowsHost(remoteRubyVersion);
            } else if (rubyUpdates.optional.length > 0) {
                return setup.confirmOptionalInstallation('do you want to install this optional ruby upgrade now (y/n)?  ', () => installRubyOnWindowsHost(remoteRubyVersion));
            }
        });
};

let installRvm = installRvmForMacLinux => {
    console.log('installing rvm now');
    return setup.executeSystemCommand(installRvmForMacLinux, options)
        .then(() => { // update environment variables
            let outFile = (operatingSystem === 'darwin') ? '/.bash_profile' : '/.bashrc';
            return setup.executeSystemCommand('echo "[ -s \\"\\$HOME/.rvm/scripts/rvm\\" ] && \\. \\"\\$HOME/.rvm/scripts/rvm\\"" >> ' + homeDirectory + outFile, options)
                .then(() => setup.executeSystemCommand('echo "export PATH=\\"\\$PATH:\\$HOME/.rvm/bin\\"" >> ' + homeDirectory + outFile, options));
        });
};
let installRubyWithRvm = remoteRubyVersion => {
    let installRubyCommand = setup.getSystemCommand('rvm install ' + remoteRubyVersion);
    return setup.executeSystemCommand(installRubyCommand, options)
        .then(() => remoteRubyVersion);
};
let checkRvmInstallMacLinux = () => {
    let installRvmForMacLinux = 'curl -sSL https://get.rvm.io | bash -s -- --ignore-dotfiles';
    let rvmGetAllRemoteRubyVersions = setup.convertToBashLoginCommand('rvm list known');
    let rvmGetAllLocalRubyVersions = setup.convertToBashLoginCommand('rvm list');
    let rvmSetLocalRubyDefault = 'rvm --default use ';
    let checkForExistingRvm = setup.convertToBashLoginCommand('which rvm');
    let localRubyVersion;
    return setup.executeSystemCommand(checkForExistingRvm, {resolve: options.resolve})
        .catch(() => {
            console.log('no version of rvm is installed on this computer');
        })
        .then(rvmVersion => { // install rvm
            if (!rvmVersion) {
                return installRvm(installRvmForMacLinux);
            }
        })
        .then(() => { // find highest local version of ruby installed
            let getLocalRubyOptions = {
                resolve: (resolve, data) => {
                    let versions = data.match(versionPattern);
                    let highestVersion = (versions) ? setup.getMaxCompatibleVersion(versions, rubyVersion) : versions;
                    resolve(highestVersion);
                }
            };
            return setup.executeSystemCommand(rvmGetAllLocalRubyVersions, getLocalRubyOptions);
        })
        .then(rubyVersion => { // get all remote versions of ruby
            localRubyVersion = (rubyVersion) ? {ruby: rubyVersion} : {};
            return setup.executeSystemCommand(rvmGetAllRemoteRubyVersions, {resolve: options.resolve})
        })
        .then(allVersions => { // get the highest compatible version of ruby from remote
            let rvmRubyPattern = /\[ruby-]([.0-9]+)\[([.0-9-a-z]+)]/g;
            let match = rvmRubyPattern.exec(allVersions);
            let versions = [];
            while (match !== null) {
                versions.push(match[1] + match[2]);
                match = rvmRubyPattern.exec(allVersions);
            }
            return setup.getMaxCompatibleVersion(versions, rubyVersion);
        })
        .then(remoteRubyVersion => { // install highest compatible version of ruby
            let rubyUpdates = setup.findRequiredAndOptionalUpdates(localRubyVersion, rubyVersionObject, [{name: 'ruby', highestCompatibleVersion: remoteRubyVersion}]);
            if (rubyUpdates.required.length > 0) {
                console.log('installing ruby now.');
                return installRubyWithRvm(remoteRubyVersion);
            } else if (rubyUpdates.optional.length > 0) {
                return setup.confirmOptionalInstallation('do you want to install this optional ruby upgrade now (y/n)?  ', () => installRubyWithRvm(remoteRubyVersion));
            }
        })
        .then(rubyVersion => { // set the new version as default
            return setup.executeSystemCommand(setup.convertToBashLoginCommand(rvmSetLocalRubyDefault + rubyVersion), options)
                .then(() => {
                    console.log('ruby install complete. default version is now ' + rubyVersion + '.');
                });
        })
        .catch(error => { // handle failure
            console.log('ruby install failed with the following message:\n' + error);
        });
};

module.exports = {
    installRuby: installRuby
};