import { Player } from './player';
import { Pot, BettingRound, Action, TotalPot } from './pot';
import { Card, Deck, printCard, printCards } from './deck';
import { Hand, findBestHand, compareHands, HandResult, HandRank } from './hand';
import { Logger, LogType } from './logger';


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
  
  constructor(players: Player[], public updateStats: () => void) { 
    this.pot = new TotalPot(players, (type: LogType, message: string) => {});
    for(let player of players) {
      player.returnCards();
    }
    
  }

  async play(logger?: Logger) {
    for (let i = 0; i < 4; i++) {
      let winners = await this.playRound(logger)
      if (winners)
        break;
    }
  }

  async playRound(logger?: Logger) {
    this.updateStats();
    if (logger) {
      let players = ''
      for (let player of this.activePlayers) {
        players += ` ${player.id}`
      }
      logger.log(LogType.DealLog, `Starting next round: ${BettingRound[this.currentRound]} with players:${players}`)
    }

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
      else {
        sb = bettingQueue.shift();
        bb = bettingQueue.shift();
      }
      if (!sb || !bb)
        throw new Error('[DEAL_ERROR] SB and/or BB is undefined!')
      this.pot.addBet(sb.smallBlind());
      sb.updateStats();
      this.pot.addBet(bb.bigBlind());
      bb.updateStats();
      bettingQueue.push(sb);
      bettingQueue.push(bb);
      for (let i = 0; i < 2; i++) {
        for (let player of this.activePlayers) {
          player.recieveCard(this.deck.deal())
          player.updateStats();
        }
      }
    }
    else {
      if (this.currentRound === BettingRound.Flop) {
        // Burn card (poker tradition)
        this.deck.deal();
        for (let i = 0; i < 3; i++) {
          const card = this.deck.deal()
          this.board.push(card);
          if (logger) {
            logger.log(LogType.DealLog, `${printCard(card)} has been dealt to the board.`)
          }
        }
      }
      else {
        // Burn card again
        this.deck.deal();
        const card = this.deck.deal()
        this.board.push(card);
        if (logger) {
          logger.log(LogType.DealLog, `${printCard(card)} has been dealt to the board.`)
        }
      }
    }

    while (bettingQueue.length > 0) {
      this.updateStats()
      if (this.players.length === 1) {
        if (logger) {
          logger.log(LogType.DealLog, 'Deal has been folded out.')
        }
        this.pot.dividePot([this.players]);
        this.updateStats()
        return this.players[0];
      }
      let actingPlayer = bettingQueue.shift();
      if (!actingPlayer)
        throw new Error('[DEAL_ERROR] Acting player doesnt exist!')
      
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

    this.updateStats()
    if (this.currentRound === BettingRound.River)
      return await this.showdown(logger)
    
    this.pot.nextRound();    
  }

  public async showdown(logger?: Logger) {
    // TODO: Allow 'mucking' 
    if (logger) {
      logger.log(LogType.DealLog, 'Show of hands!')
    }
    const hands: { player: Player, hand: Hand }[] = []
    for (let player of this.players) {
      const hand = await findBestHand(player.hand, this.board)
      if (logger) {
        logger.log(LogType.DealLog, `${player.id} has ${HandRank[hand.rank]}: ${printCards(hand.cards)}`);
      }
      hands.push({
        player: player,
        hand,
      })
    }
    hands.sort((h1, h2) => compareHands(h1.hand, h2.hand) === HandResult.Hand1IsBetter ? -1 : 1)

    const playersRanked: Player[][] = [];
    let tempPlayers: { player: Player, hand: Hand }[] = []
    for (let hand of hands) {
      if (tempPlayers.length === 0) {
        tempPlayers.push(hand);
      }
      else {
        if (compareHands(tempPlayers[0].hand, hand.hand) === HandResult.Draw)
          tempPlayers.push(hand)
        else {
          playersRanked.push(tempPlayers.map(t => t.player))
          tempPlayers = [hand]
        }
      }
    }
    playersRanked.push(tempPlayers.map(t => t.player))
    this.pot.dividePot(playersRanked)
    this.updateStats();
    return hands;
  }
}