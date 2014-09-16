var Readable = require('stream').Readable,
    bs = require('binarysearch'),
    through2 = require('through2'),
    debug = require('debug')('mergesort-stream2');

function _cmp(a, b) {
  if (a < b) return -1;
  if (a > b) return +1;
  return 0;
}

module.exports = mergesort;
function mergesort(cmp, streams) {
  if (!Array.isArray(streams)) {
    streams = cmp;
    cmp = _cmp;
  }

  var active = 0;
  var buf = [];
  var full = {};
  var ended = {};

  var d = Readable({ objectMode: true });
  d._read = function() {
    kick();
  };

  function kick() {
    var ready = Object.keys(full).reduce(function (acc, key) {
      return acc + (full[key] > 0 ? 1 : 0);
    }, 0);

    debug({
      ready: ready,
      active: active,
      buf: JSON.stringify(buf),
      full: full
    });

    if (ready >= active && buf.length) {
      var entry = buf.shift();
      var id = entry[0];
      var data = entry[1];

      full[id]--;
      d.push(data);
    }

    var endedCount = Object.keys(ended).reduce(function (acc, key) {
      return acc + (ended[key] ? 1 : 0);
    }, 0);

    if (endedCount === streams.length && active === 0 && buf.length === 0) {
      d.push(null);
    }
  }

  streams.forEach(function (s, id) {
    if (s.readable) active++;
    full[id] = 0;
    ended[id] = false;

    s.pipe(through2.obj(write, end));

    function write(data, enc, cb) {
      bs.insert(buf, [id, data], function (a, b) {
        return cmp(a[1], b[1]);
      });
      full[id]++;
      kick();
      cb();
    }

    function end() {
      active--;
      ended[id] = true;
      kick();
    }
  });

  return d;
}

