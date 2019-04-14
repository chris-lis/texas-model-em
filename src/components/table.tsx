import React, { FunctionComponent, useState, useRef } from 'react';
import { Player, AIPlayer, HumanPlayer } from '../game/player';
import { PlayerStats, PlayerDetails } from './player-details';
import { printCards, Deck } from '../game/deck';
import { TotalPot, Action } from '../game/pot';
import { Deal } from './deal';

import {VictoryLine, VictoryBar, VictoryChart} from 'victory';

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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const dealCount = useRef(0);
  const [bettingStatsP1, setBettingStatsP1] = useState({
    checkCall: 0,
    betRaise: 0,
    fold: 0,
  });
  const [bettingStatsP2, setBettingStatsP2] = useState({
    checkCall: 0,
    betRaise: 0,
    fold: 0,
  });
  const [stackSizeP1, setStackSizeP1] = useState([{
    x: 0, y: props.aiPlayers[0].stack
  }])
  const [stackSizeP2, setStackSizeP2] = useState([{
    x: 0, y: props.aiPlayers[1].stack
  }])

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
    // await delay(300);
    const deal = <Deal players={players} key={refreshFlagRef.current} deck={new Deck()} pot={pot} log={log} updatePlayersStats={updatePlayersStats} />;
    setDeal(deal)
    // console.log('me')
    dealCount.current++;
    setStackSizeP1([...stackSizeP1, { x: dealCount.current, y: props.aiPlayers[0].stack}])
    setStackSizeP2([...stackSizeP2, { x: dealCount.current, y: props.aiPlayers[1].stack }])
    
    for (let bet of pot.betHistory) {
      switch (bet.action) {
        case (Action.Call):
        case (Action.Check):
          if (bet.player === props.aiPlayers[0])
            setBettingStatsP1({
              ...bettingStatsP1,
              checkCall: bettingStatsP1.checkCall + 1
            })
          else {
            setBettingStatsP2({
              ...bettingStatsP2,
              checkCall: bettingStatsP2.checkCall + 1
            })
          }
        case (Action.Bet):
        case (Action.Raise):
          if (bet.player === props.aiPlayers[0])
            setBettingStatsP1({
              ...bettingStatsP1,
              betRaise: bettingStatsP1.betRaise + 1
            })
          else {
            setBettingStatsP2({
              ...bettingStatsP2,
              betRaise: bettingStatsP2.betRaise + 1
            })
          }
        case (Action.Fold):
          if (bet.player === props.aiPlayers[0])
            setBettingStatsP1({
              ...bettingStatsP1,
              fold: bettingStatsP1.fold + 1
            })
          else {
            setBettingStatsP2({
              ...bettingStatsP2,
              fold: bettingStatsP2.fold + 1
            })
          }
      }
    }
    console.log(bettingStatsP1)
    
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
                // await setTimeout(() => {}, 1000)
              }
            }}>play 100 deals</button>
          }
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VictoryChart>
            <VictoryLine data={stackSizeP1} style={{ data: { stroke: "#c43a31" }, }} />
            <VictoryLine data={stackSizeP2} />
          </VictoryChart>
          {/* <VictoryChart>
            <VictoryBar data={[{ x: 1, y: bettingStatsP1.checkCall }, {x: 2, y: bettingStatsP1.betRaise }, {x: 3, y: bettingStatsP1.fold }]} style={{ data: { fill: "#c43a31" } }} />
            <VictoryBar data={[{ x: 1, y: bettingStatsP2.checkCall }, {x: 2, y: bettingStatsP2.betRaise }, {x: 3, y: bettingStatsP2.fold }]}/>
          </VictoryChart> */}
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