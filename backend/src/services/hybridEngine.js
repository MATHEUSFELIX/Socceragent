/*
 * Hybrid simulation engine for club-level matches. Combines a deterministic
 * core with random noise and narrative generation from the LLM. For V8 we
 * provide a simple stub that produces plausible xG values and random events.
 * The deterministic core uses the offensive/defensive strength derived from
 * the lineup size and instructions length. In production you could hook
 * this into your own analytics models and call the LLM for commentary.
 */

const llmClient = require('./llmClient');

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

async function simulateMatch({ lineup, instructions, coach, opponent }) {
  // Basic rating: number of attacking players influences xG
  const attackers = lineup.filter((p) => p.position && p.position.toLowerCase().includes('forward')).length;
  const defenders = lineup.filter((p) => p.position && p.position.toLowerCase().includes('defender')).length;
  const baseXgFor = randomBetween(0.8, 1.5) + attackers * 0.1 - defenders * 0.05;
  const baseXgAgainst = randomBetween(0.6, 1.4) + defenders * 0.05 - attackers * 0.05;
  const scoreFor = Math.max(0, Math.round(baseXgFor + Math.random() * 1.5 - 0.5));
  const scoreAgainst = Math.max(0, Math.round(baseXgAgainst + Math.random() * 1.5 - 0.5));

  // Generate random events minute by minute
  const events = [];
  const totalMinutes = 90;
  for (let minute = 5; minute <= totalMinutes; minute += Math.floor(randomBetween(5, 15))) {
    // decide which team
    const team = Math.random() < 0.5 ? 'us' : 'them';
    const eventType = Math.random() < 0.7 ? 'chance' : 'foul';
    events.push({ minute, team, type: eventType, description: `${eventType} by ${team} at minute ${minute}` });
  }

  // Ask LLM to narrate the summary
  const prompt = `Summarise a football match between our team (${coach}) and ${opponent}. ` +
    `The final score was ${scoreFor}-${scoreAgainst}. Include a short narrative.`;
  let narrative;
  try {
    narrative = await llmClient.generate(prompt);
  } catch (err) {
    narrative = 'A hard-fought match with a few key moments.';
  }

  return {
    lineup,
    instructions,
    opponent,
    coach,
    xg: { for: baseXgFor.toFixed(2), against: baseXgAgainst.toFixed(2) },
    score: { for: scoreFor, against: scoreAgainst },
    events,
    narrative,
  };
}

module.exports = { simulateMatch };