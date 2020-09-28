// util.js: Utilities
const fs = require('fs');

const zfill = (num, places) => String(num).padStart(places, '0');

const saveData = (root, data) => {
  const path = root + '/' + data.game.id;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  const filename = path + '/' + data.game.id + '_' + zfill(data.turn, 3) + '.json';
  console.log('Saving data to ' + filename);
  fs.writeFileSync(filename, JSON.stringify(data));
};

const readData = (root, gameId, turn) => {
  filename = `${root}/${gameId}/${gameId}_${turn}.json`;
  data = JSON.parse(fs.readFileSync(filename));
  return data;
};

module.exports = {zfill, saveData, readData};
