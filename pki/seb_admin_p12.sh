#!/bin/bash
openssl pkcs12 -export -name "seb.admin" -inkey certs/seb.admin.key -in certs/seb.admin.crt -out certs/seb.admin.p12

