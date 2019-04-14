import * as tf from '@tensorflow/tfjs';

export class AI {
  private batchSize = 5;
  public model: tf.Sequential;
  protected actionHistory: number[][] = [];
  protected predictionHistory: tf.Tensor2D[] = [];
  protected stateHistory: tf.Tensor2D[] = [];

  constructor() {
    this.model = this.createModel();
  }
  
  predict(state: tf.Tensor2D) {
    // const state = stateRaw.transpose();
    const predictionRaw = this.model.predict(state)
    const prediction: tf.Tensor<tf.Rank.R2> = Array.isArray(predictionRaw) ? predictionRaw[0].reshape([1, 3]) : predictionRaw.reshape([1, 3]);
    console.log(prediction.arraySync()) 
    const action = tf.multinomial(prediction, 1).flatten().arraySync()
    this.actionHistory.push(action)
    this.predictionHistory.push(prediction)
    this.stateHistory.push(state)
    return action[0];
  }

  async trainModel(reward: number) {
    const predictions = this.predictionHistory;
    const states = this.stateHistory;
    const actions = this.actionHistory;

    const data: tf.Tensor2D[] = [];
    const labels: tf.Tensor2D[] = [];
    const length = predictions.length;
    for (let i = 0; this.batchSize <= length ? i < this.batchSize : i < length; i++) {
      const j = Math.floor(Math.random() * predictions.length)
      data.push(states[j]);
      let label: tf.Tensor2D;
      if (reward >= 0) {
        label = tf.oneHot(actions[j], 3).reshape([1,3])
        labels.push(label)
      }
      else {
        // If not pick fake label at random with reversed prob.
        const reversed: tf.Tensor<tf.Rank.R1> = tf.ones([3]).sub(predictions[j]);
        label = tf.oneHot(tf.multinomial(reversed, 1), 3).reshape([1, 3])
        labels.push(label)
      }
      await this.model.fit(states[j], label, {
        shuffle: true
      });
      actions.splice(j, 1);
      states.splice(j, 1);
      predictions.splice(j, 1);
    }

    this.actionHistory = []
    this.predictionHistory = [];
    this.stateHistory = [];
  }

  protected createModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 64,
      inputShape: [56],
      // batchInputShape: [1, 56],
      activation: 'relu'
    }))

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu'
    }))

    model.add(tf.layers.dense({
      units: 3,
      activation: 'softmax',
    }))

    const optimizer = tf.train.rmsprop(0.01, 0.99)

    model.compile({
      optimizer,
      loss: tf.losses.softmaxCrossEntropy,
      metrics: ['accuracy']
    })

    // model.add(tf.layers.conv2d({
    //   inputShape: [13, 4, 3],
    //   kernelSize: 5,
    //   filters: 8,
    //   strides: 1,
    //   activation: 'relu',
    //   kernelInitializer: 'varianceScaling'
    // }));


    return model;
  }
}