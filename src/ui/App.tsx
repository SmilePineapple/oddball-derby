import { useState } from 'react';
import { Menu, SettingsRows, Setup } from './Menu';
import { Draft, Lineup } from './Draft';
import { Heat } from './Heat';
import { Final, HeatResults } from './Results';
import { Rules } from './Rules';
import { Modal, Presence } from './bits';
import { useGame } from './useGame';

export function App() {
  const [route, setRoute] = useState<'menu' | 'setup' | 'game'>('menu');
  const api = useGame(route === 'game');
  const [rules, setRules] = useState(false);
  const [pause, setPause] = useState(false);
  const game = api.game;

  let screen = null;
  if (route === 'setup') {
    screen = <Setup api={api} onBack={() => setRoute('menu')} onStart={() => setRoute('game')} />;
  } else if (route === 'game' && game) {
    // Keep the board on screen until the last animation of a heat has played.
    const showHeat = game.heat && api.view && (game.phase === 'heat' || api.busy);
    if (showHeat) screen = <Heat api={api} game={game} onMenu={() => setPause(true)} onRules={() => setRules(true)} />;
    else if (game.phase === 'draft') screen = <Draft api={api} game={game} />;
    else if (game.phase === 'lineup') screen = <Lineup api={api} game={game} />;
    else if (game.phase === 'heatResults') screen = <HeatResults api={api} game={game} />;
    else if (game.phase === 'final') screen = <Final game={game} onDone={() => { api.endGame(); setRoute('menu'); }} />;
  }
  if (!screen) screen = <Menu api={api} onPlay={() => setRoute('game')} onSetup={() => setRoute('setup')} onRules={() => setRules(true)} />;

  return (
    <>
      <div className="backdrop"><div className="rays" /><div className="glow" /><div className="dots" /></div>
      {screen}
      {route === 'game' && game && game.phase !== 'heat' && game.phase !== 'final' && !api.busy && (
        <div className="fixed top-3 right-3 z-30 flex gap-2">
          <button className="btn small ghost" onClick={() => setRules(true)}>Rules</button>
          <button className="btn small ghost" onClick={() => setPause(true)}>Menu</button>
        </div>
      )}
      <Presence show={rules}><Rules onClose={() => setRules(false)} /></Presence>
      <Presence show={pause}>
        <Modal onClose={() => setPause(false)}>
          <h2 className="display text-4xl mb-4">Paused</h2>
          <SettingsRows api={api} />
          <p className="text-sm font-bold opacity-70 my-4">Your game is saved automatically. You can resume it from the main menu.</p>
          <div className="flex flex-col gap-2">
            <button className="btn green" onClick={() => setPause(false)}>Keep playing</button>
            <button className="btn ghost" onClick={() => { setPause(false); setRoute('menu'); }}>Save and go to menu</button>
          </div>
        </Modal>
      </Presence>
    </>
  );
}
