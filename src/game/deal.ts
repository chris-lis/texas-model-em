import { Player } from './player';
import { Pot, BettingRound, Action, TotalPot } from './betting';
import { Card, Deck } from './deck';


export enum TablePosition {
  BB,
  BTN
}

export enum RoundResult {
  Continue,
  FoldedOut
}

export class Deal {
  public readonly pot: TotalPot;
  public readonly deck = new Deck();
  public readonly board: Card[] = [];
  get currentRound() { return this.pot.currentRound }
  get activePlayers() { return this.pot.activePlayers }

  constructor(players: Player[]) { 
    this.pot = new TotalPot(players);
  }

  public playRound() {
    // TODO: Validation 
    let bettingQueue = this.activePlayers;
    let afterBettingQueue: Player[] = [] 

    // Prepare round
    if (this.currentRound === BettingRound.Preflop) {
      let sb: Player | undefined, bb: Player | undefined;
      if (bettingQueue.length === 2) {
        bb = bettingQueue.shift();
        sb = bettingQueue.shift();
      }
      sb = bettingQueue.shift();
      bb = bettingQueue.shift();
      if (!sb || !bb)
        throw new Error('[TABLE_ERROR] SB and/or BB is undefined!')
      
      this.pot.addBet(sb.smallBlind());
      this.pot.addBet(bb.bigBlind());
      bettingQueue.push(sb);
      bettingQueue.push(bb);
      for (let i = 0; i < 2; i++) {
        for (let player of this.activePlayers) {
          player.getCard(this.deck.deal())
        }
      }
    }
    else {
      this.pot.nextRound();
      if (this.currentRound === BettingRound.Flop) {
        // Burn card (poker tradition)
        this.deck.deal();
        for (let i = 0; i < 3; i++) {
          this.board.push(this.deck.deal());
        }
      }
      else {
        // Burn card again
        this.deck.deal();
        this.board.push(this.deck.deal());
      }
    }

    while (bettingQueue.length > 0) {
      let actingPlayer = bettingQueue.shift();
      if (!actingPlayer)
        throw new Error('[TABLE_ERROR] Acting player doesnt exist!')
      
      // TODO: Figure out what goes into Player.decide() method 
      const bet = actingPlayer.decide(this.pot, this.board);
      this.pot.addBet(bet);
      switch (bet.action) {
        case (Action.Bet):
        case (Action.Raise):
          bettingQueue = bettingQueue.concat(afterBettingQueue);
          afterBettingQueue = [actingPlayer];
          break;
        case (Action.Call):
        case (Action.Check):
          afterBettingQueue.push(actingPlayer);
          break;
      }
    }
  }
}