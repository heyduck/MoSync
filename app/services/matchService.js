exports.matchTracksToActivity = (activity, tracks) => {
    const start = new Date(activity.start_date_local);
    const end = new Date(start.getTime() + activity.elapsed_time * 1000);
    return tracks.filter(track => {
        const playedAt = new Date(track.played_at);
        return playedAt >= start && playedAt <= end;
    }).map(track => ({
        name: track.track.name,
        artists: track.track.artists,
        played_at: track.played_at,
    }));
};