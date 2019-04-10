import React, { FunctionComponent, useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Deck, Card, printCards } from './game/deck';
import { Table } from './game/table';
import { AIPlayer } from './game/player';
import { Logger, LogType } from './game/logger';

const player1 = new AIPlayer(100, 0, 'Player1')
const player2 = new AIPlayer(100, 0, 'Player2')

const table = new Table([player1, player2])

const App: FunctionComponent = (props) => {

  const logger = new Logger()

  const [logs, setLogs] = useState(logger.logs);
  const [player1stats, setPlayer1stats] = useState(player1)
  const [player2stats, setPlayer2stats] = useState(player2)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <button onClick={() => {
        table.nextDeal(logger).then(() => {
          setLogs(logger.logs);
          setPlayer1stats(player1);
          setPlayer2stats(player2);
        })
      }}>play a deal</button>
      <p>
        {logs.map((l, i) => (
          <b key={i}>
            [{LogType[l.type]}] {l.message}<br/>
          </b>))}
      </p>
      <div>
        {player1stats.id}
        {printCards(player1stats.hand)}
        {player1stats.stack}
      </div>
      <div>
        {player2.id}
        {printCards(player2stats.hand)}
        {player2stats.stack}
      </div>
    </div>
  )
}

export default App;
