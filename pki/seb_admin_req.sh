#!/bin/bash
openssl req -new -config etc/seb-admin.conf -out certs/seb.admin.csr -keyout certs/seb.admin.key
