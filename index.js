module.exports = CacheStore

var LRUCache = require('lru-cache')

function CacheStore (store, opts) {
  if (!(this instanceof CacheStore)) return new CacheStore(store)

  this.store = store
  if (!this.store || !this.store.get || !this.store.put) {
    throw new Error('First argument must be abstract-chunk-store compliant')
  }

  this.cache = new LRUCache(opts)
  this.closed = false
}

CacheStore.prototype.put = function (index, buf, cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  this.store.put(index, buf, cb)
}

CacheStore.prototype.get = function (index, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.get(index, null, opts)
  if (self.closed) return nextTick(cb, new Error('Storage is closed'))

  var start = (opts && opts.offset) || 0
  var end = opts && opts.length && (start + opts.length)

  var buf = self.cache.get(index)
  if (buf) return nextTick(cb, null, opts ? buf.slice(start, end) : buf)

  self.store.get(index, function (err, buf) {
    if (err) return cb(err)
    self.cache.set(index, buf)
    cb(null, opts ? buf.slice(start, end) : buf)
  })
}

CacheStore.prototype.close = function (cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  this.closed = true
  this.cache.reset()
  this.store.close(cb)
}

CacheStore.prototype.destroy = function (cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  this.closed = true
  this.cache.reset()
  this.store.destroy(cb)
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val)
  })
}
