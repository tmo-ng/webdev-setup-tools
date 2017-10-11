<img align="right" src="./documentation/images/T-Mobile-NextGen-Magenta-Tiny.png" alt="...">

webdev-setup-tools
=======================



webdev-setup-tools is a suite of tools designed to streamline the installation and
setup of the most common tools used in modern web development.

## Install with npm
  npm install webdev-setup-tools --save

## Inspiration
One of the hardest parts of joining a modern software development team can be
getting the tools for development properly configured. This is especially common
on larger teams, that employ a number of contractors.
This can take anywhere from several hours to several days and is a major source
of frustration and headaches to both software developers and their managers.
This has been the primary motivation for the development of this suite of tools.



## Purpose
* Automate tool setup and configuration for modern software development teams
    * Manually, this can take from several hours to days.
* Cross Platform setup of all tools (tested on Windows 7, Windows 10, OSX and Linux)
* Only compatible updates are installed
* Tool setup configuration committed with project source code

This package was designed to be cross platform and openly configurable for the set of tools required by your project.
It was developed to work on Windows 7+, OSX, and Linux. It has been tested on Windows 7, Windows 10,
OSX 10.11 (El Capitan), and Ubuntu 16.04 and 17.04.
Furthermore it was also designed to be idempotent in that it can be run multiple times without changing the result.
It was also developed to keep user dependencies up to date. For this reason, it can be run regularly. 

When newer packages become available and the user
has an older compatible version of a package, the user can choose to ignore an update. If a user has
an older incompatible package, this package will be updated to the highest compatible version of the package
automatically. 

## webdev-setup-tools plugins
webdev-setup-tools has a number of plugins available for installation including
* [`webdev-setup-tools-npm-globals `](https://github.com/cdejarlais/webdev-setup-tools-npm-globals)
* [`webdev-setup-tools-aem `](https://github.com/cdejarlais/webdev-setup-tools-aem)
* [`webdev-setup-tools-ruby `](https://github.com/cdejarlais/webdev-setup-tools-ruby)
* [`webdev-setup-tools-gems `](https://github.com/cdejarlais/webdev-setup-tools-gems)
* [`webdev-setup-tools-java `](https://github.com/cdejarlais/webdev-setup-tools-java)
* [`webdev-setup-tools-maven `](https://github.com/cdejarlais/webdev-setup-tools-maven)


## Usage
copy the setup-scripts folder from this npm package into your project root, modify your package.json to identify the tools and versions you need installed (see README in setup-scripts for sample project configuration), and add a setup.js file to setup-scripts folder (you can rename the sample and modify).

## Configuration
This package should be installed using npm as identified in the package.json in your project root.
This suite of tools looks for the "web-dev-setup-tools" property in the package.json.
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
### Important Notes For Windows Users
Due to built in Windows security features and restrictions, there are a number of additional steps that need to be taken by windows users.  

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

**Note:**  To set the powershell execution policy for windows, copy and paste the following command in
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
