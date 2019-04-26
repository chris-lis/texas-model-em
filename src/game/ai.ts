import * as tf from '@tensorflow/tfjs';

interface Snapshot {
  action: number;
  reward?: number;
  prediction: tf.Tensor2D;
  state: tf.Tensor2D;
}

export class AI {
  private batchSize = 5;
  private stdWin = 1;
  public model: tf.Sequential;
  protected history: Snapshot[] = []

  constructor() {
    this.model = this.createModel();
  }
  
  predict(state: tf.Tensor2D) {
    const predictionRaw = this.model.predict(state)
    const prediction: tf.Tensor<tf.Rank.R2> = Array.isArray(predictionRaw) ? predictionRaw[0].reshape([1, 3]) : predictionRaw.reshape([1, 3]);
    const action = tf.multinomial(prediction, 1).flatten().arraySync()[0]

    this.history.push({
      action,
      prediction,
      state
    })
    return action;
  }

  async trainModel(reward: number) {
    // Update action rewards
    for (let snapshot of this.history) {
      if (snapshot.reward === undefined)
        snapshot.reward = reward;
    }
    // if we have enough data, update the model
    if (this.history.length > this.batchSize) {
      const trainingData: tf.Tensor2D[] = [];
      const trainingLabels: tf.Tensor2D[] = [];

      for (let i = 0; i < this.batchSize; i++) {
        // Pick a histry entry at random
        const j = Math.floor(Math.random() * history.length)
      
        const snapshot = this.history.splice(j, 1)[0];

        // Something went wrong and reward wasn't set in history yet
        if (snapshot.reward === undefined)
          throw new Error('Reward not set in training example!');
        
        trainingData.push(snapshot.state);

        // To train model we create a fake label -> a label generated with probability distribution "punished" or "rewarded" as compared to original one
        const prediction = snapshot.prediction.flatten().arraySync();
        prediction[snapshot.action] *= (1 + snapshot.reward / this.stdWin);
        prediction[(snapshot.action + 1) % 3] *= (1 - snapshot.reward / (2 * this.stdWin))
        prediction[(snapshot.action + 2) % 3] *= (1 - snapshot.reward / (2 * this.stdWin))

        trainingLabels.push(tf.oneHot(tf.multinomial(prediction, 1), 3).reshape([1, 3]));
      }

      const dataTensor = tf.stack(trainingData.map(d => d.flatten()), 0);
      const labelTensor = tf.stack(trainingLabels.map(l => l.flatten()), 0);
      await this.model.fit(dataTensor, labelTensor, {
        batchSize: this.batchSize,
        shuffle: true,
      });
    }
  }

  protected createModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 32,
      inputShape: [59],
      batchInputShape: [this.batchSize, 59],
      activation: 'relu'
    }))

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }))

    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }))

    model.add(tf.layers.dense({
      units: 16,
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

    return model;
  }
}