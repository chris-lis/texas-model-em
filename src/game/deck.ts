export enum CardValue {
  Deuce = 2,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
  Ace,
}

export enum CardSuit {
  Clubs,
  Diamonds,
  Hearts,
  Spades,
}

export interface Card {
  value: CardValue;
  suit: CardSuit;
}

export class Deck {
  private deck: Card[];

  /** Create a shuffled deck */
  constructor() {
    const deck: Card[] = [];
    for (let value = 2; value < 15; value++) {
      for (let suit = 0; suit < 4; suit++) {
        if (!isNaN(Number(suit))) {
          continue;
        }
        deck.push({
          value,
          suit,
        });
      }
    }
    for (let i = 0; i < deck.length; i++) {
      const e = deck[i];
      const j = Math.floor(Math.random() * (deck.length - i)) + i;
      deck[i] = deck[j];
      deck[j] = e;
    }

    this.deck = deck;
  }

  public deal() {
    const card = this.deck.pop();
    if (!card) {
      throw new Error(
        '[DECK_ERROR] Attempting to deal a card from empty deck!'
      );
    }
    return card;
  }

  public print() {
    let deck = `Deck (in order):\n`;
    for (const card of this.deck) {
      deck += `   ${card.value} of ${card.suit}\n`;
    }
    return deck;
  }
}

