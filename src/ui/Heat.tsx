import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RACERS } from '../engine/racers';
import { CARDS } from '../engine/cards';
import { TRACKS } from '../engine/tracks';
import type { GameState } from '../engine/types';
import { tint } from './art';
import { Burst, Die, Modal, PlayerTag, Portrait, Presence, Stars } from './bits';
import { Mascot } from './Mascot';
import { Track } from './Track';
import type { GameApi } from './useGame';
import { sfx } from './sfx';

const REACTIONS = ['👏', '😂', '😱', '😡', '🎉'];

export function Heat({ api, game, onMenu, onRules }: { api: GameApi; game: GameState; onMenu: () => void; onRules: () => void }) {
  const hs = game.heat!;
  const core = hs.core;
  const view = api.view!;
  const [cardInfo, setCardInfo] = useState<string | null>(null);
  const [racerInfo, setRacerInfo] = useState<string | null>(null);
  const [go, setGo] = useState(false);
  const [shake, setShake] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; e: string; x: number }[]>([]);
  const tilt = api.settings.tilt !== false;
  const react = (e: string) => {
    const id = Date.now() + Math.random();
    setReactions((r) => [...r.slice(-14), { id, e, x: 8 + Math.random() * 84 }]);
    setTimeout(() => setReactions((r) => r.filter((v) => v.id !== id)), 2600);
  };
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [api.log.length]);

  const startRace = () => {
    api.dismissIntro();
    if (!api.settings.anim) return;
    setGo(true);
    setTimeout(() => setGo(false), 1100);
  };

  const active = view.activeId !== null ? core.entrants[view.activeId] : null;
  const owner = active ? game.players[active.ownerId] : null;
  const choice = !api.busy && !api.intro && !go ? hs.choice : null;
  const chooser = choice ? game.players[choice.playerId] : null;
  const live = game.phase === 'heat';
  const myRoll = !!choice && choice.kind === 'roll' && !chooser?.bot;
  const roll = () => {
    setShake(false);
    api.act({ type: 'answer', option: 0 });
  };
  // Space or Enter rolls the dice.
  useEffect(() => {
    if (!myRoll) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code !== 'Space' && ev.code !== 'Enter') return;
      ev.preventDefault();
      roll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRoll, hs.answers.length, core.turnCount]);
  const stars = (id: number) => game.players[id].stars + (live ? core.starsEarned[id] ?? 0 : 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* scoreboard */}
      <div className="scoreboard flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
        <div className="display text-2xl sm:text-3xl" style={{ color: 'var(--yellow)' }}>Heat {game.heatNumber}<span className="opacity-50">/4</span></div>
        <div className="display text-lg opacity-90">{TRACKS[core.trackId].name}</div>
        <div className="flex flex-wrap gap-2 ml-auto">
          {game.players.map((p) => (
            <motion.div key={p.id} animate={owner?.id === p.id ? { y: [0, -4, 0] } : { y: 0 }} transition={{ duration: 0.8, repeat: owner?.id === p.id ? Infinity : 0 }}>
              <PlayerTag p={p}><Stars n={stars(p.id)} /></PlayerTag>
            </motion.div>
          ))}
        </div>
        <button className="btn small teal" onClick={() => api.setSettings({ ...api.settings, tilt: !tilt })}>{tilt ? 'Flat view' : '3D view'}</button>
        <button className="btn small ghost" onClick={onRules}>Rules</button>
        <button className="btn small ghost" onClick={onMenu}>Menu</button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-3 sm:p-4">
        {/* board */}
        <div className="relative flex-1 min-h-[42vh] lg:min-h-0 flex items-center justify-center">
          <motion.div className="w-full h-full flex items-center justify-center" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }} >
            <Track core={core} view={view} players={game.players} tilt={tilt} previewFor={myRoll ? choice!.entrantId : null} />
          </motion.div>
          <AnimatePresence>
            {view.banner && (
              <motion.div key={view.banner} className="absolute inset-0 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Burst />
                <motion.div
                  initial={{ scale: 0.2, rotate: -14 }}
                  animate={{ scale: 1, rotate: -3 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                  className="card display text-3xl sm:text-5xl text-center px-7 py-4"
                  style={{ background: 'var(--yellow)', boxShadow: '8px 8px 0 var(--ink)' }}
                >
                  {view.banner}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {go && (
              <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" exit={{ opacity: 0 }}>
                <motion.div className="display inked" style={{ fontSize: 'min(30vw, 240px)', color: 'var(--green)' }} initial={{ scale: 0, rotate: -30 }} animate={{ scale: [0, 1.3, 1], rotate: [-30, 6, -4] }} exit={{ scale: 3, opacity: 0 }} transition={{ duration: 0.5 }}>
                  GO!
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute bottom-2 left-2 flex gap-1.5 z-20">
            {REACTIONS.map((e) => (
              <button key={e} aria-label={`React ${e}`} className="btn small ghost" style={{ padding: '2px 7px', fontSize: 20 }} onClick={() => react(e)}>{e}</button>
            ))}
          </div>
          <AnimatePresence>
            {reactions.map((r) => (
              <motion.div key={r.id} className="absolute pointer-events-none z-20" style={{ left: `${r.x}%`, bottom: 0, fontSize: 54 }} initial={{ y: 0, opacity: 0, scale: 0.3 }} animate={{ y: '-55vh', opacity: [0, 1, 1, 0], scale: 1.2, rotate: [0, -12, 12, 0] }} exit={{ opacity: 0 }} transition={{ duration: 2.4, ease: 'easeOut' }}>
                {r.e}
              </motion.div>
            ))}
          </AnimatePresence>
          {core.activeCards.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {core.activeCards.map((c) => (
                <motion.button key={c} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: -2 }} className="btn small pink" onClick={() => setCardInfo(c)}>
                  ✦ {CARDS[c].name}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* side panel */}
        <div className="lg:w-[380px] shrink-0 flex flex-col gap-3 min-h-0 lg:max-h-full max-h-[54vh]">
          <div className="card p-3 relative overflow-hidden">
            {owner && <div className="absolute top-0 inset-x-0 h-2.5" style={{ background: owner.colour, borderBottom: '3px solid var(--ink)' }} />}
            <AnimatePresence initial={false}>
              {active && owner ? (
                <motion.div key={active.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.16 }} className="flex gap-3 items-center pt-2">
                  <button className="cursor-pointer shrink-0 flex items-end justify-center" onClick={() => setRacerInfo(active.racerId)} style={{ width: 92, height: 92, borderRadius: 24, background: tint(active.racerId), border: '3px solid var(--ink)', overflow: 'hidden' }}>
                    <Mascot id={active.racerId} size={82} className="bob" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <PlayerTag p={owner} small>'s turn</PlayerTag>
                    <div className="display text-2xl leading-tight mt-0.5">{RACERS[active.racerId].name}</div>
                    <div className="text-xs font-bold opacity-80 leading-snug">{(RACERS[active.abilityId] ?? RACERS[active.racerId]).rulesText}</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="over" className="display text-2xl text-center py-4">Heat over!</motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-5 mt-3 rounded-2xl" style={{ minHeight: 104, background: 'repeating-linear-gradient(-45deg,#17b8a6 0 12px,#14a797 12px 24px)', border: '3px solid var(--ink)' }}>
              {view.dice ? (
                view.dice.map((d, i) => <Die key={i} value={d} rolling={view.rolling} />)
              ) : shake ? (
                <Die value={1} rolling />
              ) : (
                <div className="display text-white/80 text-lg text-center px-2">{myRoll ? 'Hold to shake, let go to roll' : 'Waiting for a roll…'}</div>
              )}
            </div>

            <div className="mt-3" style={{ minHeight: 78 }}>
              {choice && chooser?.bot && <div className="display text-xl text-center pt-5 opacity-70">{chooser.name} is thinking…</div>}
              <AnimatePresence initial={false}>
                {choice && chooser && !chooser.bot && (
                  <motion.div key={hs.answers.length + '-' + core.turnCount} initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
                    {choice.kind === 'roll' ? (
                      <button
                        className="btn big w-full pulse"
                        onPointerDown={() => { setShake(true); sfx.roll(); }}
                        onPointerLeave={() => setShake(false)}
                        onClick={roll}
                      >
                        {shake ? 'Let go!' : 'Roll!'}
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <PlayerTag p={chooser} small>{choice.kind === 'ability' ? ' decides' : ''}</PlayerTag>
                          <span className="text-xs font-black opacity-60">{RACERS[core.entrants[choice.entrantId].racerId].name}</span>
                        </div>
                        <div className="text-sm font-bold mb-2">{choice.prompt}</div>
                        <div className="flex flex-wrap gap-2">
                          {choice.options.map((o, i) => (
                            <button key={i} className={`btn flex-1 ${choice.options.length === 1 ? '' : i === 0 ? 'ghost' : 'pink'}`} onClick={() => api.act({ type: 'answer', option: i })}>{o}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* racers */}
          <div className="card flat p-2 grid grid-cols-2 gap-1">
            {core.order.map((id) => {
              const e = core.entrants[id];
              const p = game.players[e.ownerId];
              const gone = view.gone[id];
              return (
                <button key={id} onClick={() => setRacerInfo(e.racerId)} className="flex items-center gap-2 rounded-xl px-1.5 py-1 text-left cursor-pointer" style={{ opacity: gone === 'out' ? 0.4 : 1, background: view.activeId === id ? '#fff1b8' : undefined }}>
                  <Portrait id={e.racerId} size={34} ring={p.colour} />
                  <div className="min-w-0 leading-tight pl-1">
                    <div className="text-xs font-black truncate">{RACERS[e.racerId].name}</div>
                    <div className="text-[11px] font-bold opacity-70">
                      {gone === 'finished' ? 'Finished!' : gone === 'out' ? 'Knocked out' : `Space ${view.spaces[id]}`}{e.dazed && !gone ? ' · dazed' : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* commentary */}
          <div ref={logRef} className="card flat scroll p-3 flex-1 min-h-[90px] overflow-y-auto text-sm font-bold space-y-1">
            {api.log.slice(-80).map((line, i, arr) =>
              line.startsWith('—') ? (
                <div key={api.log.length - arr.length + i} className="pt-2"><span className="chip" style={{ background: 'var(--ink)', color: '#fff' }}>{line.replace(/—/g, '').trim()}</span></div>
              ) : (
                <motion.div key={api.log.length - arr.length + i} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: i === arr.length - 1 ? 1 : 0.7 }} style={i === arr.length - 1 ? { color: 'var(--red)' } : undefined}>
                  {line}
                </motion.div>
              ),
            )}
            {api.log.length === 0 && <div className="opacity-50">The race is about to begin…</div>}
          </div>
        </div>
      </div>

      {/* event card reveal */}
      <AnimatePresence>
        {view.cardReveal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center p-6 overflow-hidden" style={{ background: 'rgba(42,31,61,.8)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute spin-slow" style={{ width: '200vmax', height: '200vmax', background: 'repeating-conic-gradient(rgba(255,200,61,.22) 0 10deg, transparent 10deg 20deg)', animationDuration: '30s' }} />
            <motion.div
              initial={{ rotateY: 540, scale: 0.2, y: 300 }}
              animate={{ rotateY: 0, scale: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: -200, rotate: 20 }}
              transition={{ type: 'spring', stiffness: 110, damping: 14 }}
              className="relative w-72 sm:w-80 aspect-[5/7] p-3"
              style={{ background: '#fff', border: '4px solid var(--ink)', borderRadius: 28, boxShadow: '10px 10px 0 var(--ink)' }}
            >
              <div className="w-full h-full rounded-[18px] p-5 flex flex-col items-center justify-center text-center" style={{ background: 'var(--pink)', border: '3px solid var(--ink)' }}>
                <div className="chip" style={{ background: 'var(--ink)', color: '#fff' }}>EVENT CARD</div>
                <div className="display inked text-8xl my-3" style={{ color: 'var(--yellow)' }}>?!</div>
                <div className="display text-4xl mb-3">{CARDS[view.cardReveal].name}</div>
                <div className="text-lg font-black leading-snug">{CARDS[view.cardReveal].text}</div>
                <div className="chip mt-4" style={{ background: 'var(--yellow)' }}>{CARDS[view.cardReveal].lasting ? 'Lasts for the heat' : 'Happens now'}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Presence show={api.intro}>
        <Modal>
          <div className="text-center">
            <div className="chip" style={{ background: 'var(--yellow)' }}>Heat {game.heatNumber} of 4</div>
            <h2 className="display inked text-5xl mt-2 mb-5" style={{ color: 'var(--red)' }}>{TRACKS[core.trackId].name}</h2>
            <div className="space-y-3 mb-5">
              {core.order.map((id, i) => {
                const e = core.entrants[id];
                const p = game.players[e.ownerId];
                return (
                  <motion.div key={id} initial={{ x: i % 2 ? 300 : -300, opacity: 0, rotate: i % 2 ? 10 : -10 }} animate={{ x: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.25 + 0.2 * i, type: 'spring', stiffness: 200, damping: 16 }} className="card flat p-2 flex items-center gap-3 text-left">
                    <Portrait id={e.racerId} size={58} ring={p.colour} lively />
                    <div className="min-w-0 pl-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="display text-xl leading-tight">{RACERS[e.racerId].name}</span><PlayerTag p={p} small /></div>
                      <div className="text-xs font-bold opacity-75 leading-snug">{RACERS[e.racerId].rulesText}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <button className="btn big green w-full pulse" onClick={startRace}>Start the race!</button>
          </div>
        </Modal>
      </Presence>

      <Presence show={!!cardInfo}>
        <Modal onClose={() => setCardInfo(null)}>
          {cardInfo && (<><div className="chip" style={{ background: 'var(--pink)' }}>Event card in play</div><h2 className="display text-4xl my-2">{CARDS[cardInfo].name}</h2><p className="text-lg font-bold">{CARDS[cardInfo].text}</p></>)}
          <button className="btn mt-4 w-full" onClick={() => setCardInfo(null)}>OK</button>
        </Modal>
      </Presence>
      <Presence show={!!racerInfo}>
        <Modal onClose={() => setRacerInfo(null)}>
          {racerInfo && (
            <div className="flex gap-4 items-center">
              <div className="shrink-0 flex items-end justify-center" style={{ width: 130, height: 130, borderRadius: 30, background: tint(racerInfo), border: '4px solid var(--ink)', overflow: 'hidden' }}>
                <Mascot id={racerInfo} size={118} className="bob" />
              </div>
              <div>
                <h2 className="display text-4xl leading-tight">{RACERS[racerInfo].name}</h2>
                <div className="italic font-bold opacity-60 mb-2">{RACERS[racerInfo].blurb}</div>
                <p className="text-lg font-bold leading-snug">{RACERS[racerInfo].rulesText}</p>
                <div className="flex flex-wrap gap-1 mt-2"><span className="chip">{RACERS[racerInfo].trigger}</span><span className="chip">{RACERS[racerInfo].optional ? 'Your choice' : 'Automatic'}</span></div>
              </div>
            </div>
          )}
          <button className="btn mt-4 w-full" onClick={() => setRacerInfo(null)}>OK</button>
        </Modal>
      </Presence>
    </div>
  );
}
