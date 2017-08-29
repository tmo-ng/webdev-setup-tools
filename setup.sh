#!/usr/bin/env bash
#load nvm into current environment
#node -e "console.log(require('semver').outside($localVersion, require('../package.json').globals.engines.node, '<'))"
load_nvm_script () {
  #this assumes the recommended installation directory of ~/.nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
}
get_local_node_version () {
    currentVersion=$(nvm current | grep -o -E '[0-9]+(\.[0-9]+){1,}' 2> null)
    echo "$currentVersion"
}
get_latest_node_version () {
    latestVersion=$(nvm ls-remote | grep -o -E '[0-9]+(\.[0-9]+){1,}' | tail -1)
    echo "$latestVersion"
}
#install and use node version
install_node_version () {
    #install latest version, and migrate npm to new version
    latestVersion=$(get_latest_node_version)
    if nvm install $latestVersion
    then
        nvm alias default $latestVersion
        nvm use $latestVersion
    else
        echo "install failed for node"
    fi
}
perform_optional_update () {
    localVersion=$1
    latestVersion=$2
    if [[ $localVersion != $latestVersion ]]; then
        echo -n "would you like to update node now(y/n)? "
        read response
        if [[ $response != "n" ]]; then
            echo "updating node now.."
            nvm install $latestVersion
            nvm alias default $latestVersion
            nvm use $latestVersion
        else
            echo "ignoring node update"
        fi
    else
        echo "local node version $localVersion is up to date"
    fi
}
local_is_not_compatible () {
  localVersion=$1
  isCompatible=$(node -e "console.log(require('semver').outside('$localVersion', require('./package.json').globals.engines.node, '<'))")
  echo "$isCompatible"
}
#install dependencies required by setup.js
install_package_dependencies () {
    if cd ../../; then
        npm install
    fi
}
run_full_nvm_install () {
    if curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
    then
        load_nvm_script
        install_node_version
        install_package_dependencies
    else
        echo "could not download nvm"
    fi
}

main () {
    if [[ ! -e ~/.bash_profile ]]; then
        > ~/.bash_profile
    fi
    if [[ ! -e ~/.bashrc ]]; then
        > ~/.bashrc
    fi
    load_nvm_script
    LOCAL_VERSION=$(get_local_node_version)
    if [ -z "$LOCAL_VERSION" ]; then
        echo "no version of nvm detected detected, installing now"
        run_full_nvm_install
    else
        echo "now installing required package dependencies"
        install_package_dependencies
        #check here for compatibility
        echo "you are currently using node version $LOCAL_VERSION"
        if [[ $(local_is_not_compatible $LOCAL_VERSION) == "true" ]]; then
            echo "local version of node is out of date, updating now."
            install_node_version
            nvm reinstall-packages $LOCAL_VERSION
        else
            REMOTE_VERSION=$(get_latest_node_version)
            echo "the latest version available is $REMOTE_VERSION"
            perform_optional_update $LOCAL_VERSION $REMOTE_VERSION
        fi
    fi
    echo "beginning full install"
    bash -l -c "node -e \"require('./node_modules/webdev-setup-tools/setup.js').installEverything()\""
}
main
