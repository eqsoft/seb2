#!/bin/bash
openssl req -new -config etc/server.conf -out certs/simple.org.csr -keyout certs/simple.org.key

