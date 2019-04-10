import { Player } from './player';
import { Deal } from './deal';

export class Table {
  get activePlayers() { return this._players.filter(p => p.stack > 0) }
  constructor(protected _players: Player[]) {
    let btn = Math.floor(Math.random() * _players.length);
    for (let i = 0; i < btn; i++) {
      this.shiftPosition();
    }
  }

  shiftPosition() {
    const player = this._players.shift()
    if (!player)
      throw new Error('[TABLE_ERROR] Trying to shift position at an empty table!');
    this._players.push(player);
  }

  nextDeal() {
    const deal = new Deal(this.activePlayers)
    deal.play()
  }
}