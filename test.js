var abstractTests = require('abstract-chunk-store/tests')
var CacheChunkStore = require('./')
var FSChunkStore = require('fs-chunk-store')
var ImmediateChunkStore = require('immediate-chunk-store')
var MemoryChunkStore = require('memory-chunk-store')
var test = require('tape')

abstractTests(test, function (chunkLength) {
  return new CacheChunkStore(new FSChunkStore(chunkLength))
})

abstractTests(test, function (chunkLength) {
  return new CacheChunkStore(new MemoryChunkStore(chunkLength))
})

abstractTests(test, function (chunkLength) {
  return new CacheChunkStore(new ImmediateChunkStore(new FSChunkStore(chunkLength)))
})

test('fs-chunk-store: get should be cached', function (t) {
  runTest(t, FSChunkStore)
})

test('memory-chunk-store: get should be cached', function (t) {
  runTest(t, MemoryChunkStore)
})

test('immediate-chunk-store: fs-chunk-store: get should be cached', function (t) {
  runTest(t, function (chunkLength) {
    return new ImmediateChunkStore(new FSChunkStore(chunkLength))
  })
})

function runTest (t, Store) {
  var fsStore = new Store(10)
  var store = new CacheChunkStore(fsStore, { max: 10 })

  store.put(0, new Buffer('0123456789'), function (err) {
    t.error(err)
    store.get(0, function (err, data) {
      t.error(err)
      t.deepEqual(data, new Buffer('0123456789'))

      fsStore.get = function () {
        t.fail('get should be cached - not called on underlying store')
      }

      store.get(0, function (err, data) {
        t.error(err)
        t.deepEqual(data, new Buffer('0123456789'))

        store.destroy(function (err) {
          t.error(err)
          t.end()
        })
      })
    })
  })
}
