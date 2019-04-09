import { Card } from './deck';
import { Action, Bet } from './betting';
import { TablePosition } from './deal';

export interface PlayerStrategy {}

export class Player {
  public hand: Card[] = [];
  public currentBet = 0;
  public playerStrategies = new Map<Player, PlayerStrategy>();
  public allIn = false;

  constructor(public stack: number, public position: TablePosition) {}

  public decide(...args: any[]) {
    return {
      amount: 0,
      action: Action.Fold,
      player: this as Player,
    } as Bet
  }

  public blindBet(amount: number) {
    if (this.stack < 1) {
      throw new Error(`[PLAYER_ERROR] Player's stack is too small to participate in the game!`)
    }
    this.stack -= amount;
    this.currentBet += amount;
  }

  public smallBlind() {
    this.blindBet(0.5)
    return {
      amount: 0.5,
      action: Action.SmallBlind,
      player: this as Player,
    } as Bet
  }

  public bigBlind() {
    this.blindBet(1)
    return {
      amount: 1,
      action: Action.BigBlind,
      player: this as Player,
    } as Bet
  }

  public resetCurrentBet() {
    this.currentBet = 0;
  }

  public returnCards() {
    this.hand = [];
  }

  public getCard(card: Card) {
    if (this.hand.length >= 2) {
      throw new Error('Attempting to deal more than 2 cards!');
    }
    this.hand.push(card);
  }
}
