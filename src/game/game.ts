import { Player } from './player';
import { Deck } from './deck';

export enum TexasHoldemStage {
    Preflop,
    Flop,
    Turn,
    River,
}

export interface TexasHoldem {
    pot: number;
    deck: Deck[];
    stage: TexasHoldemStage;
    players: Player[];
    nextHand(): void;
}

export class TexasHoldemHand {
    
}

export class TexasHoldemBase {
    public pot = 0;
    public currentBet = 0;
    public deck = new Deck();
    public stage = TexasHoldemStage.Preflop;

    constructor(public players: Player[]) { 
        // this.setupHand();
    }

    /** Move dealer button by one position */
    public shiftPosition() {
        const nextBtn = this.players.shift();
        if (!nextBtn)
            throw new Error('[GAME_ERROR] There are no players in this game!');
        this.players.push(nextBtn);
    }
    
    /** Prepare game state for next hand */
    public setupHand() {
        this.pot = 0;
        this.currentBet = 0;
        this.deck = new Deck();
        this.stage = TexasHoldemStage.Preflop;

        for (let i = 0; i < this.players.length; i++) {
            this.players[i].returnCards();
            if (i === 0)
                this.pot += this.players[i].bet(0.5);
            if (i === 1) {
                this.pot += this.players[i].bet(1);
                this.currentBet = 1;
            }
        }
    }

    public nextHand() {
        this.shiftPosition();
        this.setupHand();
    }

    // public checkForBustedPlaters() {
    //     for (let player of this.players) {
    //         if (player.stack <= 0) 
    //     }
    // }
}

export class HeadsUpLimitHoldem extends TexasHoldemBase {   
    constructor(btn: Player, bb: Player) {
        super([btn, bb]);
    }

    public setupHand() {

    }
    
    public nextHand() {
        // Move position at the table
        const nextBtn = this.players.shift();
        if (!nextBtn)
            throw new Error('There are no players in this game!');
        this.players.push(nextBtn);
        
        // Create new empty pot and return any remaining cards
        this.pot = 0;
        for (let i = this.players.length - 1; i >= 0; i--) {
            this.players[i].returnCards();
            this.pot += this.players[i].bet((i + 1) * .5);
        }
        

        // Place blinds
        this.pot += btn.bet(.5);
        this.pot += bb.bet(1);

        // Create new deck and deal hole cards
        this.deck = new Deck();
        for (let i = 0; i < 2; i++) {
            btn.getCard(this.deck.deal());
            bb.getCard(this.deck.deal());
        }


    }
}