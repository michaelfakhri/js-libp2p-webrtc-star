# js-libp2p-webrtc-star

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Build Status](https://travis-ci.org/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://travis-ci.org/libp2p/js-libp2p-webrtc-star)
![](https://img.shields.io/badge/coverage-%3F-yellow.svg?style=flat-square)
[![Dependency Status](https://david-dm.org/libp2p/js-libp2p-webrtc-star.svg?style=flat-square)](https://david-dm.org/libp2p/js-libp2p-webrtc-star)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/js-libp2p-webrtc-star.svg)](https://saucelabs.com/u/js-libp2p-webrtc-star)

![](https://raw.githubusercontent.com/libp2p/interface-connection/master/img/badge.png)
![](https://raw.githubusercontent.com/libp2p/interface-transport/master/img/badge.png)

> libp2p WebRTC transport that includes a discovery mechanism provided by the signalling-star

## Description

`libp2p-webrtc-star` is one of the WebRTC transports available for libp2p. `libp2p-webrtc-star incorporates both a transport and a discovery service that is facilitated by the signalling server, also part of this module.

**Note:** This module uses [pull-streams](https://pull-stream.github.io) for all stream based interfaces.

## Example

```JavaScript
TODO
```

## Usage

### Installation

```bash
> npm install libp2p-webrtc-star
```

### API

Follows the interface defined by `interface-transport`

[![](https://raw.githubusercontent.com/diasdavid/interface-transport/master/img/badge.png)](https://github.com/libp2p/interface-transport)

### Signalling server

`libp2p-webrtc-star` comes with its own signalling server, used for peers to handshake their signalling data and establish a connection. You can install it in your machine by installing the module globally:

```bash
> npm install --global libp2p-webrtc-star
```

This will expose a `star-sig` cli tool. To spawn a server do:

```bash
> star-sig --port=9090 --host=127.0.0.1
```

Defaults:

- `port` - 13579
- `host` - '0.0.0.0'

## Hosted Signalling Server

We host a signalling server at `signalling.cloud.ipfs.team` that can be used for practical demos and experimentation, it **should not be used for apps in production**.

Since multiaddr doesn't have support for `DNS` yet, you have to add your libp2p-webrtc-star multiaddr by using the IP address instead. To know the Signalling server address, you can do:

```sh
» dig +short webrtc-star-signalling.cloud.ipfs.team
188.166.203.82
```

And so, a webrtc-star address should looking like: `/ip4/188.166.203.82/tcp/20000/ws/ipfs/<your-peer-id>`

### Deployment

We have a [dokku](https://github.com/ipfs/ops-requests/issues/31) setup ready for this to be deployed, to deploy simple do (you have to have permission first):

```sh
# if you already have added the remote, you don't need to do it again
> git remote add dokku dokku@cloud.ipfs.team:webrtc-star-signalling
> git push dokku master
```

[Notes](https://github.com/libp2p/js-libp2p-webrtc-star/pull/48#issuecomment-266235955)

### This module uses `pull-streams`

We expose a streaming interface based on `pull-streams`, rather then on the Node.js core streams implementation (aka Node.js streams). `pull-streams` offers us a better mechanism for error handling and flow control guarantees. If you would like to know more about why we did this, see the discussion at this [issue](https://github.com/ipfs/js-ipfs/issues/362).

You can learn more about pull-streams at:

- [The history of Node.js streams, nodebp April 2014](https://www.youtube.com/watch?v=g5ewQEuXjsQ)
- [The history of streams, 2016](http://dominictarr.com/post/145135293917/history-of-streams)
- [pull-streams, the simple streaming primitive](http://dominictarr.com/post/149248845122/pull-streams-pull-streams-are-a-very-simple)
- [pull-streams documentation](https://pull-stream.github.io/)

#### Converting `pull-streams` to Node.js Streams

If you are a Node.js streams user, you can convert a pull-stream to a Node.js stream using the module [`pull-stream-to-stream`](https://github.com/pull-stream/pull-stream-to-stream), giving you an instance of a Node.js stream that is linked to the pull-stream. For example:

```JavaScript
const pullToStream = require('pull-stream-to-stream')

const nodeStreamInstance = pullToStream(pullStreamInstance)
// nodeStreamInstance is an instance of a Node.js Stream
```

To learn more about this utility, visit https://pull-stream.github.io/#pull-stream-to-stream.
