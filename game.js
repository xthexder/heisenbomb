/** @license
 * Heisenbomb <https://github.com/xthexder/heisenbomb>
 * License: MIT
 * Author: Jacob Wirth
 */

/*
  Board size: 30 x 16 = 480

  Game states:
    0 - New game
    1 - Game running
    2 - Game over

  Game modes:
    0 - Normal
*/

var gvars = {
  state: 0,
  mode: 0,

  game: null,
  tiles: null,

  board: [],
  mines: [],
  rmines: [],
  edges: [],

  knownMines: 0,
  knownSafe: 0
};

function shuffleMines() {
  var len = 480 - gvars.knownMines - gvars.knownSafe;
  for (var i = 479 - gvars.knownSafe; i >= gvars.knownMines; i--) {
    var j = Math.floor(Math.random() * len);
    var tmp = gvars.mines[i];
    gvars.mines[i] = gvars.mines[gvars.knownMines + j];
    gvars.mines[gvars.knownMines + j] = tmp;
    gvars.rmines[tmp] = gvars.knownMines + j;
    gvars.rmines[gvars.mines[i]] = i;
  }
}

// callback(tilei)
function eachNeighbour(tilei, callback) {
  var a = (tilei % 30 > 0) ? -1 : 0;
  var b = (tilei % 30 < 29) ? 1 : 0;
  for (var i = a; i <= b; i++) {
    if (tilei >= 30) callback(tilei + i - 30);
    callback(tilei + i);
    if (tilei < 450) callback(tilei + i + 30);
  }
}

function floodFill(board, tilei, callback) {
  if (board[tilei] === -1) {
    callback(tilei);
    board[tilei] = 0;
    eachNeighbour(tilei, function(i) {
      if (board[i] !== 0) floodFill(board, i, callback);
    });
  } else if (board[tilei] > 0) {
    callback(tilei);
    board[tilei] = 0;
  }
}

function safeTile(tilei) {
  if (480 - gvars.knownSafe <= gvars.rmines[tilei]) return;
  gvars.knownSafe++;
  var tmp = gvars.mines[gvars.rmines[tilei]];
  gvars.mines[gvars.rmines[tilei]] = gvars.mines[480 - gvars.knownSafe];
  gvars.rmines[gvars.mines[480 - gvars.knownSafe]] = gvars.rmines[tilei];
  gvars.mines[480 - gvars.knownSafe] = tmp;
  gvars.rmines[tmp] = 480 - gvars.knownSafe;
}

function mineTile(tilei) {
  if (gvars.knownMines > gvars.rmines[tilei]) return;
  var tmp = gvars.mines[gvars.rmines[tilei]];
  gvars.mines[gvars.rmines[tilei]] = gvars.mines[gvars.knownMines];
  gvars.rmines[gvars.mines[gvars.knownMines]] = gvars.rmines[tilei];
  gvars.mines[gvars.knownMines] = tmp;
  gvars.rmines[tmp] = gvars.knownMines;
  gvars.knownMines++;
}

function resetBoard() {
  gvars.board[i] = new Array(480);
  gvars.mines[i] = new Array(480);
  gvars.rmines[i] = new Array(480);
  gvars.edges = [];

  for (var i = 0; i < 480; i++) {
    gvars.board[i] = -1;
    gvars.mines[i] = i;
    gvars.rmines[i] = i;
  };
  gvars.knownMines = 0;
  gvars.knownSafe = 0;
  gvars.state = 0;
}

function renderEnter(tiles) {
  var tile = tiles.append("div")
    .attr("class", "tile outset")
    .style("left", function(d, i) { return (i % 30) * 30 + "px"; })
    .style("top", function(d, i) { return Math.floor(i / 30) * 30 + "px"; })
    .on("click", clickMine);
}

function renderUpdate(tile) {
  tile.data(gvars.board)
    .attr("class", function(d) { return d < 0 ? "tile outset" : "tile"; })
    .html(function(d) { return d > 0 ? d : (d === -2 ? "X" : ""); });
}

function openTile(tilei) {
  var tmpBoard = gvars.board.slice(0);
  shuffleMines();
  for (var i = 0; i < 99; i++) {
    tmpBoard[gvars.mines[i]] = -2;
    eachNeighbour(gvars.mines[i], function(mine) {
      if (tmpBoard[mine] === -1) {
        tmpBoard[mine] = 1;
      } else if (tmpBoard[mine] >= 0) tmpBoard[mine]++;
    });
  }

  floodFill(tmpBoard, tilei, function(i) {
    if (tmpBoard[i] > 0) {
      gvars.board[i] = tmpBoard[i];
      gvars.edges.push(i);
    } else {
      gvars.board[i] = 0;
    }
    safeTile(i);
  });

  var changes = true;
  while (changes) {
    changes = false;
    for (var j = gvars.edges.length - 1; j >= 0; j--) {
      var unknownCount = 0;
      var mineCount = 0;
      eachNeighbour(gvars.edges[j], function(i) {
        if (gvars.board[i] === -2) {
          mineCount++;
        } else if (gvars.board[i] === -1) {
          unknownCount++;
        }
      });
      if (unknownCount > 0) {
        if (gvars.board[gvars.edges[j]] - mineCount === unknownCount) {
          changes = true;
          eachNeighbour(gvars.edges[j], function(i) {
            if (gvars.board[i] === -1) {
              gvars.board[i] = -2;
              mineTile(i);
            }
          });
        } else if (gvars.board[gvars.edges[j]] === mineCount) {
          changes = true;
          eachNeighbour(gvars.edges[j], function(i) {
            if (gvars.board[i] === -1) {
              gvars.board[i] = 9;
              safeTile(i);
            }
          });
        }
      }
    }
  }
}

function clickMine(tile, tilei) {
  if (gvars.state === 0) {
    // No mines within 1 tile of the first click
    eachNeighbour(tilei, safeTile);
    gvars.state = 1;

    openTile(tilei);
  } else if (gvars.state === 1) {
    shuffleMines();

    for (var i = 0; i < 99; i++) {
      gvars.board[gvars.mines[i]] = -2;
    }
  } else {
    resetBoard();
  }

  renderUpdate(gvars.tiles);
}

document.addEventListener('DOMContentLoaded', function(){
  gvars.game = d3.select("#game");
  resetBoard();

  gvars.tiles = gvars.game.selectAll(".tile").data(gvars.board);
  renderEnter(gvars.tiles.enter());
});