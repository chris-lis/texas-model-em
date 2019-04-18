import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import './App.css';
import { Deck, Card, printCards } from './game/deck';
// import { Table } from './game/table';
import { AIPlayer, HumanPlayer, Player } from './game/player';
import { Logger, LogType } from './game/logger';
import { TotalPot, Action } from './game/pot';
import { PlayerDetails, PlayerStats } from './components/player-details';
import { Game } from './components/game';
import { Table } from './components/table';
import { callingMachine, randomDeicde, callRaiseMachine, raisingMachine } from './game/decide';
import { AI } from './game/ai';

// const player1 = new HumanPlayer(100, 0, 'Player1', (pot: TotalPot, board: Card[], player: Player) => {
//   window.prompt('Pick a move (0 - check/call, 1 - bet/raise, 2 - fold')
//   const amountInPot = pot.currentPot.players.get(player);
//   if (amountInPot === undefined)
//     throw new Error('[PLAYER_ERROR] Player doenst belong to the pot!')

//   const amount = pot.currentBet - amountInPot;
//   player.bet(amount);
//   return {
//     amount: amount,
//     action: amount === 0 ? Action.Check : Action.Call,
//     player,
//   }
// })




// const table = new Table(players)

const App: FunctionComponent = (props) => {
  // const logger = new Logger()
  
  // const [logs, setLogs] = useState(logger.logs);
  // const [playerStats, setPlayerStats] = useState(players.map((p) => ({
  //   id: p.id,
  //   stack: p.stack,
  //   hand: printCards(p.hand),
  //   active: table.activePlayers.includes(p)
  // } as PlayerStats)))

  // const [humanControlActive, setHumanControlActive] = useState(false);

  // const updatePlayerStats = (player: Player) => {
  //   const newStats = [...playerStats];
  //   let i = newStats.findIndex(p => p.id === player.id)
  //   newStats[i] = {
  //     id: player.id,
  //     stack: player.stack,
  //     hand: printCards(player.hand),
  //     active: table.activePlayers.includes(player)
  //   }
  //   setPlayerStats(newStats)
  // }

  // for (let player of players) {
  //   player.updateStats = () => updatePlayerStats(player)
  // }
  const [table, setTable] = useState(<div />);
  const refreshFlagRef = useRef(0);

  const [p1name, setP1name] = useState('Player 1')
  const [p2name, setP2name] = useState('Player 2')
  const [p1stack, setP1stack] = useState(200)
  const [p2stack, setP2stack] = useState(200)
  const [p1ai, setP1ai] = useState(true)
  const [p2ai, setP2ai] = useState(true)

  return (
    <div className="App">
      <div>
        <h1>Limit Texas Hold'em Model</h1>
        Choose name, initial stack & strategy for each player:<br />
        <b>Player 1</b><br/>
        Name: <input type="text" value={p1name} onChange={(e) => setP1name(e.target.value)} />{' '}
        Stack: <input type="text" value={p1stack.toString()} onChange={(e) => setP1stack(Number(e.target.value))} />{' '}
        AI player?: <input type="checkbox" checked={p1ai} onClick={() => setP1ai(s => !s)} />
        <br />
        <b>Player 2</b><br />
        Name: <input type="text" value={p2name} onChange={(e) => setP2name(e.target.value)} />{' '}
        Stack: <input type="text" value={p2stack.toString()} onChange={(e) => setP2stack(Number(e.target.value))} />{' '}
        AI player?: <input type="checkbox" checked={p2ai} onClick={() => setP2ai(s => !s)} />
        <br />
      </div>
      <button onClick={() => {
        refreshFlagRef.current = refreshFlagRef.current === 0 ? 1 : 0;
        const humanPlayer = new HumanPlayer(100, 0, 'HumanPlayer');
        const players = [
          p1ai ? new AIPlayer(p1stack, 0, p1name, new AI()) : new AIPlayer(p1stack, 0, p1name, new AI(), randomDeicde),
          p2ai ? new AIPlayer(p2stack, 0, p2name, new AI()) : new AIPlayer(p2stack, 0, p2name, new AI(), randomDeicde),
          // new AIPlayer(100, 0, 'Player3'),
        ]

          setTable(<Table key={refreshFlagRef.current} aiPlayers={players} showAiCards={true} />)
        }
      }>create a table</button>
      {table}
    </div>
  )
}

export default App;
