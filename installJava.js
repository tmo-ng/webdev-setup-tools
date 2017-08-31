/**
 * Created by CDejarl1 on 8/30/2017.
 */
const setup = require('./setup.js');
const operatingSystem = setup.getOperatingSystem();
const options = setup.getOptions();
const versionPattern = setup.getVersionPattern();
const requiredJavaVersion = setup.getProjectGlobals('engines')['java'];
let walkThroughjdkInstall = () => {
    return setup.displayUserPrompt('This prompt was developed to walk a user through\nthe installation and setup of the official oracle java jdk.' +
        '\nWhen a step has been completed, press enter to continue to the next step.\nPlease press enter to begin.')
        .then(() => setup.displayUserPrompt('go to the url http://www.oracle.com/technetwork/java/javase/downloads'))
        .then(() => setup.displayUserPrompt('click on the jdk download link to be redirected to the download page for all systems.'))
        .then(() => setup.displayUserPrompt('accept the license agreement, then download the version matching your operating system.' +
            '\nFor most Apple OSX users, this auto configures your path, so you can ignore the subsequent steps.'))
        .then(() => {
            if (operatingSystem === 'win32') {
                return setup.displayUserPrompt('accept the default path and tools for your new java installation.');
            }
        })
        .then(() => setup.displayUserPrompt('after the download, you will need to first unzip this folder,\nthen add this location to your system path.'))
        .then(() => {
            let displayPrompt = (operatingSystem === 'win32') ? 'type "environment variables" into your start button menu or search bar and click enter.' : 'press ctrl + alt + t to launch a terminal';
            return setup.displayUserPrompt(displayPrompt);
        })
        .then(() => {
            let displayPrompt = (operatingSystem === 'win32') ? 'click on the "environment variables" button near the bottom.' : 'type nano (or your text editor of choice) ~/.bash_profile (.bashrc, .bash_profile, .zshrc, etc.) and press enter';
            return setup.displayUserPrompt(displayPrompt);
        })
        .then(() => {
            let displayPrompt = (operatingSystem === 'win32') ? 'in the lower window marked "system variables" you should see a variable marked "Path".\nClick on this value to modify it.' :
                'Scroll to the end of the file. If java has not been added to your environment, you can add it with the followind:\nJAVA_HOME=/usr/lib/jvm/{your java version here}\nexport JAVA_HOME\nSave the file and exit. ' +
                'reload the system path by pressing . /etc/environment or close the terminal.';
            return setup.displayUserPrompt(displayPrompt);
        }).then(() => {
            if (operatingSystem === 'win32') {
                return setup.displayUserPrompt('click on the button labeled "New", or double click on "Path"');
            }
        })
        .then(() => {
            if (operatingSystem === 'win32') {
                return setup.displayUserPrompt('paste the path to your java sdk in this box. typically, this path is of ' +
                    'the form\nC:\\Program Files\\Java\\jdk1.8.0_141\\bin, but this is unique to each installation.');
            }
        })
        .then(() => {
            if (operatingSystem === 'win32') {
                return setup.displayUserPrompt('Next, you will need to add a System Variable for "JAVA_HOME".\nClick new under the box for system variables.\nA box should pop up with values ' +
                    'for the variable name and the value. Enter "JAVA_HOME" as the name.\nFor the value, Enter "C:\\Program Files\\Java\\jdk1.8.0_141", but this is unique to each installation.');
            }
        }).then(() => {
            return setup.displayUserPrompt('open a new terminal then type "javac -v".\nIf this was done correctly, you should see output like "javac 1.8.0_141".');
        })
        .then(() => {
            return setup.displayUserPrompt('This concludes the java jdk setup.');
        });
};

let installJava = () => {
    let javaOptions = {};
    javaOptions.resolve = options.resolve;
    javaOptions.stderr = (resolve, reject, data) => { // by default the output is directed to stderr
        resolve(data);
    };
    console.log('checking java version compatibility.');
    let checkJavaCompilerVersion = setup.getSystemCommand('javac -version'); // important to test the java compiler
    return setup.executeSystemCommand(checkJavaCompilerVersion, javaOptions)
        .catch(() => { //java commands are redirected to stderr in both windows and linux environments
            console.log('no jdk version found on this computer');
            return walkThroughjdkInstall();
        })
        .then(javaVersion => {
            if (javaVersion) {
                let version = javaVersion.match(versionPattern);
                if (version && setup.isPackageCompatible(version[0], requiredJavaVersion)) {
                    console.log('java version ' + version[0] + ' is up to date');
                    return;
                }
                console.log('no compatible jdk version found on this computer');
                return walkThroughjdkInstall();
            }
        });
};

module.exports = {
    installJava: installJava
};