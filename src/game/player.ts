import { Card } from './deck';

export enum PlayerAction {
    Check,
    Call,
    Fold,
    Bet,
    Raise
}

export class Player {
    public hand: Card[] = [];
    public currentBet = 0;

    constructor(public stack: number) { }
    
    public decide(currentBet: number, pot: number) {
        return PlayerAction.Fold;
    }

    public bet(amount: number) {
        this.stack -= amount;
        this.currentBet += amount;
        return amount;
    }

    public resetCurrentBet() {
        this.currentBet = 0;
    }

    public returnCards() {
        this.hand = [];
    }

    public getCard(card: Card) {
        if (this.hand.length >= 2)
            throw new Error('Attempting to deal more than 2 cards!');
        this.hand.push(card);
    }
}