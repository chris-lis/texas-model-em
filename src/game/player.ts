import * as tf from '@tensorflow/tfjs';


import { Card } from './deck';
import { Action, Bet, TotalPot, BettingRound } from './pot';
import { TablePosition } from './deal';
import { string } from 'prop-types';
import { createModel } from './decide';
import { AI } from './ai';

export interface PlayerStrategy { 
  checkCallTotal: number;
  raiseBetTotal: number
  foldTotal: number;
  betsTotal: number;
}

export interface Player {
  id: string;
  hand: Card[];
  playerStrategies: Map<Player, Map<string, PlayerStrategy>>;
  stack: number;
  position: TablePosition;
  decide(pot: TotalPot, board: Card[]): Bet;
  smallBlind(): Bet;
  bigBlind(): Bet;
  bet(amount: number): void;
  winPot(amount: number): void
  returnCards(): void;
  recieveCard(card: Card): void;
  updateStats(): void;
  updateStrategies(pot: TotalPot): void;
}

export class AIPlayer implements Player {
  public hand: Card[] = [];
  public playerStrategies = new Map<Player, Map<string,PlayerStrategy>>();

  public updateStats = () => {}

  constructor(public stack: number, public position: TablePosition, public id: string, public ai: AI, public decisionFunction?: (...args: any) => number) { }
  
  updateStrategies(pot: TotalPot) {
    let betHistory = pot.betHistory
    let key = ''
    for (let bet of betHistory) {
      if (bet.action === Action.SmallBlind || bet.action === Action.BigBlind || bet.action === Action.AllIn)
        continue;
      let strategyMap = this.playerStrategies.get(bet.player)
      if (!strategyMap) {
        strategyMap = new Map<string, PlayerStrategy>();
        this.playerStrategies.set(bet.player, strategyMap);
      }
      let strategy = strategyMap.get(key);
      if (!strategy) {
        strategy = {
          checkCallTotal: 0,
          raiseBetTotal: 0,
          foldTotal: 0,
          betsTotal: 0
        }
        strategyMap.set(key, strategy)
      }
      strategy.betsTotal++;
      switch (bet.action) {
        case (Action.Check):
        case (Action.Call):
          strategy.checkCallTotal++;
          key += '0'
          break;
        case (Action.Bet):
        case (Action.Raise):
          strategy.raiseBetTotal++;
          key += '1'
          break;
        case (Action.Fold):
          strategy.foldTotal++;
          break;
      }
    }
  }

  public decide(pot: TotalPot, board: Card[]): Bet {    
    const amountInPot = pot.currentPot.players.get(this as Player);
    if (amountInPot === undefined)
      throw new Error('[PLAYER_ERROR] Player doenst belong to the pot!')
    // replace with nn
    const opponent = pot.players.find(p => p !== this as Player)
    if (!opponent) {
      throw new Error();
    }
    let decision: number;
    if (this.decisionFunction) {
      decision = this.decisionFunction(pot, [...board, ...this.hand], this.playerStrategies.get(opponent));
    }
    else {
      // Prepare features
      const opponentStrategy = this.playerStrategies.get(opponent)
      let strategyVec: number[] = []
      if (!opponentStrategy) {
        strategyVec = [1 / 3, 1 / 3, 1 / 3];
      }
      else {
        let key = '';
        for (let bet of pot.betHistory) {
          switch (bet.action) {
            case (Action.Bet):
            case (Action.Raise):
            key += '1';
            break;
            case (Action.Check):
            case (Action.Call):
            key += '0';
          }
        }
        
        const strategy = opponentStrategy.get(key);
        if (strategy && strategy.betsTotal > 10) {
          strategyVec = [strategy.checkCallTotal / strategy.betsTotal, strategy.raiseBetTotal / strategy.betsTotal, strategy.foldTotal / strategy.betsTotal];
        }
        else {
          strategyVec = [1 / 3, 1 / 3, 1 / 3];
        }
      }

      let features: number[] = Array(52).fill(0)

      for (let card of [...board, ...this.hand]) {
        features[card.suit * 13 + (card.value - 2)] = 1;
      }
      features = features.concat(strategyVec)
      features.push(pot.size);

      // console.log(features)
      decision = this.ai.predict(tf.tensor2d(features, [1,56], 'float32'))
    }
    if (decision === 0) {
      const amount = pot.currentBet - amountInPot;
      if (amount >= this.stack) {
        this.bet(this.stack);
        return {
          amount: this.stack,
          action: Action.AllIn,
          player: this as Player,
        }
      }
      this.bet(amount);
      return {
        amount: amount,
        action: amount === 0 ? Action.Check : Action.Call,
        player: this as Player,
      }
    }
    else if (decision === 1) {
      if (pot.raisesCount < 4 && pot.activePlayers.length > 1) {
        const amount = pot.currentBet - amountInPot + (pot.currentRound < BettingRound.River ? 1 : 2);
        if (amount >= this.stack) {
          this.bet(this.stack);
          return {
            amount: this.stack,
            action: Action.AllIn,
            player: this as Player,
          }
        }
        this.bet(amount);
        return {
          amount: amount,
          action: pot.raisesCount === 0 ? Action.Bet : Action.Raise,
          player: this as Player,
        }
      }
      else {
        const amount = pot.currentBet - amountInPot;
        if (amount >= this.stack) {
          this.bet(this.stack);
          return {
            amount: this.stack,
            action: Action.AllIn,
            player: this as Player,
          }
        }
        this.bet(amount);
        return {
          amount: amount,
          action: amount === 0 ? Action.Check : Action.Call,
          player: this as Player,
        }
      }
    }
    else {
      return {
        amount: 0,
        action: Action.Fold,
        player: this as Player
      }
    }
  }

  public bet(amount: number) {
    if (this.stack < 0) {
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
  public playerStrategies = new Map<Player, Map<string, PlayerStrategy>>();
  public updateStats = () => { }


  constructor(public stack: number, public position: TablePosition, public id: string) { }

  public decide(pot: TotalPot, board: Card[]): Bet {
    return {} as Bet
  }

  updateStrategies(pot: TotalPot) {
    let betHistory = pot.betHistory;
    let key = ''
    for (let bet of betHistory) {
      if (bet.action === Action.SmallBlind || bet.action === Action.BigBlind || bet.action === Action.AllIn)
        continue;
      let strategyMap = this.playerStrategies.get(bet.player)
      if (!strategyMap) {
        strategyMap = new Map<string, PlayerStrategy>();
        this.playerStrategies.set(bet.player, strategyMap);
      }
      let strategy = strategyMap.get(key);
      if (!strategy) {
        strategy = {
          checkCallTotal: 0,
          raiseBetTotal: 0,
          foldTotal: 0,
          betsTotal: 0
        }
        strategyMap.set(key, strategy)
      }
      strategy.betsTotal++;
      switch (bet.action) {
        case (Action.Check):
        case (Action.Call):
          strategy.checkCallTotal++;
          key += '0'
          break;
        case (Action.Bet):
        case (Action.Raise):
          strategy.raiseBetTotal++;
          key += '1'
          break;
        case (Action.Fold):
          strategy.foldTotal++;
          break;
      }
    }
  }

  public bet(amount: number) {
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
