import React, { FunctionComponent } from 'react';
import { Player } from '../game/player';
import { PlayerDetails, PlayerStats } from './player-details';
import { printCards } from '../game/deck';

interface GameProps {
  players: PlayerStats[];
}

export const Game: FunctionComponent<GameProps> = (props) => {
  return (
    <div>
      <div>
        {props.players.map((p, i) => (
          <PlayerDetails key={i} {...p} />
        ))}
      </div>
      <div>

      </div>
    </div>
  )
}