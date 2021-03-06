'use strict'

const debug = require('debug')
const log = debug('libp2p:webrtc-star')
const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const io = require('socket.io-client')
const EE = require('events').EventEmitter
const wrtc = require('wrtc')
const isNode = require('detect-node')
const SimplePeer = require('simple-peer')
const peerId = require('peer-id')
const PeerInfo = require('peer-info')
const Connection = require('interface-connection').Connection
const toPull = require('stream-to-pull-stream')

exports = module.exports = WebRTCStar

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

function WebRTCStar () {
  if (!(this instanceof WebRTCStar)) {
    return new WebRTCStar()
  }

  const listeners = {}
  this.discovery = new EE()

  this.dial = function (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    callback = callback || function () {}

    const intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now()
    const keys = Object.keys(listeners)
                      .filter((key) => key.startsWith(ma.toString().substring(0, ma.toString().lastIndexOf('/'))))
    const listener = listeners[keys[0]]
    if (!listener) return callback(new Error('signalling server not connected'))
    const sioClient = listener.io

    const spOptions = {
      initiator: true,
      trickle: false
    }
    if (isNode) {
      spOptions.wrtc = wrtc
    }
    const channel = new SimplePeer(spOptions)

    const conn = new Connection(toPull.duplex(channel))
    let connected = false

    channel.on('signal', function (signal) {
      sioClient.emit('ss-handshake', {
        intentId: intentId,
        srcMultiaddr: listener.ma.toString(),
        dstMultiaddr: ma.toString(),
        signal: signal
      })
    })

    channel.on('timeout', () => {
      callback(new Error('timeout'))
    })

    channel.on('error', (err) => {
      if (!connected) {
        callback(err)
      }
    })

    sioClient.on('ws-handshake', (offer) => {
      if (offer.intentId === intentId && offer.err) {
        return callback(new Error(offer.err))
      }

      if (offer.intentId !== intentId || !offer.answer) {
        return
      }

      channel.on('connect', () => {
        connected = true
        conn.destroy = channel.destroy.bind(channel)

        channel.on('close', () => {
          conn.destroy()
        })

        conn.getObservedAddrs = (callback) => {
          return callback(null, [ma])
        }

        callback(null, conn)
      })

      channel.signal(offer.signal)
    })

    return conn
  }

  this.createListener = (options, handler) => {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    const listener = new EE()

    listener.listen = (ma, callback) => {
      callback = callback || function () {}

      const sioUrl = 'http://' + ma.toString().split('/')[3] + ':' + ma.toString().split('/')[5]

      listener.io = io.connect(sioUrl, sioOptions)
      listener.ma = ma

      listener.io.on('connect_error', callback)
      listener.io.on('error', (err) => {
        console.log('got error')

        listener.emit('error', err)
        listener.emit('close')
      })

      listener.io.on('connect', () => {
        listener.io.emit('ss-join', ma.toString())
        listener.io.on('ws-handshake', incommingDial)
        listener.io.on('ws-peer', peerDiscovered.bind(this))
        listener.emit('listening')
        listeners[ma.toString()] = listener
        callback()
      })
      listener.close = (callback) => {
        callback = callback || function () {}

        listener.io.emit('ss-leave', ma.toString())
        setTimeout(() => {
          listener.io.disconnect()
          delete listeners[ma.toString()]
          listener.emit('close')
          callback()
        }, 100)
      }
      listener.getAddrs = (callback) => {
        setImmediate(() => {
          callback(null, [ma])
        })
      }

      function incommingDial (offer) {
        if (offer.answer || offer.err) {
          return
        }

        const spOptions = {
          trickle: false
        }
        if (isNode) {
          spOptions.wrtc = wrtc
        }
        const channel = new SimplePeer(spOptions)

        const conn = new Connection(toPull.duplex(channel))

        channel.on('connect', () => {
          conn.getObservedAddrs = (callback) => {
            return callback(null, [offer.srcMultiaddr])
          }

          listener.emit('connection', conn)
          handler(conn)
        })

        channel.on('signal', (signal) => {
          offer.signal = signal
          offer.answer = true
          listener.io.emit('ss-handshake', offer)
        })

        channel.signal(offer.signal)
      }
    }

    return listener
  }

  this.filter = (multiaddrs) => {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }
    return multiaddrs.filter((ma) => {
      return mafmt.WebRTCStar.matches(ma)
    })
  }

  function peerDiscovered (maStr) {
    log('Peer Discovered:', maStr)
    const id = peerId.createFromB58String(maStr.split('/')[8])
    const peer = new PeerInfo(id)
    peer.multiaddr.add(multiaddr(maStr))
    this.discovery.emit('peer', peer)
  }
}
