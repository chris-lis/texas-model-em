import * as tf from '@tensorflow/tfjs';
import { TotalPot, Action, Bet } from './pot';
import { Card } from './deck';
import { PlayerStrategy } from './player';

// Naive approaches
export const callingMachine = (...args: any) => {
  return 0;
}

export const raisingMachine = (...args: any) => {
  return 1;
}

export const callRaiseMachine = (...args: any) => {
  return Math.floor(Math.random() * 2);
}

export const passiveNaive = (pot: TotalPot, board: Card[], ...args: any) => {
  if (pot.raisesCount < 2)
    return 0;
  else
    return 2;
}

export const randomDeicde = (...args: any) => {
  return Math.floor(Math.random() * 3);
}

// Deep learning approach
export const aiDecide = (pot: TotalPot, cards: Card[], model: tf.Sequential, opponentStrategy?: Map<string, PlayerStrategy>) => {
  let strategyVec: number[] = []
  if (!opponentStrategy) {
    strategyVec = [1/3, 1/3, 1/3];
  }
  else {
    let key = '';
    for(let bet of pot.betHistory) {
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

    const board: number[][][] = Array(4).fill(Array(13).fill([0,0,0]))
    // console.log(board);

    for (let card of cards) {
      board[card.suit][card.value - 2] = strategyVec.map(v => v * pot.size);
    }
    const boardTensor = tf.tensor3d(board, [13, 4, 3], 'float32')
}

export function createModel() {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    units: 64,
    inputShape: [13, 4, 3],
    activation: 'relu'
  }))

  model.add(tf.layers.dense({
    units: 3,
    activation: 'softmax',
  }))

  const optimizer = tf.train.rmsprop(0.001, 0.99)

  model.compile({
    optimizer,
    loss: tf.losses.softmaxCrossEntropy,
    metrics: ['accuracy']
  })


  // model.add(tf.layers.conv2d({
  //   inputShape: [13,4,3],
  //   kernelSize: 5,
  //   filters: 8,
  //   strides: 1,
  //   activation: 'relu',
  //   kernelInitializer: 'varianceScaling'
  // }));


  return model;
}

export function trainModel(model: tf.Sequential, pot: TotalPot, holeCards: Card[], board: Card[], outcome: number) {
  const decay = 0.99;
  const betHistory = pot.betHistory;
  const boards: tf.Tensor<tf.Rank.R3>[] = []

  for (let bet in betHistory) {

  }



  

  // model.fit(boards, y, {
  //   s
  // })
}

function prepareInput(betSequence: number[], cards: Card[], strategyVec: number[], potSize: number) {
  const features: number[] = Array(52).fill([0])

  for (let card of cards) {
    features[card.suit * 13 + (card.value - 2)] = 1;
  }
  features.concat(strategyVec)
  features.push(potSize);
  return tf.tensor1d(features)
}

