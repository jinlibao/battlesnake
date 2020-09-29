'use strict';
const util = require('./util.js');
const root = '/media/libao/Files/data/battlesnake';

const bodyParser = require('body-parser');
const express = require('express');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.get('/', handleIndex);
app.post('/start', handleStart);
app.post('/move', handleMove);
app.post('/end', handleEnd);

app.listen(PORT, () => console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`));


function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: '1',
    author: 'Libao Jin & Yanbin Gong',
    color: '#07F2DB',
    head: 'bwc-ski',
    tail: 'shac-mouse'
  };
  response.status(200).json(battlesnakeInfo);
}

function handleStart(request, response) {
  var gameData = request.body;
  console.log(gameData);
  util.saveData(root, gameData);

  console.log('START');
  response.status(200).send('ok');
}

function handleMove(request, response) {
  var gameData = request.body;

  util.saveData(root, gameData);

  var move = util.determineDirection(
    gameData.board.width,
    gameData.board.height,
    gameData.you.head,
    gameData.you.body,
    gameData.board.food,
    gameData.board.snakes
  );

  var moveString = (move.length > 0 ? move : "nowhere. Oops") + '!';
  console.log(`Turn ${util.zfill(gameData.turn, 3)}: move ${moveString}`);

  response.status(200).send({
    move: move,
    shout: "Ummm... I am moving " + moveString
  });
}

function handleEnd(request, response) {
  var gameData = request.body;

  console.log(gameData);
  console.log('Saved data to ' + util.saveData(root, gameData));

  console.log('END');
  response.status(200).send('ok');
}
