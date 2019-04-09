import { Player } from './player';

export enum Action {
  Call,
  Check,
  Fold,
  Bet,
  Raise,
  AllIn,
  SmallBlind,
  BigBlind,
}

export enum BettingRound {
  Preflop,
  Flop,
  Turn,
  River,
}

export interface Bet {
  amount: number;
  player: Player;
  action: Action;
}

export interface Pot {
  size: number;
  players: Map<Player, number>
  round: BettingRound;
  raisesCount: number;
  currentBet: number;
}

export class TotalPot {
  protected _size = 0;
  protected _subpots: Pot[];
  protected _players: {
    allIn?: boolean;
    player: Player
  }[];
  protected _betHistory: Bet[] = [];
  
  protected get _currentPot(): Pot { return this._subpots[this._subpots.length - 1] }
  get players() { return [...this._players] }
  get activePlayers() { return this.players.filter(p => !p.allIn).map(p => p.player) }
  get currentPot() { return {...this._currentPot} }
  get size() { return this._size };
  get currentBet() { return this._currentPot.currentBet }
  get raisesCount() { return this._currentPot.raisesCount }
  get currentRound() { return this._currentPot.round }
  get betHistory() { return [...this._betHistory] }

  constructor(players: Player[]) {
    this._players = players.map(player => ({ player }));
    this._subpots = [this.createPot(players, BettingRound.Preflop)];
  }

  public addBet(bet: Bet) {
    // TODO: validation
    switch (bet.action) {
      case (Action.Check):
        break;
      case (Action.SmallBlind):
        // validation 
      case (Action.Call):
        // validation
        this.increasePot(bet);
        break;
      case (Action.BigBlind):
        // validation 
      case (Action.Bet):
        // validation 
      case (Action.Raise):
        // validation
        this.increasePot(bet, true);
        break;
      case (Action.Fold):
        this.removePlayer(bet.player)
        break;
      case (Action.AllIn):
        // validation
        this.splitPot(bet);
        break;
    }
    this._betHistory.push(bet);
  }

  public nextRound() {
    // TODO: validation 
    this.createPot(this.activePlayers, this.currentRound + 1)
  }

  private increasePot(bet: Bet, raise?: boolean) {
    const currentBet = this._currentPot.players.get(bet.player);
    if (!currentBet) 
      throw new Error('[POT_ERROR] Trying to add a bet for player not in the pot!')
    this._size += bet.amount;
    this._currentPot.size += bet.amount;
    this._currentPot.players.set(bet.player, currentBet + bet.amount)
    if (raise) {
      this._currentPot.currentBet += currentBet + bet.amount - this._currentPot.currentBet;
      this._currentPot.raisesCount++;
    }
  }

  private removePlayer(player: Player) {
    for(let pot of this._subpots) {
      pot.players.delete(player);
    }
    this._players.splice(this._players.findIndex(p => p.player === player))
  }

  private splitPot(bet: Bet) {
    // TODO: Add all-in bets handling!!! 
    const player = this._players.find(p => p.player === bet.player);
    const playerCurrentBet = this._currentPot.players.get(bet.player);
    if (!player || !playerCurrentBet)
      throw new Error('[POT_ERROR] Player not in the pot went all in!');
    player.allIn = true;

  }

  private createPot(players: Player[], round: BettingRound) {
    const pot: Pot = {
      size: 0,
      players: new Map<Player, number>(players.map(player => ([
        player,
        0
      ]))),
      round,
      raisesCount: 0,
      currentBet: 0,
    }
    return pot;
  }
}


export const MAX_RAISES = 4
export const DOUBLE_BET_ROUND = BettingRound.Turn




