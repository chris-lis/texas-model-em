import { Deck } from '../deck';
import { Player } from '../player';

export enum TexasHoldemStage {
    Preflop,
    Flop,
    Turn,
    River,
}

export interface TexasHoldemHand {
    pot: number;
    currentBet: number;
    deck: Deck;
    stage: TexasHoldemStage;
    players: Player[];
}

export abstract class TexasHoldemHandBase implements TexasHoldemHand {
    public pot = 0;
    public currentBet = 0;
    public deck = new Deck();
    public stage = TexasHoldemStage.Preflop;

    constructor(public players: Player[]) { }
}