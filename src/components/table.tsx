import React, { FunctionComponent, useState, useRef } from 'react';
import { Player, AIPlayer, HumanPlayer } from '../game/player';
import { PlayerStats, PlayerDetails } from './player-details';
import { printCards, Deck } from '../game/deck';
import { TotalPot } from '../game/pot';
import { Deal } from './deal';

interface TableProps {
  aiPlayers: AIPlayer[];
  humanPlayer?: HumanPlayer;
  showAiCards?: boolean;
}

export enum LogType {
  TableLog,
  DealLog,
  PotLog,
}

export interface Log {
  type: LogType;
  message: string;
}

const shiftPosition = (players: Player[]) => {
  const player = players.shift()
  if (!player)
    throw new Error('[TABLE_ERROR] Trying to shift position at an empty table!');
  players.push(player);
}

export const Table: FunctionComponent<TableProps> = (props) => {
  const playersRef = useRef(props.humanPlayer ? [props.humanPlayer, ...props.aiPlayers] : [...props.aiPlayers])

  const playerQueueRef = useRef((() => {
    const playerQueue = [...playersRef.current]
    const btn = Math.floor(Math.random() * playersRef.current.length);
    for (let i = 0; i < btn; i++) {
      shiftPosition(playerQueue);
    }
    return playerQueue
  })())
  const refreshFlagRef = useRef(0);

  // State logic
  const [deal, setDeal] = useState(<div />)
  const [playersStats, setPlayersStats] = useState(playersRef.current.map(p=> ({
    id: p.id,
    stack: p.stack,
    hand: printCards(p.hand),
    dealer: playerQueueRef.current.indexOf(p) === 0
  } as PlayerStats)))
  const [logs, setLogs] = useState(Array<Log>())

  const moveButton = () => {
    const queue = [...playerQueueRef.current]
    const player = queue.shift()
    if (!player)
      throw new Error('[TABLE_ERROR] Trying to shift position at an empty table!');
    queue.push(player);
    playerQueueRef.current = queue;
    updatePlayersStats();
  }
  const newDeal = async () => {
    refreshFlagRef.current = refreshFlagRef.current === 0 ? 1 : 0;
    moveButton();
    // Add limit so it never goes to all-in
    const players = playerQueueRef.current.filter(p => p.stack >= 16);
    const pot = new TotalPot(players, log);
    const deal = <Deal players={players} key={refreshFlagRef.current} deck={new Deck()} pot={pot} log={log} updatePlayersStats={updatePlayersStats} />;
    setDeal(deal)
  }

  // Logging
  const updatePlayersStats = (pot?: TotalPot, showAllCards?: boolean) => setPlayersStats(playersRef.current.map(p => ({
    id: p.id,
    stack: p.stack,
    hand: p instanceof HumanPlayer || props.showAiCards || showAllCards ? printCards(p.hand) : p.hand.map(() => 'X'),
    dealer: playerQueueRef.current.indexOf(p) === 0,
    currentBet: pot && pot.currentPot.players.get(p),
  } as PlayerStats)))

  const logsRef = useRef(logs);

  const log = (type: LogType, message: string) => {
    logsRef.current.push({type, message})
    setLogs(logsRef.current);
  }
  return (
    <div>
      <div>
        <div>
          {playersStats.map((player, i) => (
            <PlayerDetails key={i} {...player}/>
          ))}
          <button disabled={playerQueueRef.current.filter(p => p.stack >= 1).length <= 1} onClick={() => newDeal()}>play next deal</button>
          {!props.humanPlayer && <button disabled={playerQueueRef.current.filter(p => p.stack >= 1).length <= 1} onClick={async () => {
              for (let i = 0; i < 100; i++) {
                await newDeal();
              }
            }}>play 100 deals</button>
          }
        </div>
        <div>
          {deal}
        </div>
      </div>
      <div>
        <p>
          {[...logs].reverse().map((log, i) => (
            <span key={i}><b>[{LogType[log.type]}]</b> {log.message}<br /></span>
          ))}
        </p>
      </div>
    </div> 
  )
}