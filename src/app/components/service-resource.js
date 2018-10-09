function makeYouTrackFetcher(dashboardApi, youTrack) {
  return async (url, params) =>
    await dashboardApi.fetch(youTrack.id, url, params);
}

export {
  makeYouTrackFetcher
};
