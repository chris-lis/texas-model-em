import { TexasHoldemHand } from './hand.type';
import { Player } from '../player';
import { Deck } from '../deck';

export const createLimitHoldemHand = (players: Player[]) => new LimitHoldemHand(players);

export class LimitHoldemHand implements TexasHoldemHand {
    public pot = 0;
    public currentBet = 0;
    public deck = new Deck();
    constructor(public players: Player[]) {}
}