#!/bin/sh
#/Applications/Firefox.app/Contents/MacOS/firefox -profile ../../../profiletest
/Applications/Xulrunner.app/Contents/MacOS/xulrunner -app "../../app/seb.ini" -no-remote -profile ../../../profile -debug 1 -jsconsole -purgecaches
