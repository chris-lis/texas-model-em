import React, { FunctionComponent, useState, useRef } from 'react';
import { Player, HumanPlayer, AIPlayer } from '../game/player';
import { TotalPot, BettingRound, Bet, Action } from '../game/pot';
import { Deck, Card, printCards } from '../game/deck';
import { LogType } from './table';
import { Hand, findBestHand, HandRank, compareHands, HandResult } from '../game/hand';

interface DeapProps {
  deck: Deck;
  players: Player[];
  pot: TotalPot;
  log: (type: LogType, message: string) => void;
  updatePlayersStats: (pot?: TotalPot, showAllCards?: boolean) => void;
}

export const Deal: FunctionComponent<DeapProps> = (props) => {
  const [bettingQueue, setBettingQueue] = useState(props.pot.activePlayers);
  const [afterBettingQueue, setAfterBettingQueue] = useState([] as Player[])
  const [humanControlActive, setHumanControlActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(BettingRound.Preflop);
  const [board, setBoard] = useState([] as Card[])
  const [actingPlayer, setActingPlayer] = useState(bettingQueue[0])
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  const initialStacks = useRef(props.players.map((p) => 
    p.stack
  ));


  const getNextPlayer = (queue: Player[]) => {
    // const queue = [...bettingQueue]
    const player = queue.shift();
    if (!player)
      throw new Error('[DEAL_ERROR] Cannot get next player when queue is empty!')
    // setBettingQueue(queue);
    return player;
  }

  const prepareRound = (board: Card[], currentRound: BettingRound) => {
    let bettingQueue = props.pot.activePlayers.length > 1 ? props.pot.activePlayers : [];
    let afterBettingQueue: Player[] = [];
    if (currentRound === BettingRound.Preflop) {
      for (let player of props.pot.players) {
        player.returnCards();
      }
      let sb: Player, bb: Player;
      if (props.pot.activePlayers.length === 2) {
        bb = getNextPlayer(bettingQueue);
        sb = getNextPlayer(bettingQueue);
      }
      else {
        sb = getNextPlayer(bettingQueue);
        bb = getNextPlayer(bettingQueue);
      }
      props.pot.addBet(sb.smallBlind());
      props.pot.addBet(bb.bigBlind());
      bettingQueue = bettingQueue.concat([sb, bb]);
      for (let i = 0; i < 2; i++) {
        for (let player of props.pot.activePlayers) {
          player.recieveCard(props.deck.deal())
        }
      }
      props.updatePlayersStats(props.pot);
    }
    else if (currentRound === BettingRound.Flop) {
      props.pot.nextRound()
      props.deck.deal();
      const cards = [props.deck.deal(), props.deck.deal(), props.deck.deal()];
      board = board.concat(cards);
    }
    else if (currentRound !== BettingRound.Showdown) {
      props.pot.nextRound()
      props.deck.deal();
      board.push(props.deck.deal());
    }
    setBoard(board);
    startBetting(bettingQueue, afterBettingQueue, board, currentRound)
  }

  const startBetting = async (bettingQueue: Player[], afterBettingQueue: Player[], board: Card[], currentRound: BettingRound) => {
    if (currentRound === BettingRound.Showdown) {
      props.log(LogType.DealLog, 'Showdown!');
      const hands: { player: Player, hand: Hand }[] = []
      for (let player of props.pot.players) {
        const hand = await findBestHand(player.hand, board);
        props.log(LogType.DealLog, `${player.id} has ${HandRank[hand.rank]}: ${printCards(hand.cards)}`);
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
      props.pot.dividePot(playersRanked)
      finalize();
      return;
    }
    else {
      props.log(LogType.DealLog, `Starting next round of betting: ${BettingRound[currentRound]}`);
      nextTurn(bettingQueue, afterBettingQueue, board, currentRound);
    }
  }

   const finalize = async () => {
    for (let i = 0; i < props.players.length; i++) {
      let player = props.players[i]
      player.updateStrategies(props.pot);
      if (player instanceof AIPlayer) await player.ai.trainModel(player.stack - initialStacks.current[i])
    }
    props.updatePlayersStats();
  }

  const nextTurn = (bettingQueue: Player[], afterBettingQueue: Player[], board: Card[], currentRound: BettingRound) => {
    if (props.pot.players.length === 1) {
      const winner = props.pot.players[0];
      props.log(LogType.DealLog, `Deal has been folded out. ${winner.id} won!`);
      props.pot.dividePot([[winner]])
      finalize()
      return;
    }
    if (bettingQueue.length === 0) {
      prepareRound(board, currentRound + 1);
      return;
    }
    const actingPlayer = getNextPlayer(bettingQueue)
    if (actingPlayer instanceof HumanPlayer) {
      setCurrentRound(currentRound + 1)
      setActingPlayer(actingPlayer)
      setBettingQueue(bettingQueue)
      setAfterBettingQueue(afterBettingQueue)
      setBoard(board)
      setHumanControlActive(true);
      return;
    }
    else {
      addBetToPot(actingPlayer.decide(props.pot, board), bettingQueue, afterBettingQueue, board, currentRound)
      return;
    }
  }

  const addBetToPot = (bet: Bet, bettingQueue: Player[], afterBettingQueue: Player[], board: Card[], currentRound: BettingRound) => {
    let raise = false;
    if (bet.action === Action.AllIn) {

      const playerCurrentBet = props.pot.currentPot.players.get(bet.player);
      if (playerCurrentBet === undefined)
      throw new Error('[POT_ERROR] Player not in the pot went all in!');
      // For 2 players it works
      if (bet.amount + playerCurrentBet >= props.pot.currentBet) {
        raise = true;
      }
    }
    props.pot.addBet(bet);
    switch (bet.action) {
      case (Action.Bet):
      case (Action.Raise):
        bettingQueue = bettingQueue.concat(afterBettingQueue.filter(p => p !== bet.player && !bettingQueue.includes(p)))
        afterBettingQueue = [bet.player];
        break;
      case (Action.Call):
      case (Action.Check):
        afterBettingQueue.push(bet.player);
        break;
      case (Action.Fold, Action.AllIn):
        afterBettingQueue = afterBettingQueue.filter(p => p !== bet.player)
        bettingQueue = bettingQueue.filter(p => p !== bet.player)
        if (raise) {
          bettingQueue = bettingQueue.concat(afterBettingQueue.filter(p => p !== bet.player && !bettingQueue.includes(p)))
          afterBettingQueue = [];
        }
        break;
    }
    props.updatePlayersStats(props.pot);
    nextTurn(bettingQueue, afterBettingQueue, board, currentRound);
  }

  if (!started) {
    setStarted(true);
    if (props.pot.players.length > 1) {
      let players: string = '';
      for (let p of props.pot.players) {
        players += `${p.id}: ${p.stack}BB, `
      } 
      props.log(LogType.DealLog, `Starting a new deal with players: ${players}`)
      prepareRound([...board], currentRound);
    }
    else
      props.log(LogType.DealLog, 'Game finished.')
  }

  return (
    <div>
      <h1>Board: {printCards(board)}</h1>
      <button disabled={!humanControlActive} onClick={() => {
        setHumanControlActive(false)

        const amountInPot = props.pot.currentPot.players.get(actingPlayer);
        if (amountInPot === undefined)
          throw new Error('[PLAYER_ERROR] Player doenst belong to the pot!')

        const amount = props.pot.currentBet - amountInPot;
        actingPlayer.bet(amount);
        addBetToPot({
          amount: amount,
          action: amount === 0 ? Action.Check : Action.Call,
          player: actingPlayer,
        }, bettingQueue, afterBettingQueue, board, currentRound)
        
      }}>Check/Call</button><button disabled={!humanControlActive} onClick={() => {
        setHumanControlActive(false)
        const amountInPot = props.pot.currentPot.players.get(actingPlayer);
        if (amountInPot === undefined)
          throw new Error('[PLAYER_ERROR] Player doenst belong to the pot!')
        if (props.pot.raisesCount < 4) {
          const amount = props.pot.currentBet - amountInPot + (props.pot.currentRound < BettingRound.River ? 1 : 2);
          actingPlayer.bet(amount);
          addBetToPot({
            amount: amount,
            action: props.pot.raisesCount === 0 ? Action.Bet : Action.Raise,
            player: actingPlayer,
          }, bettingQueue, afterBettingQueue, board, currentRound)
        }
        else {
          
          const amount = props.pot.currentBet - amountInPot;
          actingPlayer.bet(amount);
          addBetToPot({
            amount: amount,
            action: amount === 0 ? Action.Check : Action.Call,
            player: actingPlayer,
          }, bettingQueue, afterBettingQueue, board, currentRound)
        }
      }}>Bet/Raise</button><button disabled={!humanControlActive} onClick={() => {
        setHumanControlActive(false)
        addBetToPot({
        amount: 0,
        action: Action.Fold,
        player: actingPlayer,
        }, bettingQueue, afterBettingQueue, board, currentRound)
      }
      }>Fold</button>
    </div>
  )
}