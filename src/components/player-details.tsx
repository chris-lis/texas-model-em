import React, { FunctionComponent } from 'react';

export interface PlayerStats {
  id: string;
  stack: number;
  dealer?: boolean;
  currentBet?: number;
  active?: boolean;
  folded?: boolean;
  allIn?: boolean;
  hand?: string;
}

export interface PlayerDetailsProps extends PlayerStats { }

export const PlayerDetails: FunctionComponent<PlayerDetailsProps> = (props) => {
  return (
    <div>
      <h2>{props.dealer && '[BTN]'} {props.id} - {props.stack}BB - {props.hand}</h2>
    </div>
  )
}