tmng-setup-tools
================

A small library of utility functions designed to setup necessary development
tools for the TMNG team at T-Mobile. This package was designed to be installed in the
node modules folder at the project root. From there it parses the required "globals"
field in the package.json looking for all packages to install.
It was designed to be largely idempotent. That is, after the the system is properly configured,
no new modifications will be made. It will prompt for updates when updates for certain packages become
available, and it uses the semantic versions in the globals field to identify the correct versions to install.

## Installation

  npm install tmng-setup-tools --save

## Usage
  // install ruby, required gems, install java, install maven, install all aem dependencies
  node -e "require('tmng-setup-tools').installEverything()"

  // install maven and configure environment variables
  node -e "require('tmng-setup-tools').installMaven()"

  // download and install all required aem dependencies
  node -e "require('tmng-setup-tools').installAem()"

  // install ruby and configure environment variables
  node -e "require('tmng-setup-tools').installRuby()"

## Release History

* 0.1.0 Initial release