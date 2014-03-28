function Solver() {
}

Solver.prototype.simulate = (function () {
  function move(direction) {
    // 0: up, 1: right, 2: down, 3: left
    if (this.isGameTerminated()) return; // Don't do anything if the game's over

    var cell, tile;

    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Shortcut for traversals
    var xx = traversals.x, yy = traversals.y;

    // Traverse the grid in the right direction and move tiles
    for (var i = 0, size1 = xx.length; i < size1; i ++) {
      for (var j = 0, size2 = yy.length; j < size2; j ++) {
	cell = { x: xx[i], y: yy[j] };
	tile = this.grid.cellContent(cell);

	if (tile) {
          var positions = this.findFarthestPosition(cell, vector);
          var next      = this.grid.cellContent(positions.next);

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            this.grid.insertTile(merged);
            this.grid.removeTile(tile);

            // Converge the two tiles' positions
            tile.updatePosition(positions.next);

            // Update the score
            this.score += merged.value;
          } else {
            this.moveTile(tile, positions.farthest);
          }

	  // The tile moved from its original cell if position is
	  // changed
	  moved |= ! this.positionsEqual(cell, tile);
	}
      }
    }

    return moved;
  }

  return function (manager, direction) {
    return move.call(manager, direction);
  }
})();

Solver.prototype.solve = (function () {
  var MAX_DEPTH = 5;
  var MAX_CELLS = 2;

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
	    shuffle(cells);

	    cells.splice(Math.floor(Math.random() * MAX_CELLS + 1));

	    size = cells.length;

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
