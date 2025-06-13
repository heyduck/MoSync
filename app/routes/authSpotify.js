const express = require('express');
const axios = require('axios');
const {saveTokens} = require('../utils/tokenStore');

const router = express.Router();

router.get('/callback', async (req, res) => {
    console.log('Received callback from Spotify:', req.query);
    const { code } = req.query;

    try {
        // Step 1: Exchange the authorization code for access and refresh tokens
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Step 2: Fetch user profile information from Spotify
        const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const spotifyUser = profileResponse.data;

        // Step 3: Determine app user ID (preferring Strava ID from session)
        const userId = req.session?.user?.id || spotifyUser.id; // Use Spotify user ID if Strava ID is not available
        
        // Step 4: Save tokens and user information to DB
        saveTokens(userId, {
            spotifyAccessToken: access_token,
            spotifyRefreshToken: refresh_token,
            spotifyExpiresIn: expires_in,
            spotifyUserId: spotifyUser.id,
            spotifyUserName: spotifyUser.display_name,
            spotifyUserProfile: spotifyUser.images?.[0]?.url || '', // Save the first profile image URL if available
        });

        // Step 5: Update session with Spotify user information
        if (!req.session.user) req.session.user = {};
        req.session.user.spotifyConnected = true;
        req.session.user.spotifyUserId = spotifyUser.id;
        req.session.user.spotifyUserName = spotifyUser.display_name;
        req.session.user.spotifyUserProfile = spotifyUser.images?.[0]?.url || ''; // Save the first profile image URL if available

        console.log('Spotify OAuth tokens saved successfully:', {
            appUserId: userId,
            spotifyUserId: spotifyUser.id,
            spotifyUserName: spotifyUser.display_name,
        });

        res.redirect('/'); // Redirect to the home page or a success page
    } catch (error) {
        console.error('Error during Spotify OAuth callback:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
// This code defines an Express route for handling the Spotify OAuth callback.
// It retrieves the authorization code and state from the query parameters, exchanges the code for access and refresh tokens,
// and saves these tokens using a utility function.
// If successful, it sends a success message to the client and logs the tokens.
// If an error occurs, it logs the error and responds with a 500 status code.
// The code uses the axios library to make HTTP requests and assumes that the necessary environment variables are set for Spotify client ID, secret, and redirect URI.
// The route is exported as a module for use in the main server file.
// The code is structured to handle the OAuth flow for Spotify, allowing users to authenticate and authorize access to their Spotify account.
// The tokens are saved in a token store utility, which can be used later to make API requests on behalf of the user.
// The route is designed to be part of a larger application that integrates with Spotify's API, allowing for features like fetching user playlists, tracks, and other data.


