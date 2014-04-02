function Solver() {
}

Solver.prototype.simulate = (function () {
  var VECTOR = [{ x:  0,  y: -1 }, // Up
                { x:  1,  y:  0 }, // Right
                { x:  0,  y:  1 }, // Down
                { x: -1,  y:  0 }  // Left
               ];

  var TRAVERSALS = new Array(4);

  for (var direction = 0; direction < 4; direction ++)
    TRAVERSALS[direction] = GameManager.prototype.buildTraversals.call({ size: 4 }, VECTOR[direction]);


  function move(direction) {
    // 0: up, 1: right, 2: down, 3: left
    if (this.isGameTerminated()) return; // Don't do anything if the game's over

    var cell, tile;

    var vector     = VECTOR[direction];
    var traversals = TRAVERSALS[direction];
    var moved      = false;
    var grid       = this.grid;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Shortcut for traversals
    var xx = traversals.x, yy = traversals.y;

    // Traverse the grid in the right direction and move tiles
    for (var i = 0, size1 = xx.length; i < size1; i ++) {
      for (var j = 0, size2 = yy.length; j < size2; j ++) {
	cell = { x: xx[i], y: yy[j] };
	tile = grid.cellContent(cell);

	if (tile) {
          var positions = this.findFarthestPosition(cell, vector);
          var next      = grid.cellContent(positions.next);

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            grid.insertTile(merged);
            grid.removeTile(tile);

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
  var MAX_DEPTH          = 32;
  var MIN_SURVIVING_PATH = 40;
  var MAX_PLAYOUTS       = 33333;

  function dfs(manager, depth) {
    if (depth == 0) {
      var counts   = [0, 0, 0, 0];
      var playouts = [0, 0, 0, 0];

      var original = { grid: manager.grid, score: manager.score };

      while (Math.sum.apply(null, playouts) < MAX_PLAYOUTS) {
	if (Math.sum.apply(null, counts) >= MIN_SURVIVING_PATH)
	  break;

	if (counts.count(-1) == 4)
	  break;

	for (var direction = 0; direction < 4; direction ++) {
	  if (counts[direction] == -1)
	    continue;

	  playouts[direction] ++;

	  manager.grid  = original.grid.clone();
	  manager.score = original.score;
	  
	  if (this.simulate(manager, direction)) {
	    var cells = manager.grid.availableCells();
	    
	    cells.shuffle();

	    manager.grid.insertTile(new Tile(cells[0], Math.random() < 0.9 ? 2 : 4));

	    if (dfs.call(this, manager, depth + 1))
	      counts[direction] ++;
	  }
	  else {
	    counts[direction] = -1;
	  }
	}
      }

      return [[counts[0], playouts[0]],
	      [counts[1], playouts[1]],
	      [counts[2], playouts[2]],
	      [counts[3], playouts[3]]];
    }
    else if (depth == MAX_DEPTH) {
      return true;
    }
    else {
      var directions = [0, 1, 2, 3];

      directions.shuffle();

      for (var i = 0; i < 4; i ++)
	if (this.simulate(manager, directions[i])) {
	  var cells = manager.grid.availableCells();
	  
	  cells.shuffle();

	  manager.grid.insertTile(new Tile(cells[0], Math.random() < 0.9 ? 2 : 4));

	  return dfs.call(this, manager, depth + 1);
	}

      return false;
    }
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

    if (false)
      document.querySelector('.title').innerHTML =
        scores[0][0] + '/' + scores[0][1] + ',' +
        scores[1][0] + '/' + scores[1][1] + ',' +
        scores[2][0] + '/' + scores[2][1] + ',' +
        scores[3][0] + '/' + scores[3][1];
    
    scores = [scores[0][0] / scores[0][1],
	      scores[1][0] / scores[1][1],
	      scores[2][0] / scores[2][1],
	      scores[3][0] / scores[3][1]]
    
    manager.grid  = original.grid;
    manager.score = original.score;

    var direction = max_direction(scores);
    
    if (direction != -1) {
      return direction;
    }
    else {
      return Math.floor(Math.random() * 4);
    }
  };
})();
