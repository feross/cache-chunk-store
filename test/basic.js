const abstractTests = require('abstract-chunk-store/tests')
const CacheChunkStore = require('../')
const FSChunkStore = require('fs-chunk-store')
const ImmediateChunkStore = require('immediate-chunk-store')
const MemoryChunkStore = require('memory-chunk-store')
const test = require('tape')

test('abstract-chunk-store tests', t => {
  testAllStores(t, (Store, t) => abstractTests(t.test.bind(t), Store))
})

test('get should be cached', t => {
  testAllStores(t, (Store, t) => {
    t.plan(6)

    const originalStore = new Store(10)
    const store = new CacheChunkStore(originalStore, { max: 10 })

    store.put(0, Buffer.from('0123456789'), err => {
      t.error(err)
      store.get(0, (err, data) => {
        t.error(err)
        t.deepEqual(data, Buffer.from('0123456789'))

        originalStore.get = () => {
          t.fail('get should be cached - not called on underlying store')
        }

        store.get(0, (err, data) => {
          t.error(err)
          t.deepEqual(data, Buffer.from('0123456789'))

          store.destroy(err => {
            t.error(err)
          })
        })
      })
    })
  })
})

test('concurrent gets should only call underlying get once', t => {
  testAllStores(t, (Store, t) => {
    t.plan(7)

    const originalStore = new Store(10)
    const store = new CacheChunkStore(originalStore, { max: 10 })

    store.put(0, Buffer.from('0123456789'), err => {
      t.error(err)

      let numGetCalls = 0
      const originalGet = originalStore.get
      originalStore.get = (index, opts, cb) => {
        // Need to ensure get isn't recursive to count calls properly
        if (typeof opts === 'function') return originalStore.get(index, null, opts)

        numGetCalls += 1
        t.equal(numGetCalls, 1, 'get should be called exactly once')

        originalGet.call(originalStore, index, opts, cb)
      }

      // First get
      store.get(0, { offset: 1, length: 2 }, (err, data) => {
        t.error(err)
        t.deepEqual(data, Buffer.from('12'))
      })

      // Second get
      store.get(0, { offset: 4, length: 3 }, (err, data) => {
        t.error(err)
        t.deepEqual(data, Buffer.from('456'))

        store.destroy(err => {
          t.error(err)
        })
      })
    })
  })
})

function testAllStores (t, testFn) {
  const allStores = [
    { name: 'fs-chunk-store', Store: FSChunkStore },
    { name: 'memory-chunk-store', Store: MemoryChunkStore },
    {
      name: 'immediate-chunk-store',
      Store: function (chunkLength) {
        return new ImmediateChunkStore(new FSChunkStore(chunkLength))
      }
    }
  ]

  // Run the same test on all three stores
  for (const { name, Store } of allStores) {
    t.test(name, t => {
      testFn(Store, t)
    })
  }
}
