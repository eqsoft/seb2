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
* OSX 10.x

## Requirements ##

Since Mozilla canceled the provision of xulrunner binaries, we changed seb2 hosting to native firefox binaries.
It is possible to host the seb2 app within your default firefox application for testing 
(see example scripts in
 ```
 ./browser/bin/YOUR_OS/start_default.sh | bat) 
 ```

but we recommand to use own firefox binaries. Download the latest firefox runtime for your OS from:
```
http://ftp.mozilla.org/pub/mozilla.org/firefox/releases/latest
```

Install firefox to any other folder then your default firefox with the customized installation setup. BEWARE not to override your default firefox installation. DO NOT delete the custom seb2 profile folder paths in the start scripts, this would override your default firefox profile.

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
``` ~/.bashrc ``` or ``` ~/.profile ```

p.e.: 
``` export NODE_PATH=/usr/lib/node_modules ```

## Configuration ##

seb2 first loads a set of default configuration params in ./browser/app/default.json and then looks for a runtime config 
in the commandline param ``` -config PARAM ```. The commandline parameter might be an absolute path or any url to a local or remote config json file. The param can also be a stringified or a base64 encoded json object. A base64 encoded string param is used by windows SEB configuration of the embedded seb2.
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

