#!/bin/bash
openssl pkcs12 -export -name "seb.client" -inkey certs/seb.client.key -in certs/seb.client.crt -out certs/seb.client.p12

