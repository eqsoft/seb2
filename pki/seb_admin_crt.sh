#!/bin/bash
openssl ca -config etc/signing-ca.conf -in certs/seb.admin.csr -out certs/seb.admin.crt -extensions server_ext
