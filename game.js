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

  knownMines: 0,
  knownSafe: 0
};

function shuffleRange(mines, start, stop) {
  var len = stop - start;
  for (var i = start; i < stop; i++) {
    var j = Math.floor(Math.random() * len);
    var tmp = mines[i];
    mines[i] = mines[start + j];
    mines[start + j] = tmp;
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

function renderEnter(tiles) {
  var tile = tiles.append("div")
    .attr("class", "tile")
    .style("left", function(d, i) { return (i % 30) * 30 + "px"; })
    .style("top", function(d, i) { return Math.floor(i / 30) * 30 + "px"; })
    .style("background-color", function(d) { return d == -1 ? "#000000" : "#AAAAAA"; })
    .on("click", clickMine);
}

function renderUpdate(tile) {
  tile.data(gvars.board)
    .style("background-color", function(d) { return d == -1 ? "#000000" : "#AAAAAA"; })
    .html(function(d) { return d > 0 ? d : ""; });
}

function initBoard() {
  for (var i = 0; i < 480; i++) {
    gvars.board[i] = 0;
    gvars.mines[i] = i;
  };
}

function clickMine(tile, tilei) {
  if (gvars.state === 0) {
    // No mines within 1 tile of the first click
    gvars.knownSafe = 0;
    eachNeighbour(tilei, function(tilei) {
      gvars.knownSafe++;
      gvars.mines[480 - gvars.knownSafe] = tilei;
      gvars.mines[tilei] = 480 - gvars.knownSafe;
    });
    gvars.state = 1;
  } else return

  shuffleRange(gvars.mines, gvars.knownMines, 480 - gvars.knownSafe);
  for (var i = 0; i < 99; i++) {
    gvars.board[gvars.mines[i]] = -1;
    eachNeighbour(gvars.mines[i], function(mine) {
      if (gvars.board[mine] >= 0) gvars.board[mine]++;
    });
  }

  renderUpdate(gvars.tiles);
}

document.addEventListener('DOMContentLoaded', function(){
  gvars.game = d3.select("#game");
  initBoard();

  gvars.tiles = gvars.game.selectAll(".tile").data(gvars.board);
  renderEnter(gvars.tiles.enter());
});