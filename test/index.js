var redtape = require('redtape'),
    Readable = require('stream').Readable,
    JSONStream = require('JSONStream'),
    debug = require('debug')('mergesort-stream2'),
    mergesort = require('..'),
    concat = require('concat-stream');

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
      t.end();
    }));
});
