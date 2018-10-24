#!/bin/bash
openssl req -new -config etc/server.conf -out certs/example.com.csr -keyout certs/example.com.key

