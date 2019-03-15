#!/bin/bash
# firefox -silent -profile "../sebProfile64"
firefox -app "../../../../browser/app/seb.ini" -profile "../sebProfile64" -logfile 1 -debug 1 -config "config.json" -no-remote -purgecaches
