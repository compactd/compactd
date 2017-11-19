# Compactd

(pronounce compact-ed)

<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/Fwnbp4ySbyNYR6BaX1f9y4zQ/compactd/compactd'>
  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/Fwnbp4ySbyNYR6BaX1f9y4zQ/compactd/compactd.svg' />
</a>

Compactd aims to be a self-hosted remote music player in your browser,
streaming from you own personal server. It will also allows to download new
music onto your server just like headphones does.

[![https://i.imgur.com/dzdT26k.jpg](https://i.imgur.com/dzdT26km.jpg)](https://i.imgur.com/dzdT26k.jpg)

## Features

 - Finder-like columns for browsing library
 - Fuzzy finder for searching library
 - Streaming music 
 - Music transcoding on-the-fly
 - Hotkey controls (J, K, L, Ctrl+P)
 - Artist and album downloading
 - Gazelle-based trackers support
 - Deluge torrent client supported

## Stack

Redux, React, PouchDB, Webpack, Typescript, Socket.io...

## Prequisites

 - Node v8 and npm v5. I recommend using https://github.com/creationix/nvm
 - CouchDB v2. You can install it following [this guide](https://github.com/apache/couchdb/blob/master/INSTALL.Unix.md) for linux . Windows is quite straightforward, on Debian, you will need to build it from source following the tutorial. Just make sure you don't configure anything or any password.
 - Latest Ffmpeg. Installation varies from OS, you might wanna follow [this guide](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg)
 - deluge with deluge-web are optionnal (for downloading new content)
 
## Installation

```
$ npm install --global compactd
$ compactd --configure
```
Follow the steps. Once it is down everything is configured!
 
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
 
