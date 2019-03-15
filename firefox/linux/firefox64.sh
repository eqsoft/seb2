#!/bin/bash
#if [ ! -f "64/mozilla.cfg" ] ; then
	cp ../autoconfig/mozilla.cfg 64/
#fi

if [ ! -f "64/defaults/pref/autoconfig.js" ] ; then
	cp ../autoconfig/defaults/pref/autoconfig.js 64/defaults/pref/
fi

./64/firefox -profile firefoxProfile64
