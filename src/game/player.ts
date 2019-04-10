import { Card } from './deck';
import { Action, Bet, TotalPot } from './pot';
import { TablePosition } from './deal';

export interface PlayerStrategy { }


export interface Player {
  id: string;
  hand: Card[];
  playerStrategies: Map<Player, PlayerStrategy>;
  stack: number;
  position: TablePosition;
  decide(pot: TotalPot, board: Card[]): Bet;
  smallBlind(): Bet;
  bigBlind(): Bet;
  winPot(amount: number): void
  returnCards(): void;
  recieveCard(card: Card): void;
}

export class AIPlayer implements Player {
  public hand: Card[] = [];
  public playerStrategies = new Map<Player, PlayerStrategy>();

  constructor(public stack: number, public position: TablePosition, public id: string) {}

  public decide(pot: TotalPot, board: Card[]): Bet {
    const amountInPot = pot.currentPot.players.get(this as Player);
    if (amountInPot === undefined) 
      throw new Error('[PLAYER_ERROR] Player doenst belong to the pot!')

    const amount = pot.currentBet - amountInPot;
    this.bet(amount);
    return {
      amount: amount,
      action: amount === 0 ? Action.Check : Action.Call,
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

  constructor(public stack: number, public position: TablePosition, public id: string, public decide: (...args: any[]) => Bet) { }

  // public decide(...args: any[]): Bet {
  //   return {
  //     amount: 0,
  //     action: Action.Fold,
  //     player: this as Player,
  //   }
  // }

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
