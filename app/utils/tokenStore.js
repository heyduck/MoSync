const db = require('./db');

function saveTokens(userId, tokens) {
  db.serialize(() => {
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        console.error('Error checking for existing user:', err);
        return;
      }

      const existing = row || {};

      const merged = {
        id: userId,
        stravaAthleteId: tokens.stravaAthleteId ?? existing.stravaAthleteId ?? null,
        stravaAccessToken: tokens.stravaAccessToken ?? existing.stravaAccessToken ?? null,
        stravaRefreshToken: tokens.stravaRefreshToken ?? existing.stravaRefreshToken ?? null,
        stravaAthleteName: tokens.stravaAthleteName ?? existing.stravaAthleteName ?? null,
        stravaAthleteProfile: tokens.stravaAthleteProfile ?? existing.stravaAthleteProfile ?? null,
        spotifyAccessToken: tokens.spotifyAccessToken ?? existing.spotifyAccessToken ?? null,
        spotifyRefreshToken: tokens.spotifyRefreshToken ?? existing.spotifyRefreshToken ?? null,
        spotifyExpiresIn: tokens.spotifyExpiresIn ?? existing.spotifyExpiresIn ?? null,
        spotifyUserId: tokens.spotifyUserId ?? existing.spotifyUserId ?? null,
        spotifyUserName: tokens.spotifyUserName ?? existing.spotifyUserName ?? null,
        spotifyUserProfile: tokens.spotifyUserProfile ?? existing.spotifyUserProfile ?? null,
      };

      db.run(`
        INSERT INTO users (
          id,
          stravaAthleteId,
          stravaAccessToken,
          stravaRefreshToken,
          stravaAthleteName,
          stravaAthleteProfile,
          spotifyAccessToken,
          spotifyRefreshToken,
          spotifyExpiresIn,
          spotifyUserId,
          spotifyUserName,
          spotifyUserProfile
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          stravaAthleteId = excluded.stravaAthleteId,
          stravaAccessToken = excluded.stravaAccessToken,
          stravaRefreshToken = excluded.stravaRefreshToken,
          stravaAthleteName = excluded.stravaAthleteName,
          stravaAthleteProfile = excluded.stravaAthleteProfile,
          spotifyAccessToken = excluded.spotifyAccessToken,
          spotifyRefreshToken = excluded.spotifyRefreshToken,
          spotifyExpiresIn = excluded.spotifyExpiresIn,
          spotifyUserId = excluded.spotifyUserId,
          spotifyUserName = excluded.spotifyUserName,
          spotifyUserProfile = excluded.spotifyUserProfile
      `, [
        merged.id,
        merged.stravaAthleteId,
        merged.stravaAccessToken,
        merged.stravaRefreshToken,
        merged.stravaAthleteName,
        merged.stravaAthleteProfile,
        merged.spotifyAccessToken,
        merged.spotifyRefreshToken,
        merged.spotifyExpiresIn,
        merged.spotifyUserId,
        merged.spotifyUserName,
        merged.spotifyUserProfile,
      ]);
    });
  });
}

function getTokens(userId, callback) {
  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      console.error('Error retrieving tokens from DB:', err);
      callback(null);
    } else {
      callback(row);
    }
  });
}

module.exports = {
  saveTokens,
  getTokens
};
