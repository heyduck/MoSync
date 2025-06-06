const express = require('express');
const { getTokens } = require('../utils/tokenStore');
const { getActivity } = require('../services/stravaService');
const { getRecentlyPlayed } = require('../services/spotifyService');
const { matchTracksToActivity } = require('../services/matchService');

const router = express.Router();

router.post('/', async (req, res) => {
    const event = req.body;
    console.log('Received webhook event:', event);

    if (req.query['hub.mode'] === 'subscribe') {
        return res.json({
            'hub.challenge': req.query['hub.challenge'],
        });
    }

    if (event.aspect_type === 'create' && event.object_type === 'activity') {
        const userId = event.owner_id;
        const tokens = getTokens(userId);

        if (!tokens) {
            console.error(`No tokens found for user ${userId}`);
            return res.status(400).send('No tokens found for user');
        }

        try {
            const activity = await getActivity(event.object_id, tokens.stravaAccessToken);
            const tracks = await getRecentlyPlayed(tokens.spotifyAccessToken);
            const matchedTracks = matchTracksToActivity(activity, tracks);
            console.log(`Matched tracks for activity ${event.object_id}:`, matchedTracks);
            matchedTracks.forEach(track => {
                console.log(`Track: ${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`);
            });
        } catch (error) {
            console.error('Error processing activity:', error);
            return res.status(500).send('Error processing activity');
        }

            res.status(200).send('Webhook event processed successfully');
        }
    });
    
    module.exports = router;