(function(root) {
  var Color = function(item) {
    this._data = null;
    this._callbacks = [];
    this._colors = null;
    this._img = null;
    this._size = null;
    this._url = null;

    if (typeof item === 'object' && item.src) {
      this._url = item.src;
    } else if (typeof item === 'string') {
      this._url = item;
    }

    this.sample = 10;

    this._running = true;
    this._createImage();
  };

  /**
   * Helpers
   */

  function _format(number) {
    return Math.round(number);
  }

  function _roundTo20(number) {
    var value = Math.round(number / 20) * 20;

    if (value >= 255) {
      return 255;
    }

    return value;
  }

  /**
   * Internals
   */

  Color.prototype._runCallbacks = function() {
    this._callbacks.forEach(function(cb, key) {
      this._callbacks[key].method.call(this, this._callbacks[key].call);
    }.bind(this));

    this._callbacks = [];
  };

  Color.prototype._createImage = function() {
    this._img = document.createElement('img');
    this._img.crossOrigin = 'Anonymous';
    this._img.src = this._url;

    this._img.addEventListener('load', function() {
      this._size = this._img.height * this._img.width;
      this._createCanvas();
    }.bind(this));
  };

  Color.prototype._createCanvas = function() {
    var canvas = document.createElement('canvas');

    if (typeof canvas.getContext === 'undefined') {
      return false;
    }

    var context = canvas.getContext('2d');

    canvas.height = this._img.height;
    canvas.style.display = 'none';
    canvas.width = this._img.width;
    context.drawImage(this._img, 0, 0);

    document.body.appendChild(canvas);

    var info = context.getImageData(0, 0, this._img.width, this._img.height);
    this._data = info.data;

    document.body.removeChild(canvas);

    this._running = false;
    this._runCallbacks();
  };

  Color.prototype._average = function(callback) {
    var colors = [];
    var channels = this._extractChannels();

    for (var key in channels) {
      colors.push(_format(channels[key].total / channels[key].amount));
    }

    callback('rgb(' + colors.join(', ') + ')');
  };

  Color.prototype._leastUsed = function(callback) {
    this._extractColorBlocks();

    var color = this._colors[this._colors.length - 1].color;

    callback('rgb(' + color + ')');
  };

  Color.prototype._mostUsed = function(callback) {
    this._extractColorBlocks();

    var color = this._colors[0].color;

    callback('rgb(' + color + ')');
  };

  Color.prototype._extractChannels = function() {
    var channels = {
      r: {amount: 0, total: 0},
      g: {amount: 0, total: 0},
      b: {amount: 0, total: 0},
    };

    for (var i = 0; i < this._size; i += (4 * this.sample)) {
      if (this._data[i + 3] < (255 / 2)) {
        continue;
      }

      var iterator = i;

      for (var key in channels) {
        channels[key].amount++;
        channels[key].total += this._data[iterator];

        iterator++;
      }
    }

    return channels;
  };

  Color.prototype._extractColorBlocks = function() {
    if (this._colors) {
      return;
    }

    var colors = {};
    var sortedColors = [];

    for (var i = 0; i < this._size; i += (4 * this.sample)) {
      if (this._data[i + 3] < (255 / 2)) {
        continue;
      }

      var rgb = [];

      for (var iterator = i; iterator <= i + 2; iterator++) {
        rgb.push(_roundTo20(this._data[i + iterator]));
      }

      rgb = rgb.join(', ');

      if (rgb in colors) {
        colors[rgb]++;
      } else {
        colors[rgb] = 1;
      }
    }

    for (var color in colors) {
      sortedColors.push({
        color: color,
        count: colors[color],
      });
    }

    this._colors = sortedColors.sort(function(a, b) {
      if (a.count < b.count) {
        return 1;
      } else if (a.count > b.count) {
        return -1;
      }

      return 0;
    });
  };

  Color.prototype._call = function(callback, method) {
    if (typeof callback !== 'function') {
      throw new Error('Callback is not provided.');
    }

    if (this._running) {
      this._callbacks.push({
        call: callback,
        method: method,
      });
    } else {
      method.call(this, callback);
    }
  };

  /**
   * External API
   */

  Color.prototype.average = function(callback) {
    this._call(callback, this._average);
  };

  Color.prototype.leastUsed = function(callback) {
    this._call(callback, this._leastUsed);
  };

  Color.prototype.mostUsed = function(callback) {
    this._call(callback, this._mostUsed);
  };

  /**
   * Module
   */

  if (typeof module === 'object') {
    module.exports = Color;
  } else {
    root.Color = Color;
  }
})(this);