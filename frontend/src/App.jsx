import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Main application component. Displays a top bar with a toggle between
 * traditional club mode and World Cup mode. In World Cup mode the user
 * selects a tournament year and chooses whether to call up their own
 * squad or use the official Brazil squad. This is a simplified UI
 * intended for demonstration. In a real product you would break this
 * into multiple pages and add rich styling.
 */
export default function App() {
  const [mode, setMode] = useState('club');
  const [cups, setCups] = useState([]);
  const [selectedCup, setSelectedCup] = useState(null);
  const [officialSquad, setOfficialSquad] = useState([]);
  const [customSquad, setCustomSquad] = useState('');
  const [simResult, setSimResult] = useState(null);

  // Load list of available World Cups on mount
  useEffect(() => {
    async function loadCups() {
      try {
        const res = await axios.get('/api/worldcup/cups');
        setCups(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadCups();
  }, []);

  // When a cup is selected, load its official squad
  useEffect(() => {
    async function loadSquad() {
      if (!selectedCup) return;
      try {
        const res = await axios.get('/api/worldcup/squad', { params: { year: selectedCup } });
        setOfficialSquad(res.data.squad);
      } catch (err) {
        console.error(err);
      }
    }
    loadSquad();
  }, [selectedCup]);

  async function handleWorldCupSimulate() {
    try {
      const payload = {
        year: selectedCup,
        coach: 'Você',
        selectedPlayers: customSquad
          .split(/,|\n/)
          .map((p) => p.trim())
          .filter(Boolean),
      };
      const res = await axios.post('/api/worldcup/session', payload);
      setSimResult(res.data.result);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Tecnicos Agent V8</h1>
        <div>
          <button onClick={() => setMode('club')} disabled={mode === 'club'}>
            Club Mode
          </button>
          <button onClick={() => setMode('worldcup')} disabled={mode === 'worldcup'}>
            World Cup Mode
          </button>
        </div>
      </header>
      {mode === 'club' ? (
        <p>Club mode UI goes here (not implemented in this demo).</p>
      ) : (
        <div>
          <h2>World Cup Simulator</h2>
          <label>
            Choose a World Cup:
            <select value={selectedCup || ''} onChange={(e) => setSelectedCup(parseInt(e.target.value))}>
              <option value="" disabled>
                -- Select --
              </option>
              {cups.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          {selectedCup && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Official Squad ({selectedCup})</h3>
              <ul>
                {officialSquad.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <h3>Custom Selection</h3>
              <p>Enter comma or newline separated player names. Leave blank to use the official squad.</p>
              <textarea
                value={customSquad}
                onChange={(e) => setCustomSquad(e.target.value)}
                rows={5}
                cols={40}
              />
              <br />
              <button onClick={handleWorldCupSimulate}>Simulate World Cup</button>
            </div>
          )}
          {simResult && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Result</h3>
              <pre>{JSON.stringify(simResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}