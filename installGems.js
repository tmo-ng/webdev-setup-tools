/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js');
const globalGems = setup.getProjectGlobals('gems');
const operatingSystem = setup.getOperatingSystem();
const options = setup.getOptions();
let installGems = () => {
    let gemVersionPattern = /([a-z-A-Z0-9]+) \(([0-9]+(?:\.[0-9]+)+)/g;
    let getGlobals = modules => setup.getAllUserGlobals(modules, gemVersionPattern);
    let findVersion = (dependency, projectGlobals) => {
        //powershell.exe -command "gem list `\"^^sass`$`\" -r -a"
        let searchPattern = (operatingSystem === 'win32') ? '`\\"^^' + dependency + '`$`\\"' : '^' + dependency + '$';
        let gemListRemote = setup.getSystemCommand('gem list ' + searchPattern + ' -r -a');
        return setup.findHighestCompatibleVersion(dependency, projectGlobals, gemListRemote);
    };
    let localGems;
    let remoteGems;
    let gemUpdates;
    let gemListLocal = setup.getSystemCommand('gem list');
    console.log('getting installed gems.');
    return setup.findUserGlobals(gemListLocal, getGlobals)
        .then(globals => {
            localGems = globals;
            return setup.runListOfPromises(globalGems, findVersion);
        })
        .then(gems => {
            remoteGems = gems;
            gemUpdates = setup.findRequiredAndOptionalUpdates(localGems, gems, remoteGems);
            if (gemUpdates.required.length > 0) {
                let gemInstall = setup.getSystemCommand(setup.getInstallationCommand(gemUpdates.required, 'gem install', ':'));
                return setup.executeSystemCommand(gemInstall, options);
            }
        })
        .then(() => {
            if (gemUpdates.optional.length > 0) {
                console.log('gem updates exist for the following packages: ');
                setup.listOptionals(gemUpdates.optional);
                return setup.confirmOptionalInstallation('do you want to install these optional gem updates now (y/n)?  ', () => {
                    let gemInstall = setup.getSystemCommand(setup.getInstallationCommand(gemUpdates.optional, 'gem install', ':'));
                    return setup.executeSystemCommand(gemInstall, options);
                });
            }
        })
        .then(() => {
            console.log('all gem packages are up to date.');
        });
};

module.exports = {
    installGems: installGems
};