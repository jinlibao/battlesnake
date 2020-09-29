// Union-Find Set
module.exports = function(n) {
  var sz = new Array(n).fill(1);
  var id = Array.from(Array(n).keys());
  this.getSize = function(x) {
    return sz[this.find(x)];
  };
  this.getId = function() {
    return id;
  };
  this.find = function(x) {
    while (x != id[x]) {
      id[x] = id[id[x]];
      x = id[x];
    }
    return x;
  };
  this.connected = function(x, y) {
    return this.find(x) == this.find(y);
  };
  this.merge = function(x, y) {
    x = this.find(x);
    y = this.find(y);
    if (x == y) return false;
    if (sz[x] > sz[y]) {
      sz[x] += sz[y];
      id[y] = x;
    } else {
      sz[y] += sz[x];
      id[x] = y;
    }
    return true;
  };
};
