Standalone Browser Component of Safe-Exam-Browser
=================================================
This is the core browser component for Safe-Exam-Browser.
For SEB binary releases please go to http://www.safeexambrowser.org

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

Clone the seb2 repo:

```
git clone https://github.com/eqsoft/seb2.git
```

### Firefox installation

Since Mozilla canceled the provisioning of xulrunner binaries, we restricted seb2 hosting to a native Firefox 52.x ESR.

* Download Firefox ESR binaries: https://www.mozilla.org/en-US/firefox/organizations/all/
* Proceed a **USER DEFINED(!)** installation setup to the prepared Firefox folders, otherwise your local Browser installation will be replaced!
```
./seb2/firefox/YOUR_OS/XXBit/
```
**!WARNING**: deny automatic (re)starting of Firefox after installation setup is finished, otherwise your local Firefox profile will be replaced!
* you may start the standalone Firefox for testing or upgrading the ESR Firefox binaries, so you don't need to download and replace single 52.x ESR versions:
```
./seb2/firefox/YOUR_OS/firefoxXXBit.bat (or firefoxXXBit.sh for linux and mac)
```

The start scripts are using the prepared local profile folders:

```
./seb2/firefox/YOUR_OS/firefoxProfileXXBit/
```

### seb server (for developer only)

For seb server and demo mode including the screenshot component you need to install node.js (http://nodejs.org/).
After installing node.js you need to install some node modules:

```
npm install -g fs-extra express serve-static serve-index ws basic-auth
```
Switch to ``` seb2/server/ ``` folder and type:

```
server.sh (Linux, Mac) or server.bat (Windows)
```
If you get an error message that node can not find the modules try to set an environment variable in 
​``` ~/.bashrc ``` or ``` ~/.profile ```

p.e.: 
​``` export NODE_PATH=/usr/lib/node_modules ```

## Quick Start

After cloning the repo and installation of a local Firefox 52.x ESR you can start seb2 with a default config:

```

```



## Configuration ##

seb2 first loads a set of default configuration params in ./browser/app/default.json and then looks for a runtime config in the commandline param ``` -config PARAM ```. The commandline parameter might be an absolute path or any url to a local or remote config json file. The param can also be a stringified or a base64 encoded json object. A base64 encoded string param is used by windows SEB configuration of the embedded seb2.
The custom config object will then be be merged to the default config object with the precedence of custom config params.

## Special seb params (not handled by Windows SEB) ##
#### sebAllCARootTrust ####
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

## Config params in alphabethical order (handled by Windows SEB) ##

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