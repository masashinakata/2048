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
	      
	      manager.grid.insertTile(new Tile(cells[i], 2));

	      var r2 = dfs.call(this, manager, depth + 1);

	      manager.grid  = original2.grid.clone();
	      manager.score = original2.score;
	      
	      manager.grid.insertTile(new Tile(cells[i], 4));

	      var r4 = dfs.call(this, manager, depth + 1);

	      scores[direction] += r2.score * 0.9 + r4.score * 0.1;
	    }
	    
	    scores[direction] /= size;
	  }
	}
      }
    }
    
    var max_score = -1, max_direction = -1;

    for (var direction = 0; direction < 4; direction ++) {
      if (scores[direction] > max_score) {
	max_direction = direction;
	max_score     = scores[direction];
      }
    }

    return { direction: max_direction, score: max_score };
  };

  return function (manager) {
    var original = { grid: manager.grid, score: manager.score };

    var flags = [false, false, false, false];

    var max_score = -1, max_direction = -1;

    for (var direction = 0; direction < 4; direction ++) {
      manager.grid  = original.grid.clone();
      manager.score = original.score;

      if (flags[direction] = this.simulate(manager, direction)) {
	if (manager.score > max_score) {
	  max_score = manager.score;

	  max_direction = direction;
	}
      }
    }

    manager.grid  = original.grid;
    manager.score = original.score;

    if (max_direction != -1) {
      return max_direction;
    }
    else {
      return Math.floor(Math.random() * 4);
    }
  };
})();
