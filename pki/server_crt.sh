#!/bin/bash
openssl ca -config etc/signing-ca.conf -in certs/example.com.csr -out certs/example.com.crt -extensions server_ext
