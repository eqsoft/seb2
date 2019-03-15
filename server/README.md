# seb-server (for developer only)

The seb-server component provides:

* a full functional web environment with webserver and client certificates signed by embedded pki ca for CN ```www.example.com``` and certificate subject alternatives for wildcard subdomains ```*.example.com``` and some other: ```localhost, 127.0.0.1, 10.0.0.10```. 
* demo web application for customized testing or just as a local seb2 entry point
* websocket server which can be used for monitoring and managing seb2 clients 
* development environment to emulate the websocket communication for embedded seb2 (see Windows SEB: http://safeexambrowser.org/)  

## Installation and Testing seb-server
First you need to install node.js (http://nodejs.org/). For Linux distributions please refer to https://github.com/nodesource/distributions .
 
```
cd ./server
npm install
npm run start
```

You should see something like this:

```
seb-server@1.0.0 start /root/seb2/server
node server.js
Websocket for monitoring started on port 8441
Websocket started on port 8442
HTTPS server for seb demo app started on port 8443
HTTP server for send app started on port 8080
```

You can close the server by killing the process "Ctrl-C" on Linux.

Further add a domain p.e. **sebserver.example.com** to your loopback device (Linux / Mac: /etc/hosts, Windows: C:\Windows\System32\drivers\etc\hosts).

Now you can run the dev scripts to start seb2 within the development environment. Open a new terminal window:

```
cd browser/bin/YOUR_OS/BIT/
./dev.sh or dev.bat
```

seb2 should be started into the demo application.

## seb Monitoring

The monitoring app can be used for remote managing of Linux based seb clients. See also https://github.com/hrz-unimr/netpoint9

**!WARNING**: Do NOT test seb and the monitoring app on the same computer. On a Linux based System **reboot** and **shutdown** will reboot and shutdown the whole computer system! 

You can request the monitoring app by opening a browser on another computer in the same network: https://sebserver.example.com:8441/websocket/monitor.html.
Select "all" 

## Security

All the connections should use TLS. To increase the security of the websocket connections use the embedded client certificates:

* client certs (see security section):
** ./pki/certs/seb.client.p12
** ./pki/certs/seb.admin.p12

To use the seb.admin.p12 for monitor app import it into your normal browser ("My Certificates").
To use the seb.client.p12 to increase seb websocket security import it into a fresh firefox profile (p.e. ```firefox -profile NEW_EMPTY_PROFILE_PATH -no-remote```) Import the seb.client.p12 in the cert settings into "My Certificates".
The Password for ALL keys in the seb pki is **eqsoftpki**

Copy NEW_EMPTY_PROFILE_PATH/cert8.db and NEW_EMPTY_PROFILE_PATH/key3.db into a prepared seb2 profile before starting seb2. Unfortunately copying the files into browser/app/defaults/profile which overrides the files in the default profile at runtime does not work anymore. 
Therefore the seb2 embedding in netpoint9 creates a fresh default profile with ```firefox -silent``` then copies custom profile files into the new profile and after that starts the browser with the customized profile. See: 
https://github.com/hrz-unimr/netpoint9/blob/master/config/includes.chroot/usr/local/bin/start_browser
