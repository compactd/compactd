# Compactd

(pronounce compact-ed)

Just as a Compact Disc is the evolution of tapes, Compactd is an evolution of
cassette. It aims to be a self-hosted remote music player in your browser,
streaming from you own personal server. It will also allows to download new
music onto your server just like headphones does.

[![https://i.imgur.com/dzdT26k.jpg](https://i.imgur.com/dzdT26km.jpg)](https://i.imgur.com/dzdT26k.jpg)

## Why?

I felt like the next version of cassette (1.0), while full of new features, began to be
cluttered and slow, relying on outdated technologies when new exciting
things are up. Since I'm not trying to be profitable, but rather I code for the
fun, and I like to discover new things and new patterns I decided to go for
PouchDB which looks really interesting and promising!

Also, I've been relying a lot on boilerplates, and I'd like to learn to
implement all of this myself :D

## Stack

Redux, React, PouchDB, Webpack, Typescript, Socket.io...

## Prequisites

 - Node v8 and npm v5. I recommend using https://github.com/creationix/nvm
 - CouchDB v2. You can install it following [this guide](https://github.com/apache/couchdb/blob/master/INSTALL.Unix.md) for linux . Windows is quite straightforward, on Debian, you will need to build it from source following the tutorial. Just make sure you don't configure anything or any password.
 - Latest Ffmpeg. Installation varies from OS, you might wanna follow [this guide](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg)
 - rTorrent with XML-RPC support (optional). Only needed if you wanna download new stuff.
 
## Installation

```
$ npm install --global compactd
```

And that's all!

## Configuring

Before starting anything, you need to create a directory in your home directory named `.compactd`. In that file create a new file `config.json`. This is the minimal content for this file

```json
{
  "secret": "make sure to input a really really long random string as this will enforce the security of your server",
  "couchPassword": "this is the password that will secure couchdb installation. make it long (but it doesn't need to be as long as secret)"
 }
 ```
 
 You may set other values, such as `scgiPort` for rtorrent. You may see all possible options by running
 
 ```
 $ compactd --print-config
 ```
 
 Once this is done, save the file and run from anywhere:
 
 ```
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
 $ compactd --stop
 $ compactd --restart
 ```
 
