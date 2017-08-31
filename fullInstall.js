/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js');
const ruby = require('./installRuby.js');
const npm = require('./installNpmPackages.js');
const maven = require('./installMaven.js');
const aem = require('./installAem.js');
const gems = require('./installGems.js');
const java = require('./installJava.js');

let fullInstall = () => {
    ruby.installRuby()
        .then(() => gems.installGems())
        .then(() => npm.installNpmGlobals())
        .then(() => setup.installAngularUiDependenciesWithYarn())
        .then(success => {
            if (!success) {
                console.log('failed to build angular dependencies, aborting webdriver update');
                return;
            }
            return setup.updateWebdriver();
        })
        .then(() => java.installJava())
        .then(() => maven.installMaven())
        .then(() => setup.runGruntPremerge())
        .then(() => aem.installAem())
        .then(() => setup.endProcessWithMessage('For angular development, run command "grunt host".\nFor AEM development, start the crx-quickstart server.', 5 * seconds, 0));
};
module.exports = {
    fullInstall: fullInstall
};