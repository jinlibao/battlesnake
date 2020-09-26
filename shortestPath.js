const Queue = require('./Queue.js');  // http://code.iamkate.com/javascript/queues/#usingqueues

function createBoard(boardWidth, boardHeight, bodies, snakes) {
  var isBoardOccupied = new Array(boardWidth).fill(0).map(boardWidth => new Array(boardHeight).fill(false));
  for (var body of bodies) {
    isBoardOccupied[body.x][body.y] = true;
  }
  for (var snake of snakes) {
    for (var body of snake.body) {
      isBoardOccupied[body.x][body.y] = true;
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

function shortestPathToFood(boardWidth, boardHeight, head, food, bodies, snakes) {
  var predecessor = initializePredecessor(boardWidth, boardHeight);
  var board = createBoard(boardWidth, boardHeight, bodies, snakes);
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var queue = new Queue();
  queue.enqueue(head);
  var isFoodReached = false;
  var dist = 0;
  while (!queue.isEmpty() && !isFoodReached) {
    var length = queue.getLength();
    dist++;
    for (var i = 0; i < length && !isFoodReached; ++i) {
      var cur = queue.dequeue();
      for (var dir of dirs) {
        var nx = cur.x + dir[0];
        var ny = cur.y + dir[1];
        if (isInBound(nx, ny, boardWidth, boardHeight) && !board[nx][ny]) {
          predecessor[nx][ny] = {x: cur.x, y: cur.y};
          if (nx == food.x && ny == food.y) {
            isFoodReached = true;
            break;
          }
          queue.enqueue({x: nx, y: ny});
          board[nx][ny] = true;
        }
      }
    }
  }
  var shortestPath = new Array();
  var cur = food;
  while (isInBound(cur.x, cur.y, boardWidth, boardHeight) && (predecessor[cur.x][cur.y].x != cur.x || predecessor[cur.x][cur.y].y != cur.y)) {
    shortestPath.push({x: cur.x, y: cur.y});
    var newParent = {x: predecessor[cur.x][cur.y].x, y: predecessor[cur.x][cur.y].y}
    cur.x = newParent.x;
    cur.y = newParent.y;
  }
  shortestPath.reverse();
  return shortestPath;
}

function shortestDistanceToFood(boardWidth, boardHeight, head, food, bodies, snakes) {
  var board = createBoard(boardWidth, boardHeight, bodies, snakes);
  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var queue = new Queue();
  queue.enqueue(head);
  var isFoodReached = false;
  var dist = 0;
  while (!queue.isEmpty() && !isFoodReached) {
    var length = queue.getLength();
    for (var i = 0; i < length && !isFoodReached; ++i) {
      var cur = queue.dequeue();
      for (var dir of dirs) {
        var nx = cur.x + dir[0];
        var ny = cur.y + dir[1];
        if (nx >= 0 && nx < boardWidth && ny >= 0 && ny < boardHeight && !board[nx][ny]) {
          if (nx == food.x && ny == food.y) {
            isFoodReached = true;
            break;
          }
          queue.enqueue({x: nx, y: ny});
          board[nx][ny] = true;
        }
      }
    }
    dist++;
  }
  return dist;
}

function determineDirection(boardWidth, boardHeight, head, food, bodies, snakes) {
  var shortestPaths = new Array();
  for (var i = 0; i < food.length; ++i) {
    var shortestPath = shortestPathToFood(boardWidth, boardHeight, head, food[i], bodies, snakes);
    if (shortestPath.length > 0) {
      shortestPaths[shortestPaths.length] = shortestPath;
    }
  }
  var bestPath = shortestPaths.length > 0 ? shortestPaths[0] : [];
  var minDist = bestPath.length;
  for (var i = 0; i < shortestPaths.length; ++i) {
    if (minDist > shortestPaths[i].length) {
      minDist = shortestPaths[i].length;
      bestPath = shortestPaths[i];
    }
  }

  var move = '';

  if (bestPath.length >= 1) {
    x0 = head.x;
    y0 = head.y;
    x1 = bestPath[0].x;
    y1 = bestPath[0].y;
    console.log('from: (' + x0 + ', ' + y0 + ') to (' + x1 + ', ' + y1 + ')');
    if ((x0 - x1) == 0 && (y0 - y1) == 1) {
      move = 'down';
    } else if ((x0 - x1) == 0 && (y0 - y1) == -1) {
      move = 'up';
    } else if ((x0 - x1) == 1 && (y0 - y1) == 0) {
      move = 'left';
    } else if ((x0 - x1) == -1 && (y0 - y1) == 0) {
      move = 'right';
    }
  } else {
    var dirsString = ['up', 'down', 'left', 'right'];
    var board = createBoard(boardWidth, boardHeight, bodies, snakes);
    var dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < dirs.length; ++i) {
      var nx = head.x + dirs[i][1];
      var ny = head.y + dirs[i][0];
      if (isInBound(nx, ny, boardWidth, boardWidth) && !board[nx][ny]) {
        move = dirsString[i];
        break;
      }
    }
  }
  return move;
}

// var bodies = [{x: 0, y: 6}, {x: 0, y: 7}, {x: 0, y: 8}];
// var head = bodies[0];
// var snakes = [
//   {
//     body: [{x: 1, y: 7}, {x: 1, y: 8}],
//     head: {x: 1, y: 7},
//   },
//   {
//     body: [{x: 2, y: 7}, {x: 2, y: 8}],
//     head: {x: 2, y: 7},
//   },
// ];

// var snakes = [
//   {
//     body: [{x: 1, y: 6}, {x: 1, y: 7}, {x: 1, y: 8}],
//     head: {x: 1, y: 6},
//   },
//   {
//     body: [{x: 2, y: 6}, {x: 2, y: 7}, {x: 2, y: 8}],
//     head: {x: 2, y: 6},
//   },
// ];
// var food = [{x: 0, y: 10}, {x: 5, y: 5}];
//
// var boardWidth = 11;
// var boardHeight = 11;

// var dist = shortestDistanceToFood(boardWidth, boardHeight, head, food[0], bodies, snakes);
// console.log(dist);
// var shortestPath = shortestPathToFood(boardWidth, boardHeight, head, food[0], bodies, snakes);
// console.log(shortestPath);
// var dist = shortestDistanceToFood(boardWidth, boardHeight, head, food[1], bodies, snakes);
// console.log(dist);
// var shortestPath = shortestPathToFood(boardWidth, boardHeight, head, food[1], bodies, snakes);
// console.log(shortestPath);
// var move = determineDirection(boardWidth, boardHeight, head, food, bodies, snakes);
// console.log(move);
// for (var i = 0; i < board.boardHeight; ++i) {
//   for (var j = 0; j < board[i].boardHeight; ++j) {
//     console.log(i + ',' + j + ': ' + board[i][j])
//   }
// }

module.exports = {shortestPathToFood, shortestDistanceToFood, createBoard, initializePredecessor, determineDirection}
