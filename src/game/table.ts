import { Player } from './player';
import { Deal } from './deal';
import { LogType } from './logger';

const MIN_STACK = 16

export class Table {
  playerQueue: Player[];
  deal: Deal;

  constructor(public readonly players: Player[], public log: (type: LogType, message: string) => void) {
    this.playerQueue = players.filter(p => p.stack >= MIN_STACK)
    const btn = Math.floor(Math.random() * this.playerQueue.length);
    for (let i = 0; i < btn; i++) {
      this.shiftPosition();
    }
    this.deal = new Deal(this.playerQueue, log);
  }

  prepareNextDeal() {
    this.playerQueue = this.playerQueue.filter(p => p.stack >= MIN_STACK);
    this.shiftPosition();
    this.deal = new Deal(this.playerQueue, this.log);
  }  

  protected shiftPosition() {
    const player = this.playerQueue.shift()
    if (!player)
      throw new Error('[TABLE_ERROR] Trying to shift position at an empty table!');
    this.playerQueue.push(player);
  }
}