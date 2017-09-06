webdev-setup-tools
=======================

A small library of core utility functions used by the webdev-setup-tools plugins. This package should be installed in the
node modules folder located in the root of the project folder.
It determines the packages to install from the "globals" field in the package.json in the project root.

It was designed to be largely idempotent. That is, after the the system is properly configured,
no new modifications will be made. However, it was also developed to keep user dependencies up to
date. For this reason, it should be run regularly. When newer packages become available and the user
has an older compatible version of a package, the user can choose to ignore an update. If a user has
an older incompatible package, this package will be updated to the highest compatible version of the package
automatically.

It was also developed to work on Windows 7+, OSX, and Linux. It has been tested on Windows 7, Windows 10,
OSX 10.11 (El Capitan), and Ubunto 16.04 and 17.04.

## webdev-setup-tools plugins
webdev-setup-tools has a number of plugins available for installation including
* [`webdev-setup-tools-npm `](https://github.com/cdejarlais/webdev-setup-tools-npm)
* [`webdev-setup-tools-aem `](https://github.com/cdejarlais/webdev-setup-tools-aem)
* [`webdev-setup-tools-ruby `](https://github.com/cdejarlais/webdev-setup-tools-ruby)
* [`webdev-setup-tools-gems `](https://github.com/cdejarlais/webdev-setup-tools-gems)
* [`webdev-setup-tools-java `](https://github.com/cdejarlais/webdev-setup-tools-java)
* [`webdev-setup-tools-maven `](https://github.com/cdejarlais/webdev-setup-tools-maven)

## Installing Npm Package

  npm install webdev-setup-tools --save
## Setup Scripts
Two setup scrips, setup.bat (windows) and setup.sh (osx/linux), are included at the root of the npm package.

**setup.sh:** To run setup.sh, navigate to the node_modules/webdev-setup-tools folder in a terminal window, and enter the following commands:
  ```sh
  chmod 755 setup.sh
  ./setup.sh
  ```
This script first installs node version manager (nvm) locally. It then installs the most recent version of node.
Each time the script is run after the initial install, it will check for newer versions of node.
When an update becomes available, it will prompt the user for confirmation, then install the newest version of node.



**setup.bat:** To run setup.bat, navigate to node_modules/webdev-setup-tools folder in a command prompt with administrative priveleges, and enter the following command:
```sh
setup.bat
```
This batch file first downloads the latest msi package from the official nodejs repository, then performs a silent
installation of the msi package. Each time the script is run after the initial install, it will check for newer versions of node.
When an update becomes available, it will prompt the user for confirmation, then update to the newest version of node.
## Usage
**Note:** summary of the most common methods used in the plugins

  download a package from the specified url
  ```sh
  let setup_tools = require('webdev-setup-tools');
  setup_tools.downloadPackage('http://apache.mirrors.tds.net/3.5.0/binaries/apache-maven-3.5.0-bin.zip', 'C:\'); // download file to destination 'C:\'
  ```
  get a command formatted for either bash or powershell depending on the operating system
  ```sh
  let setup_tools = require('webdev-setup-tools');
  setup_tools.getSystemCcmmand('java -jar setup.jar');
  ```
  get object with version and downloadHyperlink fields from a webpage for the highest values in semantic version range
  ```sh
  let setup_tools = require('webdev-setup-tools');
  let versionRange = '~3.0.0';
  let downloadPattern = /http[^"]+maven-([0-9.]+)-bin\.tar\.gz/g;
  let mavenUrl = 'https://maven.apache.org/download.cgi';
  return setup_tools.getVersionWithRequest(mavenUrl, downloadPattern, versionRange);
  ```









### Important Notes

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


## Release History

* 1.0.0 Initial release