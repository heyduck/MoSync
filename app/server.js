const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authStrava = require('./routes/authStrava');
const authSpotify = require('./routes/authSpotify');
const webhook = require('./routes/webhook');
const { getTokens } = require('./utils/tokenStore');
const { matchTracksToActivities } = require('./services/matchService');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key in production
  resave: false,
  saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.get('/', async (req, res) => {
  console.log('--- GET / route hit ---');
  const user = req.session.user || null;
  console.log('Session user:', user);

  let activities = [];
  let recentTracks = [];
  let matchingTracks = [];

  if (user && user.stravaConnected) {
    console.log('User is connected to Strava.');
    try {
      const tokens = await new Promise((resolve, reject) => {
        getTokens(user.id, (tokens) => {
          if (!tokens) return reject('No Strava tokens found');
          resolve(tokens);
        });
      });

      console.log('Fetched Strava tokens:', tokens);

      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${tokens.stravaAccessToken}`,
        },
        params: { per_page: 5 },
      });

      activities = response.data.map(activity => {
        const startTime = new Date(activity.start_date).toISOString();
        const endTime = new Date(new Date(activity.start_date).getTime() + activity.elapsed_time * 1000).toISOString();
        return {
          name: activity.name,
          type: activity.type,
          elapsedTime: (activity.elapsed_time / 60).toFixed(1) + ' minutes',
          startTime,
          endTime,
        };
      });

      console.log('Fetched Strava activities.');
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
    }
  }

  if (user && user.spotifyConnected) {
    console.log('User is connected to Spotify.');
    try {
      const tokens = await new Promise((resolve, reject) => {
        getTokens(user.id, (tokens) => {
          if (!tokens) return reject('No Spotify tokens found');
          resolve(tokens);
        });
      });

      console.log('Fetched Spotify tokens:', tokens);

      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: {
          Authorization: `Bearer ${tokens.spotifyAccessToken}`,
        },
      });

      recentTracks = response.data.items.map(item => ({
        song: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(', '),
        playedAt: item.played_at, // ISO 8601
      }));

      console.log('Fetched recent Spotify tracks.');
    } catch (error) {
      console.error('Error fetching Spotify recently played tracks:', error);
    }
  }

  if (activities.length > 0 && recentTracks.length > 0) {
    console.log('Looking for matching tracks...');
    matchingTracks = matchTracksToActivities(activities, recentTracks);
  }

  console.log('Rendering homepage...');
  res.render('index', {
    user,
    activities,
    recentTracks,
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
