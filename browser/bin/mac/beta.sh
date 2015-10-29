#!/bin/sh
# 
# you need to copy dependentlibs.list to /Applications/Xulrunner.app/Contents/Resources/
# see https://bugzilla.mozilla.org/show_bug.cgi?id=1105044
# 

/Applications/FirefoxBeta.app/Contents/MacOS/firefox -app "../../app/seb.ini" -no-remote -profile "../../../profilemac_beta" -debug 1 -jsconsole -purgecaches
#/Applications/Xulrunner.app/Contents/MacOS/xulrunner -app "../../app/seb.ini" -no-remote -profile ../../../profilemac -debug 1 -jsconsole -purgecaches
