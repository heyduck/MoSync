const tokens = {};

exports.saveTokens = (userId, newTokens) => {
    tokens[userId] = {
        ...tokens[userId],
        ...newTokens,
    };
};

exports.getTokens = (userId) => tokens[userId] || {};