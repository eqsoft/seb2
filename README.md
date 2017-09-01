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
* Proceed a **USER DEFINED(!)** installation setup to the prepared Firefox folders, otherwise your local Browser installation will be damaged!
```
./seb2/firefox/YOUR_OS/XXBit/
```
**!WARNING**: deny automatic (re)starting of Firefox after installation setup is finished, otherwise your local Firefox profile will be damaged!
* you may start the standalone Firefox for testing or upgrading the ESR Firefox binaries, so you don't need to download and replace 52.x ESR versions:
```
./seb2/firefox/YOUR_OS/firefoxXXBit.bat (or firefoxXXBit.sh for linux and mac)
```

The start scripts are using the prepared local profile folders:

```
./seb2/firefox/YOUR_OS/firefoxProfileXXBit/
```

### seb-server (for developer only)

The seb-server component provides:

* a full functional web environment with webserver and client certificates signed by embedded pki ca for CN ```www.simple.org```
* demo web application for customized testing or just as a local seb2 entry point
* websocket server which can be used for monitoring and managing seb2 clients 
* development environment to emulate the websocket communication for embedded seb2 (see Windows SEB: http://safeexambrowser.org/)  


#### Installation and Testing seb-server
First you need to install node.js (http://nodejs.org/). For Linux distributions please refer to https://github.com/nodesource/distributions .
 
```
cd ./server
npm install
npm run start
```

You should see something like this:

```
seb-server@1.0.0 start /root/seb2/server
node server.js
Websocket for monitoring started on port 8441
Websocket started on port 8442
HTTPS server for seb demo app started on port 8443
HTTP server for send app started on port 8080
```

You can close the server by killing the process "Ctrl-C" on Linux.

Further add the domain **www.simple.org** to your loopback device (Linux / Mac: /etc/hosts, Windows: C:\Windows\System32\drivers\etc\hosts).

Now you can run the dev scripts to start seb2 within the development environment. Open a new terminal window:

```
cd browser/bin/YOUR_OS/BIT/
./dev.sh or dev.bat
```

seb2 should be started into the demo application.

#### seb Monitoring

The monitoring app can be used for remote managing of Linux based seb clients. See also https://github.com/hrz-unimr/netpoint9

**!WARNING**: Do NOT test seb and the monitoring app on the same computer. On a Linux based System **reboot** and **shutdown** will reboot and shutdown the whole computer system! 

You can request the monitoring app by opening a browser on another computer in the same network: https://www.simple.org:8441/websocket/monitor.html 

#### Security

All the connections should use TLS. To increase the security of the websocket connections use the embedded client certificates:

* client certs (see security section):
** ./pki/certs/seb.client.p12
** ./pki/certs/seb.admin.p12

To use the seb.client.crt import it into a fresh firefox profile (p.e. ```firefox -profile NEW_EMPTY_PROFILE_PATH -no-remote```) Import the seb.client.crt in the cert settings into "My Certificates".

The Password for ALL keys in the seb pki is **sebpki**

Copy NEW_EMPTY_PROFILE_PATH/cert8.db and NEW_EMPTY_PROFILE_PATH/key3.db into a prepared seb2 profile before starting seb2. Unfortunately copying the files into browser/app/defaults/profile which overrides the files in the default profile at runtime does not work anymore. 
Therefore the seb2 embedding in netpoint9 creates a fresh default profile with ```firefox -silent``` then copies custom profile files into the new profile and after that starts the browser with the customized profile. See: 
https://github.com/hrz-unimr/netpoint9/blob/master/config/includes.chroot/usr/local/bin/start_browser

* trusted institutions (embedded in browser/app/config.json):
** ./pki/ca/root-ca.crt
** ./pki/ca/signing-ca.crt

#### 

## Quick Start

After cloning the repo and installation of a local Firefox 52.x ESR you can start seb2 with a default config.

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
