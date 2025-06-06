const tokens = {};

exports.saveTokens = (userId, newTokens) => {
    tokens[userId] = {
        ...tokens[userId],
        ...newTokens,
    };
};

exports.getTokens = (userId) => tokens[userId] || {};

exports.isConnected = (userId) => {
    const userTokens = tokens[userId] || {};
    return {
        strava: !!userTokens.stravaAccessToken,
        spotify: !!userTokens.spotifyAccessToken,
    };
};