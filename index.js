module.exports = CacheStore

var LRU = require('lru')

function CacheStore (store, opts) {
  if (!(this instanceof CacheStore)) return new CacheStore(store)

  this.store = store
  this.chunkLength = store.chunkLength

  if (!this.store || !this.store.get || !this.store.put) {
    throw new Error('First argument must be abstract-chunk-store compliant')
  }

  this.cache = new LRU(opts)
}

CacheStore.prototype.put = function (index, buf, cb) {
  this.store.put(index, buf, cb)
}

CacheStore.prototype.get = function (index, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.get(index, null, opts)

  var start = (opts && opts.offset) || 0
  var end = opts && opts.length && (start + opts.length)

  var buf = self.cache.get(index)
  if (buf) return nextTick(cb, null, opts ? buf.slice(start, end) : buf)

  self.store.get(index, function (err, buf) {
    if (err) return cb(err)
    if (self.cache !== null) self.cache.set(index, buf)
    cb(null, opts ? buf.slice(start, end) : buf)
  })
}

CacheStore.prototype.close = function (cb) {
  this.cache = null
  this.store.close(cb)
}

CacheStore.prototype.destroy = function (cb) {
  this.cache = null
  this.store.destroy(cb)
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val)
  })
}
