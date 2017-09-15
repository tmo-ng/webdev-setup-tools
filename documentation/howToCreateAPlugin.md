![T-Mobile](./images/T-Mobile-NextGen-Magenta-Tiny.png)

How To Create a Plugin
======================
Some of the core methods used by the existing plugins

## Usage
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