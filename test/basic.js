const abstractTests = require('abstract-chunk-store/tests')
const CacheChunkStore = require('../')
const FSChunkStore = require('fs-chunk-store')
const ImmediateChunkStore = require('immediate-chunk-store')
const MemoryChunkStore = require('memory-chunk-store')
const test = require('tape')

abstractTests(test, function (chunkLength) {
  return new CacheChunkStore(new FSChunkStore(chunkLength))
})

abstractTests(test, function (chunkLength) {
  return new CacheChunkStore(new MemoryChunkStore(chunkLength))
})

abstractTests(test, function (chunkLength) {
  return new CacheChunkStore(new ImmediateChunkStore(new FSChunkStore(chunkLength)))
})

test('fs-chunk-store: get should be cached', t => {
  runTest(t, FSChunkStore)
})

test('memory-chunk-store: get should be cached', t => {
  runTest(t, MemoryChunkStore)
})

test('immediate-chunk-store: fs-chunk-store: get should be cached', t => {
  runTest(t, function (chunkLength) {
    return new ImmediateChunkStore(new FSChunkStore(chunkLength))
  })
})

function runTest (t, Store) {
  const fsStore = new Store(10)
  const store = new CacheChunkStore(fsStore, { max: 10 })

  store.put(0, Buffer.from('0123456789'), err => {
    t.error(err)
    store.get(0, (err, data) => {
      t.error(err)
      t.deepEqual(data, Buffer.from('0123456789'))

      fsStore.get = () => {
        t.fail('get should be cached - not called on underlying store')
      }

      store.get(0, (err, data) => {
        t.error(err)
        t.deepEqual(data, Buffer.from('0123456789'))

        store.destroy(err => {
          t.error(err)
          t.end()
        })
      })
    })
  })
}
