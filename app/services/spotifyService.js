const axios = require('axios');

exports.getRecentlyPlayed = async (accessToken) => {
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (response.status !== 200) {
        throw new Error(`Failed to fetch recently played tracks: ${response.statusText}`);
    }
    return response.data.items.map(item => ({
        track: item.track,
        played_at: item.played_at,
    }));   
};