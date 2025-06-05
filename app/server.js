const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const authStrava = reuire('./routes/authStrava');
const authSpotify = require('./routes/authSpotify');
const webhook = require('./routes/webhook');

const app = express();
app.use(bodyParser.json());

app.use('/strava', authStrava);
app.use('/spotify', authSpotify);
app.use('/webhook', webhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});