Standalone Browser Component of Safe-Exam-Browser
=================================================
  See: http://www.safeexambrowser.org

Refactored seb:
* splitted seb.jsm into functional modules
* getting rid of xullib.jsm
* refactored config mode
* improved nodejs based seb server with native html5 support without binaryjs and jquery
* general code refactoring

## OS Support ##
* Windows 32/64Bit
* Linux   32/64Bit
* OSX 10.x

## Requirements ##
Download the latest xulrunner runtime for your OS from:
http://ftp.mozilla.org/pub/mozilla.org/xulrunner/releases/latest/runtimes/

Create a folder structure for the xulrunner runtime(s) like that:

``` 
+ seb2 (git repository)
- xulrunner
   | - win (shared binary for 32 and 64Bit)
   |     | - xulrunner (p.e. unzipped xulrunner-38.0.5.en-US.win32.zip)
   |     |    | * 
   | - linux
   |     | - 32
   |     |    | - xulrunner (p.e. unzipped xulrunner-38.0.5.en-US.linux-i686.tar.bz2)
   |     |    |    | *    
   |     | - 64
   |     |    | - xulrunner (p.e. unzipped xulrunner-38.0.5.en-US.linux-x86_64.tar.bz2)
   |     |    |    | *
``` 

The Mac Version must be installed as Application:
```
sudo mkdir -p /Applications/Xulrunner.app/Contents/MacOS
sudo mkdir -p /Applications/Xulrunner.app/Contents/Resources
```
Extract xulrunner-xx.x.x.en-US.mac.tar.bz2 and copy XUL.framework/Versions/Current/* into /Applications/Xulrunner.app/Contents/MacOS.
Then move XUL.framework/Versions/Current/dependentlibs.list into /Applications/Xulrunner.app/Contents/Resources/ folder.


The start scripts **must** point to an executable xulrunner binary.

``` 
- seb2 (git repository)
   | - browser
   |    |  - bin 
   |	|     |  - linux
   |    |     |      | + 32
   |	|     |      | - 64
   |	|     |      |    | start.sh
   |	|     |      |    | ....
   |	|     |  - win	
   |	|     |      | start.bat
   |	|     |      | ....
   |	|     |	 - mac	
   |	|     |      | start.sh
   |	|     |      | ....
+ xulrunner
``` 

For seb server and demo mode including the screenshot component you need to install node.js (http://nodejs.org/).
After installing node.js you need to install some node modules:
``` 
npm install -g fs-extra express serve-static serve-index ws
``` 
Switch to ``` seb2/server/ ``` folder and type:
```
server.sh (Linux, Mac) or server.bat (Windows)
```
If you get an error message that node can not find the modules try to set an environment variable in ``` ~/.bashrc ``` or ``` ~/.profile ``` p.e.: ``` export NODE_PATH=/usr/lib/node_modules ```
