// util.js: Utilities
const fs = require('fs');
const Queue = require('./Queue.js');  // http://code.iamkate.com/javascript/queues/#usingqueues
const UnionFind = require('./UnionFind.js');

function copy(object) {
  return JSON.parse(JSON.stringify(object));
}

function print(output) {
  console.log(JSON.stringify(output));
}

function zfill(num, places) {
  return String(num).padStart(places, '0');
}

function saveData (root, data) {
  const path = `${root}/${data.game.id}`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  const filename = `${path}/${data.game.id}_${zfill(data.turn, 3)}.json`;
  fs.writeFileSync(filename, JSON.stringify(data));
  return path;
};

function readData(root, gameId, turn) {
  const filename = `${root}/${gameId}/${gameId}_${zfill(turn, 3)}.json`;
  const data = JSON.parse(fs.readFileSync(filename));
  return data;
};

function createBoard(boardWidth, boardHeight, body, snakes) {
  var isBoardOccupied = new Array(boardWidth).fill(0).map(boardWidth => new Array(boardHeight).fill(false));
  for (var i = 0; i < body.length - 1; ++i) {
    isBoardOccupied[body[i].x][body[i].y] = true;
  }
  for (var snake of snakes) {
    for (var i = 0; i < snake.body.length - 1; ++i) {
      isBoardOccupied[snake.body[i].x][snake.body[i].y] = true;
    }
  }
  return isBoardOccupied;
}

function initializePredecessor(boardWidth, boardHeight) {
  var predecessor = new Array(boardWidth).fill(0).map(boardWidth => new Array(boardHeight).fill({x: -1, y: -1}));
  for (var i = 0; i < boardWidth; ++i) {
    for (var j = 0; j < boardHeight; ++j) {
      predecessor[i][j] = {x: i, y: j};
    }
  }
  return predecessor;
}

function isInBound(x, y, boardWidth, boardHeight) {
  return x >= 0 && x < boardWidth && y >= 0 && y < boardHeight;
}

function distance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function to1D(x, y, boardWidth, boardHeight) {
  return y * boardWidth + x;
}

function isSafe(x, y, head, body, snakes) {
  for (let snake of snakes) {
    if (!(head.x == snake.head.x && head.y == snake.head.y) && (distance(x, y, snake.head.x, snake.head.y) == 1) && body.length <= snake.body.length) {
      return false;
    }
  }
  return true;
}

function bfs(boardWidth, boardHeight, board, from, dest) {
  var predecessor = initializePredecessor(boardWidth, boardHeight);
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var queue = new Queue();
  queue.enqueue(from);
  var isDestReached = false;
  while (!queue.isEmpty() && !isDestReached) {
    var length = queue.getLength();
    for (var i = 0; i < length && !isDestReached; ++i) {
      var cur = queue.dequeue();
      for (var dir of dirs) {
        var nx = cur.x + dir[0];
        var ny = cur.y + dir[1];
        if (isInBound(nx, ny, boardWidth, boardHeight) && !board[nx][ny]) {
          predecessor[nx][ny] = {x: cur.x, y: cur.y};
          if (nx == dest.x && ny == dest.y) {
            isDestReached = true;
            break;
          }
          queue.enqueue({x: nx, y: ny});
          board[nx][ny] = true;
        }
      }
    }
  }
  var path = new Array();
  var cur = copy(dest);
  while (isInBound(cur.x, cur.y, boardWidth, boardHeight) && (predecessor[cur.x][cur.y].x != cur.x || predecessor[cur.x][cur.y].y != cur.y)) {
    path.push({x: cur.x, y: cur.y});
    var newParent = {x: predecessor[cur.x][cur.y].x, y: predecessor[cur.x][cur.y].y};
    cur.x = newParent.x;
    cur.y = newParent.y;
  }
  path.reverse();
  return path;
}

function createUnionFindSet(boardWidth, boardHeight, body, snakes) {
  var uf = new UnionFind(boardWidth * boardHeight);
  var board = createBoard(boardWidth, boardHeight, body, snakes);
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (var x = 0; x < boardWidth; ++x) {
    for (var y = 0; y < boardHeight; ++y) {
      if (!board[x][y]) {
        for (var dir of dirs) {
          var nx = x + dir[1];
          var ny = y + dir[0];
          if (isInBound(nx, ny, boardWidth, boardHeight) && !board[nx][ny]) {
            uf.merge(to1D(x, y, boardWidth), to1D(nx, ny, boardWidth));
            // console.log(`Merge (${x}, ${y}) ${to1D(x, y, boardWidth, boardHeight)} and (${nx}, ${ny}) ${to1D(nx, ny, boardWidth, boardHeight)}`);
          }
        }
      }
    }
  }
  var connectedComponent = new Set();
  for (var x = 0; x < boardWidth; ++x) {
    for (var y = 0; y < boardHeight; ++y) {
      if (!board[x][y]) {
        connectedComponent.add(uf.find(to1D(x, y, boardWidth, boardHeight)));
      }
    }
  }
  result = {uf: uf, cc: connectedComponent};
  return result;
}

function determineDirection(boardWidth, boardHeight, head, body, food, snakes) {
  var result = createUnionFindSet(boardWidth, boardHeight, body, snakes);
  var rawBoard = createBoard(boardWidth, boardHeight, body, snakes);
  var uf = result.uf;
  var cc = result.cc;
  var paths = [];
  for (var i = 0; i < food.length; ++i) {
    var board = copy(rawBoard);
    var path = bfs(boardWidth, boardHeight, board, head, food[i]);
    paths.push(path);
  }
  var bestPath = paths.length > 0 ? paths[0] : [];
  var minDist = bestPath.length;
  for (var i = 0; i < paths.length; ++i) {
    if (minDist > paths[i].length) {
      minDist = paths[i].length;
      bestPath = paths[i];
    }
  }
  var move = '';
  if (bestPath.length >= 1) {
    x0 = head.x;
    y0 = head.y;
    x1 = bestPath[0].x;
    y1 = bestPath[0].y;
    if (uf.getSize(to1D(x1, y1, boardWidth, boardHeight)) > body.length) {
      // console.log('from (' + x0 + ', ' + y0 + ') to (' + x1 + ', ' + y1 + ')');
      if (snakes.length <= 1 || isSafe(x1, y1, head, body, snakes)) {
        if ((x0 - x1) == 0 && (y0 - y1) == 1) {
          move = 'down';
        } else if ((x0 - x1) == 0 && (y0 - y1) == -1) {
          move = 'up';
        } else if ((x0 - x1) == 1 && (y0 - y1) == 0) {
          move = 'left';
        } else if ((x0 - x1) == -1 && (y0 - y1) == 0) {
          move = 'right';
        }
      }
    }
  }
  var checkedSafety = 0;
  var checkedConnectedComponent = 0;
  var repeat = 0;
  while (move.length == 0 && repeat++ < 5) {
    var dirsString = ['up', 'down', 'left', 'right'];
    var board = createBoard(boardWidth, boardHeight, body, snakes);
    var dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
    var ccSize = -1;
    for (var i = 0; i < dirs.length; ++i) {
      var nx = head.x + dirs[i][1];
      var ny = head.y + dirs[i][0];
      if (isInBound(nx, ny, boardWidth, boardHeight) && !board[nx][ny]) {
        var curSize = uf.getSize(uf.find(to1D(nx, ny, boardWidth, boardHeight)));
        if (checkedSafety++ < 4) {
          if ((snakes.length <= 1 || isSafe(nx, ny, head, body, snakes)) && curSize > ccSize) {
            move = dirsString[i];
            ccSize = curSize;
          }
        } else if (checkedConnectedComponent++ < 4){
          if (curSize > ccSize) {
            move = dirsString[i];
            ccSize = curSize;
          }
        } else {
          move = dirsString[i];
        }
      }
    }
  }
  return move;
}

/*
// test bfs and determineDirection
const gameId      = '7548c3a4-117b-460b-960e-5ad401298c70';
const turn        = '161';
const gameId      = 'fe3762e5-8cc0-4b5d-958b-285e45f02e36';
const turn        = '10';
const root        = 'test';
const gameId      = '8a057e28-519d-4953-8663-ab1e9808bd79';
const turn        = '42';
const root        = '/media/libao/Files/data/battlesnake';
const gameId      = 'e6b362ab-873c-4ae4-acd7-4bcce9212fce';
const turn        = '0';
const gameData    = readData(root, gameId, turn);
const boardWidth  = gameData.board.width;
const boardHeight = gameData.board.height;
const head        = gameData.you.head;
const body        = gameData.you.body;
const food        = gameData.board.food;
const snakes      = gameData.board.snakes;
const from        = head;
const dest        = food[0];
const board       = createBoard(boardWidth, boardHeight, body, snakes);
print(gameData);

var path = bfs(boardWidth, boardHeight, board, from, dest);
console.log(`from: ${JSON.stringify(from)}`);
console.log(`dest: ${JSON.stringify(dest)}`);
console.log(`path: ${JSON.stringify(path)}`);

var move = determineDirection(boardWidth, boardHeight, head, body, food, snakes);
console.log(`move: ${move}`);

// test UnionFind
var x1 = 8, x2 = 8, y1 = 4, y2 = 6;
console.log(food);

var result = createUnionFindSet(boardWidth, boardHeight, body, snakes);
var uf = result.uf;
var cc = result.cc;
console.log(`(${food[0].x}, ${food[0].y}), (${x1}, ${y1}): ${uf.connected(to1D(food[0].x, food[0].y, boardWidth, boardHeight), to1D(x1, y1, boardWidth, boardHeight))}`);
console.log(`(${food[0].x}, ${food[0].y}), (${x2}, ${y2}): ${uf.connected(to1D(food[0].x, food[0].y, boardWidth, boardHeight), to1D(x2, y2, boardWidth, boardHeight))}`);
console.log(`(${food[1].x}, ${food[1].y}), (${x1}, ${y1}): ${uf.connected(to1D(food[1].x, food[1].y, boardWidth, boardHeight), to1D(x1, y1, boardWidth, boardHeight))}`);
console.log(`(${food[1].x}, ${food[1].y}), (${x2}, ${y2}): ${uf.connected(to1D(food[1].x, food[1].y, boardWidth, boardHeight), to1D(x2, y2, boardWidth, boardHeight))}`);
console.log(uf.find(to1D(food[0].x, food[0].y, boardWidth, boardHeight)));
console.log(uf.find(to1D(food[1].x, food[1].y, boardWidth, boardHeight)));
console.log(uf.find(to1D(x1, y1, boardWidth, boardHeight)));
console.log(uf.find(to1D(x2, y2, boardWidth, boardHeight)));
console.log(uf.getSize(to1D(x1, y1, boardWidth, boardHeight)));
console.log(uf.getSize(to1D(x2, y2, boardWidth, boardHeight)));
// saveData(root, gameData);
*/

module.exports = {
  zfill, saveData, readData, createBoard, initializePredecessor,
  bfs, determineDirection
};
