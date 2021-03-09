# cache-chunk-store [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[travis-image]: https://img.shields.io/travis/feross/cache-chunk-store/master.svg
[travis-url]: https://travis-ci.org/feross/cache-chunk-store
[npm-image]: https://img.shields.io/npm/v/cache-chunk-store.svg
[npm-url]: https://npmjs.org/package/cache-chunk-store
[downloads-image]: https://img.shields.io/npm/dm/cache-chunk-store.svg
[downloads-url]: https://npmjs.org/package/cache-chunk-store
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

#### In-memory LRU (least-recently-used) cache for [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant stores

[![abstract chunk store](https://cdn.rawgit.com/mafintosh/abstract-chunk-store/master/badge.svg)](https://github.com/mafintosh/abstract-chunk-store)

This caches the results of `store.get()` calls using
[`lru`](https://www.npmjs.com/package/lru). See the `lru` docs for the
full list of configuration options.

## Install

```
npm install cache-chunk-store
```

## Usage

``` js
const CacheChunkStore = require('cache-chunk-store')
const FSChunkStore = require('fs-chunk-store') // any chunk store will work

const store = new CacheChunkStore(new FSChunkStore(10), {
  // options are passed through to `lru-cache`
  max: 100 // maximum cache size (this is probably the only option you need)
})

store.put(0, new Buffer('abc'), err => {
  if (err) throw err

  store.get(0, (err, data) => {
    if (err) throw err
    console.log(data)

    // this will be super fast because it's cached in memory!
    store.get(0, (err, data) => {
      if (err) throw err
      console.log(data)
    })
  })
})

```

## License

MIT. Copyright (c) [Feross Aboukhadijeh](https://feross.org).
