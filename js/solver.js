function Solver() {
}

Solver.prototype.simulate = (function () {
  function move(direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    if (this.isGameTerminated()) return; // Don't do anything if the game's over

    var cell, tile;

    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
	cell = { x: x, y: y };
	tile = self.grid.cellContent(cell);

	if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            self.grid.insertTile(merged);
            self.grid.removeTile(tile);

            // Converge the two tiles' positions
            tile.updatePosition(positions.next);

            // Update the score
            self.score += merged.value;
          } else {
            self.moveTile(tile, positions.farthest);
          }

          if (!self.positionsEqual(cell, tile)) {
            moved = true; // The tile moved from its original cell!
          }
	}
      });
    });

    return moved;
  }

  return function (manager, direction) {
    return move.call(manager, direction);
  }
})();

Solver.prototype.solve = (function () {
  var MAX_DEPTH = 2;

  function dfs(manager, depth) {
    var scores = [0, 0, 0, 0];

    var original = { grid: manager.grid, score: manager.score };

    for (var direction = 0; direction < 4; direction ++) {
      manager.grid  = original.grid.clone();
      manager.score = original.score;

      if (this.simulate(manager, direction)) {
	if (depth == MAX_DEPTH) {
	  scores[direction] = manager.score;
	}
	else {
	  var cells = manager.grid.availableCells();
	  var size  = cells.length;
	  
	  if (size) {
	    var original2 = { grid: manager.grid, score: manager.score };
	    
	    for (var i = 0; i < size; i ++) {
	      manager.grid  = original2.grid.clone();
	      manager.score = original2.score;

	      manager.grid.insertTile(new Tile(cells[i], Math.random() < 0.9 ? 2 : 4));

	      var s = dfs.call(this, manager, depth + 1);

	      scores[direction] += Math.max.apply(undefined, s);
	    }
	    
	    scores[direction] /= size;
	  }
	}
      }
    }
    
    return scores;
  };

  function shuffle(a) {
    for (var i = a.length, j; j = Math.floor(Math.random() * i), i --; )
      a[i] = [a[j], a[j] = a[i]][0];
  }

  function max_direction(scores) {
    var max_direction = -1, max_score = -1;

    for (var direction = 0; direction < 4; direction ++)
      if (scores[direction] > max_score) {
	max_direction = direction;
	max_score     = scores[direction];
      }

    return max_direction;
  }

  return function (manager) {
    var original = { grid: manager.grid, score: manager.score };

    manager.grid = original.grid.clone();

    var scores = dfs.call(this, manager, 0);

    manager.grid  = original.grid;
    manager.score = original.score;

    return max_direction(scores);
  };
})();
