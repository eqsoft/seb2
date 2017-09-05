Standalone Browser Component of Safe-Exam-Browser
=================================================

This is the core browser component for Safe-Exam-Browser.
For SEB binary releases please refer to http://www.safeexambrowser.org

Refactored seb:

* general code refactoring
* splitted seb.jsm into functional modules
* getting rid of xullib.jsm
* improved config mode
* improved nodejs based seb server with native html5 support without binaryjs and jquery

## OS Support ##

* Windows 32/64Bit
* Linux   32/64Bit
* OSX 10.x 64Bit

## Requirements ##

Cloning seb2 repo:

```
git clone https://github.com/eqsoft/seb2.git
```

### Firefox installation

Since Mozilla canceled the provisioning of xulrunner binaries, we restricted seb2 hosting to a native Firefox 52.x ESR.

* Download Firefox ESR binaries: https://www.mozilla.org/en-US/firefox/organizations/all/
* Proceed a **USER DEFINED(!)** installation setup to the prepared Firefox folders, otherwise your local Browser installation will be damaged!

```
./firefox/YOUR_OS/XXBit/
```

**!WARNING**: deny automatic (re)starting of Firefox after installation setup is finished, otherwise your local Firefox profile will be damaged!

* you may start the standalone Firefox for testing or upgrading the ESR Firefox binaries, so manually replacing 52.x ESR versions is not required:

```
./firefox/YOUR_OS/firefoxXXBit.bat (or firefoxXXBit.sh for linux and mac)
```

The start script populates the local profile folders:

```
./firefox/YOUR_OS/firefoxProfileXXBit/
```

## Quick Start

After cloning the repo and installation of a local Firefox 52.x ESR you can start seb2 with a default config:

```
./browser/bin/YOUR_OS/XXBit/start.sh
```

debug mode:

```
./browser/bin/YOUR_OS/XXBit/debug.sh
```

The debug mode creates a log file: ./browser/bin/YOUR_OS/sebProfileXXBit/seb.log
You can increase the verbosity of the logfile in the debug.sh:

```
-debug 2
``` 

Closing seb2:
Right click on the taskbar icon to close the main browser window. The default password is: ```password```.

## Configuration ##

seb2 first loads a set of default configuration params in ```./browser/app/default.json``` and then looks for a runtime config in the commandline param ``` -config PARAM ```. 
The commandline parameter might be:
* any absolute path
* any url with file:// or http(s) protocol to a local or remote config json file. 
* the param can also be a stringified or a base64 encoded json object. A base64 encoded string param is used by windows SEB configuration of the embedded seb2
* just a filename p.e. ```config.dev.json``` placed in ```./browser/app/config.*.json```

The custom config object is merged into the default config object with the precedence of custom config params.

There are three kinds of configuration params:

* only used in standalone seb (prefixed with seb*)
* only used in embedded seb
* used in both modes  

The params are listed in alphabetical order:

#### Parameter

* type: datatype (default)
* description
* optional examples
* optional links to acssociated params

## seb2 (only standalone, not handled by Windows SEB) ##

#### sebAllCARootTrust ####

* type: boolean (true)
* lax testing of embedded CA certificates, means that at least one trusted CA must be embedded, which signed the requested server cert. Setting to **false** means that the whole certificate chain must be embedded (p.e. root-ca and signing-ca). 
* [embeddedCertificates](####embeddedCertificates)  

#### sebBrowserRequestHeader ####
#### sebDisableOCSP ####
#### sebMainBrowserWindowTitlebarEnabled ####
#### sebMainBrowserWindowMaximized ####
#### sebNewBrowserWindowByLinkTitlebarEnabled ####
#### sebNewBrowserWindowMaximized ####
#### sebPrefs ####
#### sebPrefsMap ####
#### sebServer ####
#### sebScreenshot ####
#### sebScreenshotImageType ####
#### sebScreenshotSound ####
#### SebServerEnabled ####
#### sebSSlSecurityPolicy ####

## SEB (handled by both: Windows SEB and embedded seb2 ) ##

#### additionalResources ####
#### allowBrowsingBackForward ####
#### allowQuit ####
#### allowSpellCheck ####
#### blacklistURLFilter ####
#### blockPopUpWindows ####
#### browserExamKey ####
#### browserMessagingPingTime ####
#### browserMessagingSocket ####
#### browserMessagingSocketEnabled ####
#### browserScreenKeyboard ####
#### browserURLSalt ####
#### browserUserAgent ####
#### browserViewMode ####
#### browserWindowTitleSuffix ####
#### downloadDirectoryWin ####

#### embeddedCertificates ####
* type: array ([])
* description

#### enableBrowserWindowToolbar ####
#### enableJava ####
#### enableJavaScript ####
#### enablePlugIns ####
#### enableZoomPage ####
#### enableZoomText ####
#### hashedQuitPassword ####
#### mainBrowserWindowHeight ####
#### mainBrowserWindowPositioning ####
#### mainBrowserWindowWidth ####
#### newBrowserWindowByLinkBlockForeign ####
#### newBrowserWindowByLinkHeight ####
#### newBrowserWindowByLinkPolicy ####
#### newBrowserWindowByLinkPositioning ####
#### newBrowserWindowByLinkWidth ####
#### newBrowserWindowByScriptBlockForeign ####
#### newBrowserWindowByScriptPolicy ####
#### pinEmbeddedCertificates ####
#### proxies ####
#### quitURL ####
#### removeBrowserProfile ####
#### restartExamPasswordProtected ####
#### restartExamText (not implemented) ####
#### restartExamURL (not implemented) ####
#### restartExamUseStartURL (not implemented) ####
#### sendBrowserExamKey ####
#### showReloadWarning ####
#### showTaskBar ####
#### startURL ####
#### taskBarHeight ####
#### touchOptimized ####
#### urlFilterTrustedContent ####
#### urlFilterRegex ####
#### whitelistURLFilter ####
#### zoomMode ####

## Websocket Handler ##


```

```
