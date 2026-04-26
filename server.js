const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const DATA_FOLDER = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_FOLDER, 'playlist.json');
function ensureDataFile() {
    if (!fs.existsSync(DATA_FOLDER)) {
        fs.mkdirSync(DATA_FOLDER);
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
}