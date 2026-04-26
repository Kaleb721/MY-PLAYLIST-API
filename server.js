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
function readData() {
    try {
        ensureDataFile();
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}
function getNextId(songs) {
    if (songs.length === 0) return 1;
    let maxId = 0;
    for (let i = 0; i < songs.length; i++) {
        if (songs[i].id > maxId) {
            maxId = songs[i].id;
        }
    }
    return maxId + 1;
}
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
}
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
    const url = req.url;
    const method = req.method;
    console.log(`${method} ${url}`);
    if (method === 'GET' && url === '/songs') {
        const songs = readData();
        sendJSON(res, 200, songs);
    }
    else if (method === 'GET' && url.match(/^\/songs\/\d+$/)) {
        const id = parseInt(url.split('/')[2]);
        const songs = readData();
        const song = songs.find(s => s.id === id);
        if (song) {
            sendJSON(res, 200, song);
        } else {
            sendJSON(res, 404, { error: 'Song not found' });
        }
    }
    else if (method === 'POST' && url === '/songs') {
        try {
            const body = await parseBody(req);
            if (!body.title || !body.artist) {
                sendJSON(res, 400, { error: 'Title and artist are required' });
                return;
            }
            const songs = readData();
            const newSong = {
                id: getNextId(songs),  // This gives 1, 2, 3...
                title: body.title,
                artist: body.artist,
                album: body.album || '',
                genre: body.genre || '',
                duration: body.duration || '',
                year: body.year || null
            };
            songs.push(newSong);
            writeData(songs);
            sendJSON(res, 201, newSong);
        } catch (error) {
            sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
    }
       else if (method === 'PUT' && url.match(/^\/songs\/\d+$/)) {
        try {
            const id = parseInt(url.split('/')[2]);
            const body = await parseBody(req);
            const songs = readData();
            const index = songs.findIndex(s => s.id === id);
            
            if (index === -1) {
                sendJSON(res, 404, { error: 'Song not found' });
                return;
            }
            songs[index] = {
                ...songs[index],
                title: body.title || songs[index].title,
                artist: body.artist || songs[index].artist,
                album: body.album || songs[index].album,
                genre: body.genre || songs[index].genre,
                duration: body.duration || songs[index].duration,
                year: body.year !== undefined ? body.year : songs[index].year
            };
            writeData(songs);
            sendJSON(res, 200, songs[index]);
        } catch (error) {
            sendJSON(res, 400, { error: 'Invalid JSON body' });
        }
    }
    else if (method === 'DELETE' && url.match(/^\/songs\/\d+$/)) {
        const id = parseInt(url.split('/')[2]);
        const songs = readData();
        const index = songs.findIndex(s => s.id === id);
        if (index === -1) {
            sendJSON(res, 404, { error: 'Song not found' });
            return;
        }
        songs.splice(index, 1);
        writeData(songs);
        sendJSON(res, 200, { message: 'Song deleted successfully' });
    }
    else {
        sendJSON(res, 404, { error: 'Route not found' });
    }
    });
    server.listen(PORT, () => {
    console.log('\n=================================');
    console.log('🎵 MUSIC PLAYLIST API');
    console.log('=================================');
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log('\n📋 ENDPOINTS:');
      console.log('---------------------------------');
    console.log('GET    /songs           - Get all songs');
    console.log('GET    /songs/1         - Get song with ID 1');
    console.log('POST   /songs           - Add song (gets ID 1,2,3...)');
    console.log('PUT    /songs/1         - Update song with ID 1');
    console.log('DELETE /songs/1         - Delete song with ID 1');
    console.log('=================================\n');
    });