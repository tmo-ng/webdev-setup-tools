![T-Mobile](../images/T-Mobile-NextGen-Magenta-Tiny.png)

webdev-setup-tools
=======================
## Setup Scripts
The following configuration scripts are included in this folder:

* setup.sh (osx/linux)
* setup.bat (windows)
* nodeInstallerScript.ps1 (windows)
* example-setup.js

**setup.sh:** To run setup.sh, navigate to the node_modules/webdev-setup-tools/setup-scripts folder in a terminal window, and enter the following commands:
  ```sh
  chmod 755 setup.sh
  ./setup.sh
  ```
setup.sh performs the following actions:
* installs node version manager (nvm) locally
* installs/updates local version of node
* runs the setup.js file in setup-scripts folder


**setup.bat:** To run setup.bat, navigate to node_modules/webdev-setup-tools/setup-scripts folder in a command prompt with administrative priveleges, and enter the following command:
```sh
setup.bat
```
setup.bat performs the following actions:
* verifies minimum system requirements are met
* installs/updates local version of node
* runs the setup.js file in setup-scripts folder

**nodeInstallerScript.ps1:** This is a helper script for the main windows setup.bat
that performs the following actions:
* Checks the locally installed version of powershell
* Checks for the most recent node version

**example-setup.js:** This script displays a sample tool setup procedure

The following snippet from example-setup.js displays how to import all required modules for a full installation:
  ```sh
const setup = require('webdev-setup-tools'); // import core module
const ruby = require('webdev-setup-tools-ruby'); // import ruby plugin
const npm = require('webdev-setup-tools-npm-globals'); // import npm plugin
const maven = require('webdev-setup-tools-maven'); // import maven plugin
const aem = require('webdev-setup-tools-aem'); // import aem plugin
const gems = require('webdev-setup-tools-gems'); // import gems plugin
const java = require('webdev-setup-tools-java'); // import java plugin
  ```

The following snippet from example-setup.js displays an example installation procedure:
  ```sh
let fullInstall = () => {
    ruby.installRuby() // install ruby
        .then(() => gems.installGems()) // install gems
        .then(() => npm.installNpmPackages()) // install npm packagea
        .then(() => java.installJava()) // walk through java installation
        .then(() => maven.installMaven()) // install maven
        .then(() => aem.installAem()) // install aem
        .then(() => setup.endProcessWithMessage('You are now ready for development.',
            5 * seconds, 0)); // finish installation with message
};
fullInstall();
  ```

### Important Notes For Windows Users

**Note:** In order to install most packages, users will need to have administrative access on their computer.

**Note:** Users running Windows must have powershell script execution enabled. Powershell script execution
is disabled by default as a security feature on many windows distributions. Script execution policy
can either be set to "remotesigned" or "unrestricted", although it is recommended to set the
policy to "remotesigned" to maintain the highest level of security.

**Note:**  To view the current powershell execution policy for windows, copy and paste the following command in
a command prompt:

```sh
  powershell.exe -command "get-executionpolicy"
  ```

**Note:**  To view the set the powershell execution policy for windows, copy and paste the following command in
a command prompt:

```sh
  powershell.exe -command "set-executionpolicy remotesigned"
  ```

**Note:** Users running Windows 7 must upgrade to powershell 3.0 ([`Windows Management Framework 3.0`](https://www.microsoft.com/en-us/download/details.aspx?id=34595)).
By default, Windows 7 comes installed with powershell 2.0. Installation typically requires a system restart.
Users running windows 8 and above have all minimum powershell tools installed by default.

**Note:** .net framework version 4.5 or above is required for script execution on Windows.
This is a prerequisite for many modern software packages, but is not present on Windows 7
out of the box.
