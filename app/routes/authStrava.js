const express = require('express');
const axios = require('axios');
const { saveTokens } = require('../utils/tokenStore');
const router = express.Router();

router.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Missing code parameter');
    }

    try {
        const response = await axios.post('https://www.strava.com/oauth/token', null, {
            params: {
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
            },
        });

        const { access_token, refresh_token, athlete } = response.data;
       
        saveTokens(athlete.id, { 
            stravaAccessToken: access_token,
            stravaRefreshToken: refresh_token,
            stravaAthleteId: athlete.id,
            stravaAthleteName: athlete.firstname + ' ' + athlete.lastname,
            stravaAthleteProfile: athlete.profile,
        });

        req.session.user = {
            id: athlete.id, // Store athlete ID in session if needed
            name: athlete.firstname + ' ' + athlete.lastname,
            profile: athlete.profile,
            stravaConnected: true,
        };

        console.log('Strava OAuth tokens saved successfully:', {
            athleteId: athlete.id,
            accessToken: access_token,
            refreshToken: refresh_token,
        });
        // Redirect to the success page with athlete ID 
        // res.send('Strava OAuth tokens saved successfully. You can now connect to Spotify.');
        res.redirect(`/`);
    } catch (error) {
        // Handle errors during the OAuth process
        console.error('Error during Strava OAuth callback:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
// This code defines an Express route for handling the Strava OAuth callback.
// It retrieves the authorization code from the query parameters, exchanges it for access and refresh tokens,
// and saves these tokens along with athlete information using a utility function.
// If successful, it redirects the user to a success page with the athlete ID.
// If an error occurs, it logs the error and responds with a 500 status code.
// The code uses the axios library to make HTTP requests and assumes that the necessary environment variables are set for Strava client ID and secret.
// The route is exported as a module for use in the main server file.


