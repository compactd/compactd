# Compactd

(pronounce compact-ed)

Just as a Compact Disc is the evolution of tapes, Compactd is an evolution of
cassette. It aims to be a self-hosted remote music player in your browser,
streaming from you own personal server. It will also allows to download new
music onto your server just like headphones does.

## Why?

I felt like the next version (1.0), while full of new features, began to be
cluttered and slow, relying on outdated technologies when new exciting
things are up. Since I'm not trying to be profitable, but rather I code for the
fun, and I like to discover new things and new patterns I decided to go for
PouchDB which looks really interesting and promising!

Also, I've been relying a lot on boilerplates, and I'd like to learn to
implement all of this myself :D

## Stack

I plan to use React, Redux, Reselect, PouchDB (ofc!)...

## Scripts

There are a few scripts to configure Compactd for now. On the long term, these
will be automated/added to the UI.

### Configuring database

Before starting cassette for the first time, you need to configure CouchDB
so permissions and validation are done correctly.

     node server/dist/features/configure

### Creating user and logging in

You have to POST to `/api/users` and `/api/sessions` wth username and password
as JSON data.

### Adding a library and scanning

Right now you can't add a library in the UI. You need to use `curl` once the
server is started. Create a CouchDB entry in libary db:

    {
      "_id": "config/library/name-of-library",
      "name": "Name of library",
      "path": "Path to folder"
    }

And then curl:

     curl -X POST /api/scans -D libraryId=config/library/name-of-library

(Please note you will have to bear a valid token)


_cluster_setup {"action":"enable_cluster","username":"admin","password":"password","bind_address":"0.0.0.0","port":5984}
{action: "finish_cluster"}
