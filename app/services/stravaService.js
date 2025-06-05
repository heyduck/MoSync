const axios = require('axios');

exports.getActivity = async (activityId, accessToken) => {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (response.status !== 200) {
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
    }
    return response.data;
};