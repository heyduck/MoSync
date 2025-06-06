const express = require('express');
const axios = require('axios');
const {saveTokens} = require('../utils/tokenStore');

const router = express.Router();

router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

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

        // Step 3: Save the tokens and user information
        let userId;
        if (req.session.user && req.session.user.id) {
            userId = req.session.user.id; // Use existing user ID from session
        } else {
            userId = spotifyUser.id; // Use Spotify user ID as a fallback
        }
        
        // Save tokens and user information
        saveTokens(userId, {
            spotifyAccessToken: access_token,
            spotifyRefreshToken: refresh_token,
            spotifyExpiresIn: expires_in,
            spotifyUserId: spotifyUser.id,
            spotifyUserName: spotifyUser.display_name,
            spotifyUserProfile: spotifyUser.images?.[0]?.url || '', // Save the first profile image URL if available
        });

        // Step 4: Update session user object
        if (!req.session.user) {
            req.session.user = {};
        }

        req.session.user.spotifyConnected = true;
        req.session.user.spotifyUserId = spotifyUser.id;
        req.session.user.spotifyUserName = spotifyUser.display_name;
        req.session.user.spotifyUserProfile = spotifyUser.images?.[0]?.url || ''; // Save the first profile image URL if available

        console.log('Spotify OAuth tokens saved successfully:', {
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


