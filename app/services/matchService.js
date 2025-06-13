function matchTracksToActivities(activities, tracks) {
  return tracks.reduce((matched, track) => {
    const trackTime = new Date(track.playedAt).getTime();

    for (const activity of activities) {
      const start = new Date(activity.startTime).getTime() - 60000; // minus 1 minute buffer
      const end = new Date(activity.endTime).getTime() + 60000; // plus 1 minute buffer

      if (trackTime >= start && trackTime <= end) {
        matched.push({
          ...track,
          playedAtDisplay: new Date(track.playedAt).toLocaleString(),
          activityName: activity.name,
          activityType: activity.type,
          activityDate: new Date(activity.startTime).toLocaleDateString(),
        });
        break; // stop at first match
      }
    }
    console.log('Matched Tracks: '+ matched);
    return matched;
  }, []);
}


module.exports = {
  matchTracksToActivities,
};
