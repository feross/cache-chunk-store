/*! cache-chunk-store. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
const LRU = require('lru')

class CacheStore {
  constructor (store, opts) {
    this.store = store
    this.chunkLength = store.chunkLength
    this.inProgressGets = new Map() // Map from chunk index to info on callbacks waiting for that chunk

    if (!this.store || !this.store.get || !this.store.put) {
      throw new Error('First argument must be abstract-chunk-store compliant')
    }

    this.cache = new LRU(opts)
  }

  put (index, buf, cb) {
    if (!this.cache) return nextTick(cb, new Error('CacheStore closed'))

    this.cache.remove(index)
    this.store.put(index, buf, cb)
  }

  get (index, opts, cb) {
    if (typeof opts === 'function') return this.get(index, null, opts)
    if (!this.cache) return nextTick(cb, new Error('CacheStore closed'))

    const start = (opts && opts.offset) || 0
    const end = opts && opts.length && (start + opts.length)

    const buf = this.cache.get(index)
    if (buf) {
      return nextTick(cb, null, opts ? buf.slice(start, end) : buf)
    }

    // See if a get for this index has already started
    let waiters = this.inProgressGets.get(index)
    const getAlreadyStarted = !!waiters
    if (!waiters) {
      waiters = []
      this.inProgressGets.set(index, waiters)
    }

    waiters.push({
      cb,
      start,
      end,
      needsSlice: !!opts
    })

    if (!getAlreadyStarted) {
      this.store.get(index, (err, buf) => {
        if (!err && this.cache != null) this.cache.set(index, buf)

        const inProgressEntry = this.inProgressGets.get(index)
        this.inProgressGets.delete(index)

        for (const { start, end, needsSlice, cb } of inProgressEntry) {
          if (err) {
            cb(err)
          } else {
            cb(null, needsSlice ? buf.slice(start, end) : buf)
          }
        }
      })
    }
  }

  close (cb) {
    if (!this.cache) return nextTick(cb, new Error('CacheStore closed'))

    this.cache = null
    this.store.close(cb)
  }

  destroy (cb) {
    if (!this.cache) return nextTick(cb, new Error('CacheStore closed'))

    this.cache = null
    this.inProgressGets = null
    this.store.destroy(cb)
  }
}

function nextTick (cb, err, val) {
  process.nextTick(() => {
    if (cb) cb(err, val)
  })
}

module.exports = CacheStore
