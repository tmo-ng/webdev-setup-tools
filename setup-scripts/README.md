webdev-setup-tools
=======================

## Setup Scripts
A number of configuration scripts are included in this folder.
setup.bat (windows) and setup.sh (osx/linux), one powershell script nodeInstallerScript.ps1, and a sample script to setup.js are included in the setup-scripts folder.

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
