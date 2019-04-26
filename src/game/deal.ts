import { Deck, Card, printCards } from './deck';
import { TotalPot, BettingRound, Bet, Action } from './pot';
import { Player, AIPlayer, HumanPlayer } from './player';
import { LogType } from './logger';
import { Hand, findBestHand, HandRank, compareHands, HandResult } from './hand';

export enum DealStatus {
  Finished,
  NextRound,
  AwaitingHumanInput,
  BettingInProgress
}

export class Deal {
  deck: Deck = new Deck();
  pot: TotalPot;
  bettingQueue: Player[] = [];
  afterBettingQueue: Player[] = [];
  currentRound: BettingRound = BettingRound.Preflop;
  board: Card[] = [];
  initialStacks: number[];

  constructor(public players: Player[], public log: (type: LogType, message: string) => void) {
    this.pot = new TotalPot(players, log);
    this.initialStacks = players.map(p => p.stack);
  }

  async prepareBettingRound() {
    this.bettingQueue = this.pot.activePlayers.length > 1 ? this.pot.activePlayers : [];
    this.afterBettingQueue = []

    if (this.currentRound === BettingRound.Preflop) {
      for (let player of this.pot.players) {
        player.returnCards();
      }
      let sb: Player, bb: Player;
      if (this.pot.activePlayers.length === 2) {
        bb = this.getNextPlayer();
        sb = this.getNextPlayer();
      }
      else {
        sb = this.getNextPlayer();
        bb = this.getNextPlayer();
      }
      this.pot.addBet(sb.smallBlind());
      this.pot.addBet(bb.bigBlind());
      this.bettingQueue = this.bettingQueue.concat([sb, bb]);
      for (let i = 0; i < 2; i++) {
        for (let player of this.pot.activePlayers) {
          player.recieveCard(this.deck.deal())
        }
      }
      // Update logs?!
      // this.updatePlayersStats(this.pot);
    }
    else if (this.currentRound === BettingRound.Flop) {
      this.pot.nextRound()
      this.deck.deal();
      const cards = [this.deck.deal(), this.deck.deal(), this.deck.deal()];
      this.board = this.board.concat(cards);
    }
    else if (this.currentRound !== BettingRound.Showdown) {
      this.pot.nextRound()
      this.deck.deal();
      this.board.push(this.deck.deal());
    }
    else {
      this.log(LogType.DealLog, 'Showdown!');
      const hands: { player: Player, hand: Hand }[] = []
      for (let player of this.pot.players) {
        const hand = await findBestHand(player.hand, this.board);
        this.log(LogType.DealLog, `${player.id} has ${HandRank[hand.rank]}: ${printCards(hand.cards)}`);
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
      await this.finalize();
      return DealStatus.Finished;
    }
    return DealStatus.BettingInProgress;
  }

  async nextTurn(): Promise<[DealStatus, Player?]> {
    if (this.pot.players.length === 1) {
      const winner = this.pot.players[0];
      this.log(LogType.DealLog, `Deal has been folded out. ${winner.id} won!`);
      this.pot.dividePot([[winner]])
      await this.finalize()
      return [DealStatus.Finished];
    }
    if (this.bettingQueue.length === 0) {
      this.currentRound++;
      return [DealStatus.NextRound];
    }
    const actingPlayer = this.getNextPlayer();
    if (actingPlayer instanceof HumanPlayer) {
      return [DealStatus.AwaitingHumanInput, actingPlayer];
    }
    else {
      return [await this.addBet(actingPlayer.decide(this.pot, this.board))]
    }
  }

  async addBet(bet: Bet) {
    if (bet.action === Action.AllIn) {
      throw new Error('All-in Feature Not Implemented Yet!')
    }
    this.pot.addBet(bet);
    switch (bet.action) {
      case (Action.Bet):
      case (Action.Raise):
        this.bettingQueue = this.bettingQueue.concat(this.afterBettingQueue.filter(p => p !== bet.player && !this.bettingQueue.includes(p)))
        this.afterBettingQueue = [bet.player];
        break;
      case (Action.Call):
      case (Action.Check):
        this.afterBettingQueue.push(bet.player);
        break;
      case (Action.Fold):
        this.afterBettingQueue = this.afterBettingQueue.filter(p => p !== bet.player)
        this.bettingQueue = this.bettingQueue.filter(p => p !== bet.player)
        break;
    }
    // Player logs?
    return DealStatus.BettingInProgress;
  }

  protected async finalize() {
    for (let i = 0; i < this.players.length; i++) {
      let player = this.players[i]
      player.updateStrategies(this.pot);
      if (player instanceof AIPlayer) await player.ai.trainModel(player.stack - this.initialStacks[i])
    }
    // Logging player stats?
    // this.updatePlayersStats();
  }

  protected getNextPlayer = () => {
    const player = this.bettingQueue.shift();
    if (!player)
      throw new Error('[DEAL_ERROR] Cannot get next player when queue is empty!')
    return player;
  }
}