import { Player } from './player';
import { Pot, BettingRound, Action, TotalPot } from './betting';
import { Card, Deck } from './deck';
import { Hand, findBestHand, compareHands, HandResult } from './hand';


export enum TablePosition {
  BB,
  BTN
}

export class Deal {
  public readonly pot: TotalPot;
  public readonly deck = new Deck();
  public readonly board: Card[] = [];
  get players() { return this.pot.players }
  get activePlayers() { return this.pot.activePlayers }
  get currentRound() { return this.pot.currentRound }
  
  constructor(players: Player[]) { 
    this.pot = new TotalPot(players);
    for(let player of players) {
      player.returnCards();
    }
    
  }

  async play() {
    for (let i = 0; i < 4; i++) {
      let winners = this.playRound()
      if (winners)
        break;
    }
  }

  async playRound() {
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
          player.recieveCard(this.deck.deal())
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
      if (this.players.length === 1) {
        this.pot.dividePot([this.players[0]]);
        return this.players[0];
      }
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

    if (this.currentRound === BettingRound.River)
      return await this.showdown()
  }

  public async showdown() {
    // TODO: Allow 'mucking' 
    const hands: { player: Player, hand: Hand, draw?: boolean }[] = []
    for(let player of this.players) {
      hands.push({
        player: player,
        hand: await findBestHand(player.hand, this.board)
      })
    }
    hands.sort((h1, h2) => {
      const res = compareHands(h1.hand, h1.hand);
      if (res === HandResult.Draw) {
        h1.draw = true;
        h2.draw = true;
        return 0;
      }
      else
       return res === HandResult.Hand1IsBetter ? -1 : 1
    })
    const draw: number[] = [];
    const playersRanked: Player[] = [];
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      if (hand.draw) {
        draw.push(i)
      }
      playersRanked.push(hand.player)
    }
    this.pot.dividePot(playersRanked, draw)
    return hands;
  }
}