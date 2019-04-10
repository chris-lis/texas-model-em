import { Player } from './player';
import { Deal } from './deal';
import { Logger, LogType } from './logger';

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

  async nextDeal(logger?: Logger) {
    if (logger) {
      let players = ''
      for(let player of this.activePlayers) {
        players += ` ${player.id}`
      }
      logger.log(LogType.TableLog, `New deal. Players:${players}`);
      logger.log(LogType.TableLog, `BTN: ${this.activePlayers[0].id}`)
    }
    this.shiftPosition()
    const deal = new Deal(this.activePlayers);
    await deal.play(logger)
    if (logger)
      logger.log(LogType.TableLog, 'Deal finished. Cleaning up.')
  }
}