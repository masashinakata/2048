Array.prototype.count = function (x) {
  var c = 0;
  for (var i = 0, size = this.length; i < size; i ++)
    if (this[i] == x)
      c ++;
  return c;
};
