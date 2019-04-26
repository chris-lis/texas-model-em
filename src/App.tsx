import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import './App.css';
import { AIPlayer, HumanPlayer, Player } from './game/player';
import { callingMachine, random, callRaiseMachine, raisingMachine } from './game/decide';
import { AI } from './game/ai';
import { Logger, LogType } from './game/logger';
import { Game } from './components/game';
import { Table } from './game/table';
import { VictoryChart, VictoryLine } from 'victory';

const App: FunctionComponent = (props) => {
  const [p1name, setP1name] = useState('Player 1')
  const [p2name, setP2name] = useState('Player 2')
  const [p1stack, setP1stack] = useState(200)
  const [p2stack, setP2stack] = useState(200)
  const [p1ai, setP1ai] = useState(true)
  const [p2ai, setP2ai] = useState(true)

  const [logger, setLogger] = useState(new Logger());
  const [table, setTable] = useState(undefined as (undefined | Table))
  const [players, setPlayers] = useState([] as Player[])

  const createTable = () => {
    let logger = new Logger();
    const log = (type: LogType, message: string) => {
      logger.log(type, message);
      console.log(logger.logs);
      setLogger(new Logger(logger));
    }
    let players = [
      p1ai ? new AIPlayer(p1stack, p1name, new AI()) : new AIPlayer(p1stack, p1name, new AI(), random),
      p2ai ? new AIPlayer(p2stack, p2name, new AI()) : new AIPlayer(p2stack, p2name, new AI(), random),
    ]
    setLogger(logger);
    setPlayers(players)
    setTable(new Table(players, log));
  }

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
      <button onClick={createTable}>
        create new table
      </button>
      {table && <Game table={table} players={players} aiOnly={true} showAiCards={true} />}
      <div>
        <p>
          {logger.logs.reverse().map((log, i) => (
            <span key={i}><b>[{LogType[log.type]}]</b> {log.message}<br /></span>
          ))}
        </p>
      </div>
    </div>
  )
}

export default App;
