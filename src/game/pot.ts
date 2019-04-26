import { Player } from './player';
import { LogType } from './logger';

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
  Showdown
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
  get players() { return this._players.map(p => p.player) }
  get activePlayers() { return this._players.filter(p => !p.allIn).map(p => p.player) }
  get currentPot() { return {...this._currentPot} }
  get size() { return this._size };
  get currentBet() { return this._currentPot.currentBet }
  get raisesCount() { return this._currentPot.raisesCount }
  get currentRound() { return this._currentPot.round }
  get betHistory() { return [...this._betHistory] }

  constructor(players: Player[], public log: (type: LogType, message: string) => void) {
    this._players = players.map(player => ({ player }));
    this._subpots = [this.createPot(players, BettingRound.Preflop)];
  }

  addBet(bet: Bet) {
    // TODO: validation 
    switch (bet.action) {
      case (Action.Check):
        this.log(LogType.PotLog, `${bet.player.id} checks`)
        break;
      case (Action.SmallBlind):
        // validation 
        this.log(LogType.PotLog, `${bet.player.id} posted small blind`)
        this.increasePot(bet);
        break;
      case (Action.Call):
        // validation
        this.log(LogType.PotLog, `${bet.player.id} calls`)
        this.increasePot(bet);
        break;
      case (Action.BigBlind):
        // validation 
        this.log(LogType.PotLog, `${bet.player.id} posted big blind`)
        this.increasePot(bet, true);
        break;
      case (Action.Bet):
        // validation 
        this.log(LogType.PotLog, `${bet.player.id} bets`)
        this.increasePot(bet, true);
        break;
      case (Action.Raise):
        // validation
        this.log(LogType.PotLog, `${bet.player.id} raises`)
        this.increasePot(bet, true);
        break;
      case (Action.Fold):
        this.log(LogType.PotLog, `${bet.player.id} folds`)
        this.removePlayer(bet.player)
        break;
      case (Action.AllIn):
        // validation
        this.log(LogType.PotLog, `${bet.player.id} goes all-in`)
        this.splitPot(bet);
        break;
    }
    this._betHistory.push(bet);
  }

  nextRound() {
    // TODO: validation 
    this._subpots.push(this.createPot(this.activePlayers, this.currentRound + 1))
  }

  dividePot(playersRanked: Player[][]) {
    for(let pot of this._subpots) {
      for (let players of playersRanked) {
        players = players.filter(p => pot.players.get(p) !== undefined)
        if (players.length > 1) {
          this.log(LogType.PotLog, `It's a draw!`);
        }
        for (let player of players) {
          const amount = pot.size / players.length
          player.winPot(amount)
          this.log(LogType.PotLog, `${player.id} wins ${amount}`)
        }
        if (players.length !== 0)
          break;
      }
    }
  }
  

  private increasePot(bet: Bet, raise?: boolean) {
    const currentBet = this._currentPot.players.get(bet.player);
    if (currentBet === undefined) 
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
    this._players.splice(this._players.findIndex(p => p.player === player), 1)
  }

  private splitPot(bet: Bet) {
    // TODO: Make this work. 
    // console.log(bet)
    const player = this._players.find(p => p.player === bet.player);
    // console.log(this._subpots)
    // console.log(player)
    const playerCurrentBet = this._currentPot.players.get(bet.player);
    if (!player || playerCurrentBet === undefined)
      throw new Error('[POT_ERROR] Player not in the pot went all in!');
    // For 2 players it works
    if (bet.amount + playerCurrentBet >= this.currentBet) {
      const amount = (this.currentBet - playerCurrentBet)
      const leftoverAmount = bet.amount - amount 
      // this.increasePot({ ...bet, amount });
      // this._subpots.push(this.createPot(this.activePlayers, this.currentRound))
      this.increasePot({ ...bet, amount: bet.amount }, true);
      player.allIn = true;
    }
    else {
      player.allIn = true;
      // For 2 players works, not for more
      this.increasePot(bet)
      const prevPot = this.currentPot;
      this._subpots.push(this.createPot(this.activePlayers, this.currentRound))
      for (let player of this.activePlayers) {
        const leftoverAmount = prevPot.players.get(player);
        if (!leftoverAmount) 
          throw new Error()
        if (leftoverAmount > bet.amount) {
          const betDiff = leftoverAmount - bet.amount
          prevPot.players.set(player, bet.amount)
          prevPot.size -= betDiff
          // works only for 2 ppl
          this.increasePot({
            amount: betDiff,
            action: Action.Raise,
            player
          }, true)
        }
      }
    }
  }

  private createPot(players: Player[], round: BettingRound) {
    const map = new Map<Player, number>()
    for(let p of players) {
      map.set(p, 0)
    }
    const pot: Pot = {
      size: 0,
      players: map,
      round,
      raisesCount: 0,
      currentBet: 0,
    }
    return pot;
  }
}


export const MAX_RAISES = 4
export const DOUBLE_BET_ROUND = BettingRound.Turn




