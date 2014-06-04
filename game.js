/** @license
 * Heisenbomb <https://github.com/xthexder/heisenbomb>
 * License: MIT
 * Author: Jacob Wirth
 */

/* Game states:
  0 - New game
  1 - Game running
  2 - Game over

  Game modes:
  0 - Normal
*/

var gvars = {state: 0, mode: 0, game: null, tiles: null, board: [], mines: []};

function shuffle(mines) {
    for (var i = mines.length - 1; i >= 0; i--) {
      var j = Math.floor(Math.random() * i);
      var tmp = mines[i];
      mines[i] = mines[j];
      mines[j] = tmp;
    }
};

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

function clickMine(tile, tilei) {
  if (gvars.state === 0) {
    for (var i = 0, j = 0; i < 30 * 16 - 9; i++, j++) {
      if (j === tilei - 31 || j === tilei - 1 || j === tilei + 29) j += 3;
      gvars.mines[i] = j;
    };
    shuffle(gvars.mines);
    for (var i = 0; i < 99; i++) {
      var mine = gvars.mines[i];
      gvars.board[mine] = -1;
      var a = (mine % 30 > 0) ? -1 : 0;
      var b = (mine % 30 < 29) ? 1 : 0;
      for (var j = a; j <= b; j++) {
        if (mine >= 30 && gvars.board[mine + j - 30] >= 0) gvars.board[mine + j - 30]++;
        if (gvars.board[mine + j] >= 0) gvars.board[mine + j]++;
        if (mine < 30 * 15 && gvars.board[mine + j + 30] >= 0) gvars.board[mine + j + 30]++;
      }
    }
    gvars.state = 1;
  }
  renderUpdate(gvars.tiles);
}

document.addEventListener('DOMContentLoaded', function(){
  gvars.game = d3.select("#game");
  for (var i = 0; i < 30 * 16; i++) {
    gvars.board[i] = 0;
  };

  gvars.tiles = gvars.game.selectAll(".tile").data(gvars.board);
  renderEnter(gvars.tiles.enter());
});