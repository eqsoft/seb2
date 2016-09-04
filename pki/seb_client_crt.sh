#!/bin/bash
openssl ca -config etc/signing-ca.conf -in certs/seb.client.csr -out certs/seb.client.crt -extensions server_ext
