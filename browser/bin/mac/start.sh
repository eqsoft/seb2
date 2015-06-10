#!/bin/sh
# 
# you need to copy dependentlibs.list to /Applications/Xulrunner.app/Contents/Resources/
# see https://bugzilla.mozilla.org/show_bug.cgi?id=1105044
# 

#/Applications/Firefox.app/Contents/MacOS/firefox -profile ../../../profiletest
/Applications/Xulrunner.app/Contents/MacOS/xulrunner -app "../../app/seb.ini" -no-remote -profile ../../../profilemac -debug 1 -jsconsole -purgecaches
