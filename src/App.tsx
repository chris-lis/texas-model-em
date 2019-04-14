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

  const humanPlayer = new HumanPlayer(100, 0, 'HumanPlayer');
  const players = [
    new AIPlayer(50, 0, 'Player1', new AI()),
    new AIPlayer(50, 0, 'Player2', new AI(), callingMachine),
    // new AIPlayer(100, 0, 'Player3'),
  ]


  return (
    <div className="App">
      {/* <Game players={playerStats} />  */}
      
      <button onClick={() => {
        refreshFlagRef.current = refreshFlagRef.current === 0 ? 1 : 0;

        setTable(<Table key={refreshFlagRef.current} aiPlayers={players} showAiCards={true} />)
        }
      }>create a table</button>
      {table}
    </div>
  )
}

export default App;
