#!/bin/bash
openssl ca -config etc/signing-ca.conf -in certs/simple.org.csr -out certs/simple.org.crt -extensions server_ext
