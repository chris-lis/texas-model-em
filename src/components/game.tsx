import React, { FunctionComponent, useState } from 'react';
import { Player, HumanPlayer } from '../game/player';
import { Table } from '../game/table';
import { DealStatus } from '../game/deal';
import { Log, LogType } from '../game/logger';
import { PlayerDetails } from './player-details';
import { printCards } from '../game/deck';
import { VictoryChart, VictoryLine } from 'victory';

interface GameProps {
  players: Player[];
  showAiCards?: boolean;
  aiOnly?: boolean;
  table: Table;
  // logs: Log[];
}

export const Game: FunctionComponent<GameProps> = props => {
  // Add player stats state objects & logs 
  const [stackSizeP1, setStackSizeP1] = useState([{
    x: 0, y: props.players[0].stack
  }])
  const [stackSizeP2, setStackSizeP2] = useState([{
    x: 0, y: props.players[1].stack
  }])
  

  const play100deals = async () => {
    if (props.aiOnly) {
      for (let i = 0; i < 100; i++) {
        await startDeal();
      }
    }
  }

  const startDeal = async () => {
    props.table.prepareNextDeal();
    continueDeal(await props.table.deal.prepareBettingRound())
  }

  const continueDeal = async (dealStatus: DealStatus) => {
    let status = dealStatus;
    while (status !== DealStatus.Finished && status !== DealStatus.AwaitingHumanInput) {
      if (status === DealStatus.NextRound) {
        status = await props.table.deal.prepareBettingRound();
      }
      else {
        const res = await props.table.deal.nextTurn();
        status = res[0];
        if (res[1]) {
          // set active player to res[1];
        }
      }
    }
    if (status === DealStatus.AwaitingHumanInput) {
      // TODO: Set up for human player action 
    }
    else {
      setStackSizeP1(stackSizeP1.concat([{
        x: stackSizeP1[stackSizeP1.length - 1].x + 1, y: props.players[0].stack
      }]))
      setStackSizeP2(stackSizeP2.concat([{
        x: stackSizeP2[stackSizeP2.length - 1].x + 1, y: props.players[1].stack
      }]))
    }
  }

  return (
    <div>
      {props.players.map((p, i) => (
        <PlayerDetails id={p.id} stack={p.stack} hand={p instanceof HumanPlayer || props.showAiCards ? printCards(p.hand) : undefined} dealer={props.table.playerQueue.indexOf(p) === 0} />
      ))}
      <h1>Board: {printCards(props.table.deal.board)}</h1>
      <button onClick={startDeal}>
        play round
      </button>
      <button onClick={play100deals}>
        play 100 rounds
      </button>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <VictoryChart>
          <VictoryLine data={stackSizeP1} style={{ data: { stroke: "#c43a31" }, }} />
          <VictoryLine data={stackSizeP2} />
        </VictoryChart>
      </div>
    </div>
  )
}