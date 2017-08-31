/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js');
const operatingSystem = setup.getOperatingSystem();
const options = setup.getOptions();
const windowsPackages = setup.getProjectGlobals('windows');
const npmPackages = setup.getProjectGlobals('npm');
const seconds = 1000;
const minutes = 60 * seconds;

let installGlobalNpmDependencies = () => {
    let userState = {};
    let findVersion = (dependency, projectGlobals) => {
        let getNpmPackageVersions = setup.getSystemCommand('npm info ' + dependency + ' versions --json');
        return setup.findHighestCompatibleVersion(dependency, projectGlobals, getNpmPackageVersions);
    };
    let getGlobals = modules => {
        return setup.getAllUserGlobals(modules, /([a-z-A-Z]+)@([0-9]+(?:\.[0-9-a-z]+)+)/g);
    };
    const npmListUserGlobals = setup.getSystemCommand('npm ls -g');
    const npmInstallModuleAsGlobal = 'npm install -g';
    console.log('getting installed node modules.');
    return setup.findUserGlobals(npmListUserGlobals, getGlobals)
        .catch(error => { // this will catch if the user has unmet dependencies on existing npm packages
            console.log(error);
        })
        .then(userGlobals => {
            userState.userGlobals = userGlobals;
            if (operatingSystem === 'win32') { // flag for additional install requirements
                userState.windows = {};
                return setup.runListOfPromises(windowsPackages, findVersion)
                    .then(windowsPackages => {
                        let windowsUpdates = setup.findRequiredAndOptionalUpdates(userGlobals, windowsPackages, windowsPackages);
                        userState.windows.required = windowsUpdates.required;
                        userState.windows.optional = windowsUpdates.optional;
                        if (userState.windows.required.length > 0) {
                            console.log('installing required windows packages.');
                            return Promise.race([setup.executeSystemCommand(setup.getSystemCommand(setup.getInstallationCommand(userState.windows.required, npmInstallModuleAsGlobal, '@')), { resolve: options.resolve }),
                                setup.handleUnresponsiveSystem(2 * minutes, 'The system is not responding.\ndo you want to keep waiting (y/n)?  ')]);
                        }
                    })
            }
        })
        .then(() => setup.runListOfPromises(npmPackages, findVersion)
            .then(npmPackages => {
                userState.npm = {};
                let npmUpdates = setup.findRequiredAndOptionalUpdates(userState.userGlobals, npmPackages, npmPackages);
                userState.npm.required = npmUpdates.required;
                userState.npm.optional = npmUpdates.optional;
                if (userState.npm.required.length > 0) {
                    console.log('installing required npm packages.');
                    return setup.executeSystemCommand(setup.getSystemCommand(setup.getInstallationCommand(userState.npm.required, npmInstallModuleAsGlobal, '@')), options);
                }
            }))
        .then(() => {
            if (userState.windows && userState.windows.optional.length > 0) {
                console.log('windows updates exist for the following packages: ');
                setup.listOptionals(userState.windows.optional);
                return setup.confirmOptionalInstallation('do you want to install these optional windows updates now (y/n)?  ',
                    () => setup.executeSystemCommand(setup.getSystemCommand(setup.getInstallationCommand(userState.windows.optional, npmInstallModuleAsGlobal, '@')), options));
            }

        })
        .then(() => {
            if (userState.npm.optional.length > 0) {
                console.log('npm updates exist for the following packages: ');
                setup.listOptionals(userState.npm.optional);
                return setup.confirmOptionalInstallation('do you want to install these optional npm updates now (y/n)?  ',
                    () => setup.executeSystemCommand(setup.getSystemCommand(setup.getInstallationCommand(userState.npm.optional, npmInstallModuleAsGlobal, '@')), options));
            }
        })
        .then(() => {
            console.log('all npm packages are up to date.');
            return userState;
        })
        .catch(error => {
            console.error('Failed!', error);
        });
};

module.exports = {
    installNpmGlobals: installGlobalNpmDependencies
};