#!/bin/bash
openssl req -new -config etc/seb-client.conf -out certs/seb.client.csr -keyout certs/seb.client.key
