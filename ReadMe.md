# Compactd

(pronounce compact-D)

<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/Fwnbp4ySbyNYR6BaX1f9y4zQ/compactd/compactd'>
  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/Fwnbp4ySbyNYR6BaX1f9y4zQ/compactd/compactd.svg' />
</a>

<a href="https://liberapay.com/compactd/donate"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a>

Compactd aims to be a self-hosted remote music player in your browser,
streaming from you own personal server. It will also allows to download new
music onto your server just like headphones does.

[![https://i.imgur.com/CeDJZim.jpg](https://i.imgur.com/CeDJZiml.jpg)](https://i.imgur.com/CeDJZim.jpg)

## Features

 - Scan any download folder (no neeed for a specific format like Plex)
 - Finder-like columns for browsing library
 - Fuzzy finder for searching library
 - Library reorganization (moving an album to a different artist)
 - Hidding and removing track (only from the database) from library
 - Streaming music 
 - Music transcoding on-the-fly
 - Hotkey controls (J, K, L, Ctrl+P)
 - Artist and album downloading
 - Gazelle-based trackers support
 - Deluge torrent client supported
 - Waveform vizualisation 

## Stack

Redux, React, PouchDB, Webpack, Typescript, Socket.io...

## Prequisites

 - Node v8 and npm v5. I recommend using https://github.com/creationix/nvm
 - CouchDB v2. You can install it following [this guide](https://github.com/apache/couchdb/blob/master/INSTALL.Unix.md) for linux . Windows is quite straightforward, on Debian, you will need to build it from source following the tutorial. Just make sure you don't configure anything or any password.
 - Latest Ffmpeg. Installation varies from OS, you might wanna follow [this guide](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg)
 - deluge with deluge-web are optionnal (for downloading new content)
 - [audiowaveform](https://github.com/bbc/audiowaveform) is optionnal, only  if you  want to use the waveform feature. Ubuntu, Arch, and Mac OS are straightforward, debian requires building from source; Windows doesn't work.
 - opencv2 is optional, it allows the artwork processing tool to recognize face and crops images if they are not squared
 
## Installation

```
$ npm install --global compactd
$ compactd --configure
```
Follow the steps. Once it is down everything is configured!

## Nginx configuration

You need at least to locations, one for the http part and one for the socket server which allows realtime data update. Example:

```nginx
server {

    listen 443 ssl;                                                             
    server_name compactd.io;

    include snippets/ssl-compactd.io.conf;
    include snippets/ssl-params.conf;

    access_log            /var/log/nginx/access.log;

    location /engine.io/ {
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_http_version 1.1;
      proxy_set_header        Host $host;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;

      proxy_pass          http://127.0.0.1:9001;
    }

    location / {
      proxy_set_header        Host $host;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;

      # Fix the âIt appears that your reverse proxy set up is broken" error.
      proxy_pass          http://127.0.0.1:9000;
      proxy_read_timeout  90;

      proxy_redirect      http://127.0.0.1:9000 https://compactd.io;
    }
  }
```

 
## Starting
 
 Just run
 
 ```
 $ compactd --serve
 ```
 
 This will spawn a pm2 process in the background if it's not already running for process management.
 
 ## Stopping, restarting
 
 ```
 $ pm2 restart compactd
 $ pm2 stop compactd
 ```
 
