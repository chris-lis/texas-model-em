import { Card } from './deck';
import { Action, Bet } from './betting';
import { TablePosition } from './deal';

export interface PlayerStrategy { }


export interface Player {
  hand: Card[];
  playerStrategies: Map<Player, PlayerStrategy>;
  stack: number;
  position: TablePosition;
  decide(...args: any[]): Bet;
  smallBlind(): Bet;
  bigBlind(): Bet;
  winPot(amount: number): void
  returnCards(): void;
  recieveCard(card: Card): void;
}

export class AIPlayer implements Player {
  public hand: Card[] = [];
  public playerStrategies = new Map<Player, PlayerStrategy>();

  constructor(public stack: number, public position: TablePosition) {}

  public decide(...args: any[]): Bet {
    return {
      amount: 0,
      action: Action.Fold,
      player: this as Player,
    }
  }

  protected bet(amount: number) {
    if (this.stack < 1) {
      throw new Error(`[PLAYER_ERROR] Player's stack is too small to participate in the game!`)
    }
    this.stack -= amount;
  }

  public smallBlind(): Bet {
    this.bet(0.5)
    return {
      amount: 0.5,
      action: Action.SmallBlind,
      player: this as Player,
    } as Bet
  }

  public bigBlind(): Bet {
    this.bet(1)
    return {
      amount: 1,
      action: Action.BigBlind,
      player: this as Player,
    }
  }

  public winPot(amount: number) {
    this.stack += amount;
  }

  public returnCards() {
    this.hand = [];
  }

  public recieveCard(card: Card) {
    if (this.hand.length >= 2) {
      throw new Error('Attempting to deal more than 2 cards!');
    }
    this.hand.push(card);
  }
}

export class HumanPlayer implements Player {
  public hand: Card[] = [];
  public playerStrategies = new Map<Player, PlayerStrategy>();

  constructor(public stack: number, public position: TablePosition) { }

  public decide(...args: any[]): Bet {
    return {
      amount: 0,
      action: Action.Fold,
      player: this as Player,
    }
  }

  protected bet(amount: number) {
    if (this.stack < 1) {
      throw new Error(`[PLAYER_ERROR] Player's stack is too small to participate in the game!`)
    }
    this.stack -= amount;
  }

  public smallBlind(): Bet {
    this.bet(0.5)
    return {
      amount: 0.5,
      action: Action.SmallBlind,
      player: this as Player,
    } as Bet
  }

  public bigBlind(): Bet {
    this.bet(1)
    return {
      amount: 1,
      action: Action.BigBlind,
      player: this as Player,
    }
  }

  public winPot(amount: number) {
    this.stack += amount;
  }

  public returnCards() {
    this.hand = [];
  }

  public recieveCard(card: Card) {
    if (this.hand.length >= 2) {
      throw new Error('Attempting to deal more than 2 cards!');
    }
    this.hand.push(card);
  }
}
