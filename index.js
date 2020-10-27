/*! cache-chunk-store. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
const LRU = require('lru')

class CacheStore {
  constructor (store, opts) {
    this.store = store
    this.chunkLength = store.chunkLength

    if (!this.store || !this.store.get || !this.store.put) {
      throw new Error('First argument must be abstract-chunk-store compliant')
    }

    this.cache = new LRU(opts)
  }

  put (index, buf, cb) {
    this.store.put(index, buf, cb)
  }

  get (index, opts, cb) {
    if (typeof opts === 'function') return this.get(index, null, opts)

    const start = (opts && opts.offset) || 0
    const end = opts && opts.length && (start + opts.length)

    const buf = this.cache.get(index)
    if (buf) return nextTick(cb, null, opts ? buf.slice(start, end) : buf)

    this.store.get(index, (err, buf) => {
      if (err) return cb(err)
      if (this.cache != null) this.cache.set(index, buf)
      cb(null, opts ? buf.slice(start, end) : buf)
    })
  }

  close (cb) {
    this.cache = null
    this.store.close(cb)
  }

  destroy (cb) {
    this.cache = null
    this.store.destroy(cb)
  }
}

function nextTick (cb, err, val) {
  process.nextTick(() => {
    if (cb) cb(err, val)
  })
}

module.exports = CacheStore
