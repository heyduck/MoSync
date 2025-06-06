const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const authStrava = require('./routes/authStrava');
const authSpotify = require('./routes/authSpotify');
const webhook = require('./routes/webhook');
const { getTokens } = require('./utils/tokenStore');
const axios = require('axios');
const { start } = require('repl');

const app = express();
app.use(bodyParser.json());

app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key when moving to production
  resave: false,
  saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.get('/', async (req, res) => {
  const user = req.session.user || null;
  let activities = [];
  let recentTracks = [];
  let matchingTracks = [];
  
  if (user && user.stravaConnected) {
    const tokens = getTokens(user.id);

    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${tokens.stravaAccessToken}`,
        },
        params: {
          per_page: 5, // Fetch the last 5 activities
        },
      });

      activities = response.data.map(activity => {
        const startTime = new Date(activity.start_date);
        const endTime = new Date(startTime.getTime() + activity.elapsed_time * 1000);
        return {
          name: activity.name,
          date: startTime.toLocaleDateString(),
          time: startTime.toLocaleTimeString(),
          type: activity.type,
          elapsedTime: (activity.elapsed_time / 60).toFixed(1) + ' minutes',
          startTime,
          endTime,
        };
      });
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
    }
  }

  if (user && user.spotifyConnected) {
    const tokens = getTokens(user.id);

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: {
          Authorization: `Bearer ${tokens.spotifyAccessToken}`,
        },
      });

      recentTracks = response.data.items.map(item => ({
        song: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(', '),
        playedAt: new Date(item.played_at),
        playedAtDisplay: new Date(item.played_at).toLocaleString(),
      }));
    } catch (error) {
      console.error('Error fetching Spotify recently played tracks:', error);
    }
  }

  if (activities.length > 0 && recentTracks.length > 0) {
    activities.forEach(activity => {
      recentTracks.forEach(track => {
        if (track.playedAt >= activity.startTime && track.playedAt <= activity.endTime) {
          matchingTracks.push({
            ...track,
            activityName: activity.name,
            activityType: activity.type,
            activityDate: activity.date,
          });
        }
      });
    });
  }

  res.render('index', {
    user,
    activities,
    matchingTracks,
    stravaClientId: process.env.STRAVA_CLIENT_ID,
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    redirectUriSpotify: process.env.SPOTIFY_REDIRECT_URI,
  });
});

app.use('/strava', authStrava);
app.use('/spotify', authSpotify);
app.use('/webhook', webhook);

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Error logging out');
  } else {
    console.log('User logged out successfully');
    res.redirect('/');
  }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});