'use strict';
const shortestPath = require('./shortestPath.js');
const zfill = (num, places) => String(num).padStart(places, '0');
const dataRootPath = '/media/libao/Files/data/battlesnake';
const saveToFile = (dataRootPath, gameData) => {
  const dataPath = dataRootPath + '/' + gameData.game.id;
  const gameDataFile = dataPath + '/' + gameData.game.id + '_' + zfill(gameData.turn, 3) + '.json';
  console.log('Saving gameData to ' + gameDataFile);
  fs.writeFileSync(gameDataFile, JSON.stringify(gameData));
}

const fs = require('fs');
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
    color: 'green',
    head: 'default',
    tail: 'default'
  };
  response.status(200).json(battlesnakeInfo);
}

function handleStart(request, response) {
  var gameData = request.body;

  console.log(gameData);
  const dataPath = dataRootPath + '/' + gameData.game.id;
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  saveToFile(dataRootPath, gameData);

  console.log('START');
  response.status(200).send('ok');
}

function handleMove(request, response) {
  var gameData = request.body;

  saveToFile(dataRootPath, gameData);

  var move = shortestPath.determineDirection(
    gameData.board.width,
    gameData.board.height,
    gameData.you.head,
    gameData.board.food,
    gameData.you.body,
    gameData.board.snakes
  );

  console.log('MOVE: ' + move);
  response.status(200).send({
    move: move
  });
}

function handleEnd(request, response) {
  var gameData = request.body;

  console.log(gameData);
  saveToFile(dataRootPath, gameData);

  console.log('END');
  response.status(200).send('ok');
}
