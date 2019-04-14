import * as tf from '@tensorflow/tfjs';

export class AI {
  private batchSize = 3;
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
    console.log(action)
    return action[0];
  }

  async trainModel(reward: number) {
    const predictions = this.predictionHistory;
    const states = this.stateHistory;
    const actions = this.actionHistory;

    const length = this.batchSize <= predictions.length ? this.batchSize : predictions.length;
    if (length >= this.batchSize) {
      const data: tf.Tensor2D[] = [];
      const labels: tf.Tensor2D[] = [];

      for (let i = 0; i < length; i++) {
        const j = Math.floor(Math.random() * predictions.length)
        data.push(states[j]);
        let label: tf.Tensor2D;
        if (reward >= 0) {
          label = tf.oneHot(actions[j], 3).reshape([1,3])
          labels.push(label)
        }
        else {
          // If not pick fake label at random with reversed prob.
          // const reversed: tf.Tensor<tf.Rank.R1> = tf.ones([3]).sub(predictions[j]);
          const intermLabel = predictions[j].flatten().arraySync();
          intermLabel[actions[j][0]] /= Math.abs(reward)
          label = tf.oneHot(tf.multinomial(intermLabel, 1), 3).reshape([1, 3])
          labels.push(label)
        }

        actions.splice(j, 1);
        states.splice(j, 1);
        predictions.splice(j, 1);
      }
      const dataTensor = tf.stack(data.map(d => d.flatten()), 0);
      const labelTensor = tf.stack(labels.map(l => l.flatten()), 0);
      await this.model.fit(dataTensor, labelTensor, {
        batchSize: length,
        shuffle: true,
      });
      
    }
    this.actionHistory = []
    this.predictionHistory = [];
    this.stateHistory = [];
  }

  protected createModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 32,
      inputShape: [56],
      batchInputShape: [this.batchSize, 56],
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