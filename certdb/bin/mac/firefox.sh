#!/bin/sh
#/Applications/Firefox.app/Contents/MacOS/firefox -app "../../app/certdb.ini" -no-remote -profile "../../profile" -jsconsole -purgecaches
/Applications/Firefox.app/Contents/MacOS/firefox -profile "../../profilefirefox" -no-remote -chrome "chrome://pippki/content/certManager.xul"
