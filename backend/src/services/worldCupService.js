/*
 * Service to simulate an entire World Cup tournament for the Brazil national
 * team. This is a simplified model intended for demonstration purposes. A
 * real implementation would include all participating teams, group stage
 * matches, knockout rounds and advanced analytics. Here we generate a
 * plausible tournament path based on random outcomes and optionally use
 * the LLM to narrate the journey.
 */

const { getRow } = require('../lib/sqliteDb');
const llmClient = require('./llmClient');

function randomOutcome() {
  const outcomes = ['win', 'draw', 'loss'];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

async function simulateTournament({ year, selectedPlayers, coach }) {
  // Retrieve official squad for the year
  const row = await getRow('SELECT squad FROM worldcups WHERE year = ?', [year]);
  if (!row) {
    throw new Error(`World Cup year ${year} not found`);
  }
  const officialSquad = JSON.parse(row.squad);
  const squad = selectedPlayers && selectedPlayers.length ? selectedPlayers : officialSquad;
  // Simulate group stage: 3 matches
  const groupResults = [];
  let wins = 0;
  for (let i = 0; i < 3; i++) {
    const outcome = randomOutcome();
    groupResults.push(outcome);
    if (outcome === 'win') wins++;
  }
  const advanced = wins >= 2;
  let finalStage;
  if (!advanced) {
    finalStage = 'group';
  } else {
    // simulate knockouts
    const stages = ['round_of_16', 'quarter_final', 'semi_final', 'final'];
    let eliminationStage = null;
    for (const stage of stages) {
      const outcome = randomOutcome();
      if (outcome === 'loss') {
        eliminationStage = stage;
        break;
      }
    }
    finalStage = eliminationStage || 'champion';
  }
  // Compose summary
  let summary;
  try {
    const prompt = `Brazil is playing the ${year} World Cup under coach ${coach}. ` +
      `The team reached the ${finalStage}. Write a short recap with key highlights.`;
    summary = await llmClient.generate(prompt);
  } catch (err) {
    summary = `Brazil reached the ${finalStage} in the ${year} World Cup.`;
  }
  return {
    year,
    coach,
    squad,
    groupResults,
    finalStage,
    summary,
  };
}

module.exports = {
  simulateTournament,
};