const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../data/users.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the users database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        stravaAthleteId TEXT,
        stravaAccessToken TEXT,
        stravaRefreshToken TEXT,
        stravaAthleteName TEXT,
        stravaAthleteProfile TEXT,
        spotifyAccessToken TEXT,
        spotifyRefreshToken TEXT,
        spotifyUserId TEXT,
        spotiftExpiresIn INTEGER,
        spotifyUserName TEXT,
        spotifyUserProfile TEXT    
    )`);
  }
});

module.exports = db;

