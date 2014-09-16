var redtape = require('redtape'),
    Readable = require('stream').Readable,
    mergesort = require('..'),
    concat = require('concat-stream'),
    through2 = require('through2');

var it = redtape();

function testStream(data) {
  var s = Readable({ objectMode: true });
  s._read = function () { };
  function next() {
    if (!data.length) {
      return s.push(null);
    }
    var num = data.shift();
    s.push({ num: num });
    setImmediate(next);
  }
  setImmediate(next);
  return s;
}

function testNumberStream(data) {
  var s = Readable({ objectMode: true });
  s._read = function () { };
  function next() {
    if (!data.length) {
      return s.push(null);
    }
    var num = data.shift();
    s.push(num);
    setImmediate(next);
  }
  setImmediate(next);
  return s;
}

function pullStream(count) {
  var last = Math.random();
  var s = Readable({ objectMode: true });
  var n = 0;

  s._read = function () {
    last += Math.random();
    s.push(last);
    n++;
    if (n === count) s.push(null);
  };

  return s;
}

it('should be able to merge two streams', function(t) {
  t.plan(1);

  var s1 = testStream([42, 44, 58]);
  var s2 = testStream([40, 41, 52]);

  function cmp(a, b) {
    var _a = a.num;
    var _b = b.num;

    if (_a < _b) return -1;
    if (_a > _b) return +1;
    return 0;
  }

  mergesort(cmp, [s1, s2])
    .pipe(concat(function (data) {
      var expected = [
        { num: 40 },
        { num: 41 },
        { num: 42 },
        { num: 44 },
        { num: 52 },
        { num: 58 } ];
      t.deepEquals(data, expected);
    }));
});

it('should be able to handle one empty stream', function(t) {
  t.plan(1);

  var s1 = testStream([42, 44, 58]);
  var s2 = testStream([]);

  function cmp(a, b) {
    var _a = a.num;
    var _b = b.num;

    if (_a < _b) return -1;
    if (_a > _b) return +1;
    return 0;
  }

  mergesort(cmp, [s1, s2])
    .pipe(concat(function (data) {
      var expected = [
        { num: 42 },
        { num: 44 },
        { num: 58 } ];
      t.deepEquals(data, expected);
    }));
});

it('should be able to handle two empty streams', function(t) {
  t.plan(1);

  var s1 = testStream([]);
  var s2 = testStream([]);

  function cmp(a, b) {
    var _a = a.num;
    var _b = b.num;

    if (_a < _b) return -1;
    if (_a > _b) return +1;
    return 0;
  }

  mergesort(cmp, [s1, s2])
    .pipe(concat(function (data) {
      var expected = [];
      t.deepEquals(data, expected);
    }));
});

it('should be able to merge three streams', function(t) {
  t.plan(1);

  var s1 = testStream([42, 44, 58]);
  var s2 = testStream([40, 41, 44, 52]);
  var s3 = testStream([39, 48, 60, 63]);

  function cmp(a, b) {
    var _a = a.num;
    var _b = b.num;

    if (_a < _b) return -1;
    if (_a > _b) return +1;
    return 0;
  }

  mergesort(cmp, [s1, s2, s3])
    .pipe(concat(function (data) {
      var expected = [
        { num: 39 },
        { num: 40 },
        { num: 41 },
        { num: 42 },
        { num: 44 },
        { num: 44 },
        { num: 48 },
        { num: 58 },
        { num: 52 },
        { num: 60 },
        { num: 63 } ];
      t.deepEquals(data, expected);
    }));
});

it('should be able to work with a single stream', function(t) {
  t.plan(1);

  var s1 = testStream([42, 44, 58]);

  function cmp(a, b) {
    var _a = a.num;
    var _b = b.num;

    if (_a < _b) return -1;
    if (_a > _b) return +1;
    return 0;
  }

  mergesort(cmp, [s1])
    .pipe(concat(function (data) {
      var expected = [
        { num: 42 },
        { num: 44 },
        { num: 58 } ];
      t.deepEquals(data, expected);
    }));
});

it('should be work in flowing mode', function(t) {
  t.plan(1);

  var s1 = testStream([42, 44, 58]);
  var s2 = testStream([40, 41, 52]);

  function cmp(a, b) {
    var _a = a.num;
    var _b = b.num;

    if (_a < _b) return -1;
    if (_a > _b) return +1;
    return 0;
  }

  var results = [];
  mergesort(cmp, [s1, s2])
    .on('data', function (data) {
      results.push(data);
    })
    .on('end', function () {
      var expected = [
        { num: 40 },
        { num: 41 },
        { num: 42 },
        { num: 44 },
        { num: 52 },
        { num: 58 } ];
      t.deepEquals(results, expected);
    });
});

it('should work with numbers', function(t) {
  t.plan(1);

  var s1 = testNumberStream([42, 44, 58]);
  var s2 = testNumberStream([40, 41, 52]);

  function cmp(a, b) {
    if (a < b) return -1;
    if (a > b) return +1;
    return 0;
  }

  var results = [];
  mergesort([s1, s2])
    .pipe(through2.obj(function (data, enc, cb) {
      results.push(data);
      cb();
    }, function () {
      var expected = [ 40, 41, 42, 44, 52, 58 ];
      t.deepEqual(results, expected);
    }));
});

it('should be work with pull streams', function(t) {
  t.plan(7);

  var s1 = pullStream(3);
  var s2 = pullStream(5);

  var results = [];
  mergesort([s1, s2])
    .pipe(through2.obj(function (data, enc, cb) {
      results.push(data);
      cb();
    }, function () {
      for (var i = 0; i < results.length - 1; i++) {
        t.assert(results[i] <= results[i + 1], 'pull stream is ordered');
      }
    }));
});
