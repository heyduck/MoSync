const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const authStrava = require('./routes/authStrava');
const authSpotify = require('./routes/authSpotify');
const webhook = require('./routes/webhook');

const path = require('path');

const app = express();
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from "public" directory
// app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.render('index', {
    stravaClientId: process.env.STRAVA_CLIENT_ID,
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    redirectUriSpotify: process.env.SPOTIFY_REDIRECT_URI,
  });
});

app.use('/strava', authStrava);
app.use('/spotify', authSpotify);
app.use('/webhook', webhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});