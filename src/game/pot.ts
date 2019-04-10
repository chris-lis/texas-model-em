import { Player } from './player';
import { Logger, LogType } from './logger';

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
  get players() { return this._players.map(p => p.player) }
  get activePlayers() { return this._players.filter(p => !p.allIn).map(p => p.player) }
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

  addBet(bet: Bet, logger?: Logger) {
    // TODO: validation 
    switch (bet.action) {
      case (Action.Check):
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} checks`)
        }
        break;
      case (Action.SmallBlind):
        // validation 
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} posted small blind`)
        }
      case (Action.Call):
        // validation
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} calls`)
        }
        this.increasePot(bet);
        break;
      case (Action.BigBlind):
        // validation 
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} posted big blind`)
        }
      case (Action.Bet):
        // validation 
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} bets`)
        }
      case (Action.Raise):
        // validation
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} raises`)
        }
        this.increasePot(bet, true);
        break;
      case (Action.Fold):
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} folds`)
        }
        this.removePlayer(bet.player)
        break;
      case (Action.AllIn):
        // validation
        if (logger) {
          logger.log(LogType.PotLog, `${bet.player.id} goes all-in`)
        }
        this.splitPot(bet);
        break;
    }
    this._betHistory.push(bet);
  }

  nextRound() {
    // TODO: validation 
    this._subpots.push(this.createPot(this.activePlayers, this.currentRound + 1))
  }

  dividePot(playersRanked: Player[][], logger?: Logger) {
    for(let pot of this._subpots) {
      // for (let i = 0; i < playersRanked.length; i++) {
      //   const player = playersRanked[i]
      //   if (pot.players.get(player)) {
      //     if (draw && draw.includes(i)) {
      //       const amount = pot.size / draw.length;
      //       player.winPot(amount)
      //       if (logger) {
      //         logger.log(LogType.PotLog, `It's a draw! ${player.id} wins ${amount}`)
      //       }
      //     }
      //     else {
      //       player.winPot(pot.size)
      //       if (logger) {
      //         logger.log(LogType.PotLog, `${player.id} wins ${pot.size}`)
      //       }
      //       break;
      //     }
      //   }
      // }
      for (let players of playersRanked) {
        players = players.filter(p => pot.players.get(p) !== undefined)
        if (logger && players.length > 1) {
          logger.log(LogType.PotLog, `It's a draw!`)
        }
        for (let player of players) {
          const amount = pot.size / players.length
          player.winPot(amount)
          if (logger) {
            logger.log(LogType.PotLog, `${player.id} wins ${amount}`)
          }
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




