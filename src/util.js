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

function createBoard2(boardWidth, boardHeight, snakes) {
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var isBoardOccupied = new Array(boardWidth).fill(0).map(boardWidth => new Array(boardHeight).fill(false));
  for (let snake of snakes) {
    for (var i = 0; i < snake.body.length - 1; ++i) {
      isBoardOccupied[snake.body[i].x][snake.body[i].y] = true;
    }
  }
  return isBoardOccupied;
}

function createBoard(boardWidth, boardHeight, body, snakes) {
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var isBoardOccupied = new Array(boardWidth).fill(0).map(boardWidth => new Array(boardHeight).fill(false));
  for (var i = 0; i < body.length - 1; ++i) {
    isBoardOccupied[body[i].x][body[i].y] = true;
  }
  for (let snake of snakes) {
    for (var i = 0; i < snake.body.length - 1; ++i) {
      isBoardOccupied[snake.body[i].x][snake.body[i].y] = true;
    }
    if (body[0].x == snake.body[0].x && body[0].y == snake.body[0].y) continue;
    if (body.length >= snake.body.length) continue;
    for (let dir of dirs) {
      var nx = snake.body[0].x + dir[1];
      var ny = snake.body[0].y + dir[0];
      if (isInBound(nx, ny, boardWidth, boardHeight)) {
        isBoardOccupied[nx][ny] = true;
      }
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

function coordinateToDirection(x0, y0, x1, y1) {
  move = '';
  if ((x0 - x1) == 0 && (y0 - y1) == 1) {
    move = 'down';
  } else if ((x0 - x1) == 0 && (y0 - y1) == -1) {
    move = 'up';
  } else if ((x0 - x1) == 1 && (y0 - y1) == 0) {
    move = 'left';
  } else if ((x0 - x1) == -1 && (y0 - y1) == 0) {
    move = 'right';
  }
  return move;
}

function determineDirection(boardWidth, boardHeight, head, body, food, snakes, turn, health) {
  var result = createUnionFindSet(boardWidth, boardHeight, body, snakes);
  var rawBoard = createBoard(boardWidth, boardHeight, body, snakes);
  var uf = result.uf;
  var cc = result.cc;
  var paths = [];
  for (var i = 0; i < food.length; ++i) {
    var board = copy(rawBoard);
    if (board[food[i].x][food[i].y]) continue;
    var path = bfs(boardWidth, boardHeight, board, head, food[i]);
    paths.push(path);
  }
  var board = copy(rawBoard);
  for (var i = 1; i < Math.min(body.length - 2, Math.min(turn, 1)); ++i) {
    board[body[body.length - i].x][body[body.length - i].y] = false;
  }
  var pathToTail = bfs(boardWidth, boardHeight, board, head, body[body.length - 1]);

  var bestPath = [];
  var minDist = boardWidth * boardHeight;
  for (var i = 0; i < paths.length; ++i) {
    if (paths[i].length >= 1 && minDist > paths[i].length) {
      minDist = paths[i].length;
      bestPath = paths[i];
    }
  }
  var tail = body[body.length - 1];
  var move = '';
  if (bestPath.length >= 1) {
    var nx = bestPath[0].x;
    var ny = bestPath[0].y;
    if (uf.getSize(to1D(nx, ny, boardWidth, boardHeight)) >= body.length
      || uf.connected(to1D(nx, ny, boardWidth, boardHeight), to1D(tail.x, tail.y, boardWidth, boardHeight))) {
      if (snakes.length <= 1 || isSafe(nx, ny, head, body, snakes)) {
        move = coordinateToDirection(head.x, head.y, nx, ny);
        console.log('0')
      }
    }
  }
  var dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
  if (move.length == 0) {
    var curSizeMax = -1;
    for (let dir of dirs) {
      var nx = head.x + dir[1];
      var ny = head.y + dir[0];
      var curSize = uf.getSize(to1D(nx, ny, boardWidth, boardHeight));
      if (isInBound(nx, ny, boardWidth, boardHeight) && !rawBoard[nx][ny]) {
        if ((snakes.length <= 1 || isSafe(nx, ny, head, body, snakes)) && curSize > body.length) {
          if (curSizeMax < curSize) {
            move = coordinateToDirection(head.x, head.y, nx, ny);
            console.log('1')
            curSizeMax = curSize;
          } else if (snakes.length == 1) {
            if (curSizeMax < curSize) {
              move = coordinateToDirection(head.x, head.y, nx, ny);
              curSizeMax = curSize;
            }
          }
        }
      }
    }
    if (move.length == 0) {
      if (pathToTail.length >= 1) {
        var x = pathToTail[0].x;
        var y = pathToTail[0].y;
        if (uf.getSize(to1D(x, y, boardWidth, boardHeight)) < body.length) {
          print(x + ',' + y)
          print(rawBoard[x][y]);
          if ((snakes.length <= 1 || isSafe(x, y, head, body, snakes)) && !rawBoard[x][y]) {
            move = coordinateToDirection(head.x, head.y, x, y);
            console.log('2')
          }
        }
      }
    }
  }
  if (move.length == 0) {
    var curSizeMax = -1;
    for (let dir of dirs) {
      var nx = head.x + dir[1];
      var ny = head.y + dir[0];
      var curSize = uf.getSize(to1D(nx, ny, boardWidth, boardHeight));
      if (isInBound(nx, ny, boardWidth, boardHeight) && !rawBoard[nx][ny]) {
        if (curSizeMax < curSize) {
          move = coordinateToDirection(head.x, head.y, nx, ny);
          console.log('3')
          curSizeMax = curSize;
        }
      }
    }
  }
  if (move.length == 0) {
    var board = createBoard2(boardWidth, boardHeight, snakes);
    var curSizeMax = -1;
    for (let dir of dirs) {
      var nx = head.x + dir[1];
      var ny = head.y + dir[0];
      var curSize = uf.getSize(to1D(nx, ny, boardWidth, boardHeight));
      if (isInBound(nx, ny, boardWidth, boardHeight) && !board[nx][ny]) {
        if (curSizeMax < curSize) {
          move = coordinateToDirection(head.x, head.y, nx, ny);
          console.log('4')
          curSizeMax = curSize;
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
const gameId      = '8474d185-fe35-43c1-829a-6a81e6707dc8';
const turn        = '46';
const gameId      = 'e6b362ab-873c-4ae4-acd7-4bcce9212fce';
const turn        = '40';
const gameId      = 'b2c0066d-ee01-432a-8a42-f41dde762844';
const turn        = '6';
const gameId      = '901413fa-3e27-45c0-8d83-c9ca5635ae1f';
const turn        = '176';
const gameId      = '629f9dc9-fa85-4033-9ee2-c5b456284bf8';
const turn        = '221';
const gameId      = '4f5d5d52-0c64-4181-91e2-22808d9e02e3';
const turn        = '232';
const gameId      = 'af21cdd2-76d2-483a-a7b4-7e394b3dabbe';
const turn        = '76';
const gameId      = '6d675727-d372-40a2-aead-2ca9e6b23c8f';
const turn        = '140';
const gameId      = '6d60878a-4764-47a9-b8bc-86b34bc76907';
const turn        = 149;
const gameId      = '608862eb-d36e-4496-9ea6-aa4e11aed3de';
const turn        = 71;
const gameId      = 'c79dca38-4903-4e6b-824a-94f7013df1b7';
const turn        = 172;
const gameId      = '932f1df7-ca68-4127-b794-8ce661ed2ef1';
const turn        = 227;
const gameId      = '40256b2c-a4d6-4695-bfe4-54d8b434534b';
const turn        = 131;
const root        = '/media/libao/Files/data/battlesnake';
const gameId      = 'c6337038-60fa-429c-8d75-df998669fac1';
const turn        = 96;
const gameData    = readData(root, gameId, turn);
const boardWidth  = gameData.board.width;
const boardHeight = gameData.board.height;
const head        = gameData.you.head;
const body        = gameData.you.body;
const health      = gameData.you.health;
const food        = gameData.board.food;
const snakes      = gameData.board.snakes;

var move = determineDirection(boardWidth, boardHeight, head, body, food, snakes, turn, health);
console.log(`move: ${move}`);

/*
const from        = head;
const dest        = food[0];
const board       = createBoard(boardWidth, boardHeight, body, snakes);
const path = bfs(boardWidth, boardHeight, board, from, dest);
console.log(`from: ${JSON.stringify(from)}`);
console.log(`dest: ${JSON.stringify(dest)}`);
console.log(`path: ${JSON.stringify(path)}`);
*/

/*
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
