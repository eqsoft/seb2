Documentation
=============

## Getting Started ##
Please check the **Requirement** section in the README.md first.
Have a look at the seb config files: ``` seb2/browser/app/config.json ```
and the startup scripts *.sh or *.bat: ``` seb2/browser/bin/*/* ```
There are also some example start scripts.

## Debugging ##
For debugging see the example in the ``` debug mode ``` section of the start script. 
The ``` -debug 1 ``` parameter enables detailed log messages and loads the ``` debug_prefs.js ```.
The ``` -jsconsole ``` parameter opens the javascript debugging window.

## Configuration in config.json ##
Special seb configuration parameter are prefixed with ``` seb* ```, all other parameters are shared with the windows and mac SEB binaries versions.
There are also rules for the direct and a functional mapping of SEB configs to the seb xulrunner/firefox prefs.
For the functional mapping there must be a correspondant function defined in the ``` SebConfig.jsm ```.
