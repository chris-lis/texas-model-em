import { TexasHoldemHand } from './game';
import { Player } from './player';

enum GameState {
  Initial,
  InProgress,
  Over,
}

export class TexasHoldemGame<Hand extends TexasHoldemHand> {
  public state: GameState;
  public table: Map<Player, number>;
  public activePlayers: Player[];
  
  constructor(
    players: Player[],
    public createHand: (players: Player[]) => Hand
  ) {
    this.state = GameState.Initial;
    this.table = new Map<Player, number>();
    this.activePlayers = players.filter(p => p.stack <= 0);

    const btn = Math.floor(Math.random() * players.length);

    // Shift dealer button to the randomly selected position (btn is always at the end of the list)
    for (let i = 0; i < players.length; i++) {
      this.table.set(players[i], i);
      if (btn >= i) {
        this.shiftPosition();
      }
    }
  }

  /** Shift the position of the dealer button by one */
  public shiftPosition() {
    const nextBtn = this.activePlayers.shift();
    if (!nextBtn) {
      throw new Error('[GAME_ERROR] There are no players in this game!');
    }
    this.activePlayers.push(nextBtn);
  }

  /** Play the next hand */
  public nextHand() {
    if (this.state === GameState.Over) {
      throw new Error('[GAME_ERROR] You cannot continue game when its over!');
    }

    this.state = GameState.InProgress;

    const hand = this.createHand(this.activePlayers);
  }
}
