/*
 * Service to integrate with a real-time external sports data provider. In
 * production this module would poll or subscribe to a live data feed for
 * Brazilian matches and push updates to live sessions. For V8 this is a
 * stub returning random events to demonstrate how to hook into an external
 * provider. The caller can schedule periodic calls to fetchLatestEvent().
 */

function fetchLatestEvent() {
  // Generate a fake event at a random minute for demonstration
  const minute = Math.floor(Math.random() * 90) + 1;
  const types = ['goal', 'yellow_card', 'red_card', 'substitution'];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    minute,
    type,
    description: `Random ${type} at minute ${minute}`,
  };
}

module.exports = { fetchLatestEvent };