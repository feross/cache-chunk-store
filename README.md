# cache-chunk-store [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url]

[travis-image]: https://img.shields.io/travis/feross/cache-chunk-store.svg?style=flat
[travis-url]: https://travis-ci.org/feross/cache-chunk-store
[npm-image]: https://img.shields.io/npm/v/cache-chunk-store.svg?style=flat
[npm-url]: https://npmjs.org/package/cache-chunk-store
[downloads-image]: https://img.shields.io/npm/dm/cache-chunk-store.svg?style=flat
[downloads-url]: https://npmjs.org/package/cache-chunk-store

In-memory LRU (least-recently-used) cache for [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant stores

This caches the results of `store.get()` calls using
[`lru-cache`](https://www.npmjs.com/package/lru-cache). See the `lru-cache` docs for the
full list of configuration options.

## Install

```
npm install cache-chunk-store
```

## Usage

``` js
var CacheChunkStore = require('cache-chunk-store')
var FSChunkStore = require('fs-chunk-store') // any chunk store will work

var store = new CacheChunkStore(new FSChunkStore(10), {
  // options are passed through to `lru-cache`
  max: 100 // maximum cache size (this is probably the only option you need)
})

store.put(0, new Buffer('abc'), function (err) {
  if (err) throw err

  store.get(0, function (err, data) {
    if (err) throw err
    console.log(data)

    // this will be super fast because it's cached in memory!
    store.get(0, function (err, data) {
      if (err) throw err
      console.log(data)
    })
  })
})

```

## License

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
