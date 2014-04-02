Array.prototype.shuffle = function () {
  for (var i = this.length, j; j = Math.floor(Math.random() * i), i --; )
    this[i] = [this[j], this[j] = this[i]][0];
};
