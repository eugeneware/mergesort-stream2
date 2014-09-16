# mergesort-stream2

Merge sorted data from multiple streams into one using streams 2

[![build status](https://secure.travis-ci.org/eugeneware/mergesort-stream2.png)](http://travis-ci.org/eugeneware/mergesort-stream2)

Essentially a streams 2 implementation of the excellent [mergesort-stream](https://www.npmjs.org/package/mergesort-stream)

## Installation

This module is installed via npm:

``` bash
$ npm install mergesort-stream2
```

## Example Usage

``` js
var mergesort= require('mergesort-stream2'),
    through2 = require('through2');

// stream that will output the object stream ({num: 42}, {num: 44}, {num: 58})
var s1 = testStream([42, 44, 58]);

// stream that will output the object stream ({num: 40}, {num: 41}, {num: 52})
var s2 = testStream([40, 41, 52]);

// custom comparator function to help sort the objects
function cmp(a, b) {
  // sort by the 'num' field
  var _a = a.num;
  var _b = b.num;

  if (_a < _b) return -1;
  if (_a > _b) return +1;
  return 0;
}

mergesort(cmp, [s1, s2])
  .pipe(through2(function (data, enc, cb) {
    console.log(data);
    cb();
  }));

// Will output:
// { num: 40 }
// { num: 41 }
// { num: 42 }
// { num: 44 }
// { num: 52 }
// { num: 58 }
```
