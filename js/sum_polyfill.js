Math.sum = function () {
  var s = 0;
  for (var i = 0, size = arguments.length; i < size; i ++)
    s += arguments[i];
  return s;
};
