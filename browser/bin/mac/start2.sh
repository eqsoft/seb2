#!/bin/sh
#/Applications/Firefox.app/Contents/MacOS/firefox -app "../../app/seb.ini" -profile ../../../profile -debug 1 -jsconsole -purgecaches
/Applications/Xulrunner.app/Contents/MacOS/xulrunner -app "../../app/seb.ini" -no-remote -profile ../../../profile -purgecaches -jsconsole -debug 1 &
/Applications/Xulrunner.app/Contents/MacOS/xulrunner -app "../../app/seb.ini" -no-remote -profile ../../../profile2 -purgecaches -jsconsole -debug 1 &