webdev-setup-tools
=======================

A small library of core utility functions used by the webdev-setup-tools plugins.

## Install with npm

  npm install webdev-setup-tools --save

## Purpose
One of the hardest parts of joining a modern commercial software development team can be getting the tools for development properly configured. This is
especially common on larger teams, that often contain employees from numerous consultancy firms. This can take anywhere from several weeks to
several months and is a major source of frustration and headaches to both software developers and their managers. This has been the primary motivation
for the development of this package. That is, to automate tool setup and configuration for modern commercial software development teams that are a mix of
contract and full time employees, and equipment is not standardized. Many large tech companies have in house automation software, but it is frequently constrained
to one particular operating system and a small set of company sponsored tools.

The package was designed to be idempotent. That is, after the the system is properly configured,
no new modifications will be made. However, it was also developed to keep user dependencies up to
date. For this reason, it should be run regularly. When newer packages become available and the user
has an older compatible version of a package, the user can choose to ignore an update. If a user has
an older incompatible package, this package will be updated to the highest compatible version of the package
automatically. It was also developed to work on Windows 7+, OSX, and Linux. It has been tested on Windows 7, Windows 10,
OSX 10.11 (El Capitan), and Ubunto 16.04 and 17.04.

## Configuration

This package should be installed in the
node modules folder located in the root of the project folder.
It determines the packages to install from the "web-dev-setup-tools" field in the package.json in the project root.
This field typically has the following syntax:


```sh
"web-dev-setup-tools": {
  "node": {
    "install": ">=7.0.0",
    "globals": {
       // npm packages to install ...
    }
  },
  "ruby": {
    "install": "^2.0.0",
    "gems": {
      // gems to install ...
    }
  },
  "maven": "3.5.0",
  "aem": {
    // aem package configuration ...
  },
  "java": ">1.7.0"
}
```





## webdev-setup-tools plugins
webdev-setup-tools has a number of plugins available for installation including
* [`webdev-setup-tools-npm-globals `](https://github.com/cdejarlais/webdev-setup-tools-npm-globals)
* [`webdev-setup-tools-aem `](https://github.com/cdejarlais/webdev-setup-tools-aem)
* [`webdev-setup-tools-ruby `](https://github.com/cdejarlais/webdev-setup-tools-ruby)
* [`webdev-setup-tools-gems `](https://github.com/cdejarlais/webdev-setup-tools-gems)
* [`webdev-setup-tools-java `](https://github.com/cdejarlais/webdev-setup-tools-java)
* [`webdev-setup-tools-maven `](https://github.com/cdejarlais/webdev-setup-tools-maven)


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
  setup_tools.getSystemCommand('java -jar setup.jar');
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