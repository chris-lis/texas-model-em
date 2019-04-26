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
}

export function printCard(card: Card) {
  let out = '';
  if (card.value < 11) {
    out += card.value;
  }
  else {
    switch (card.value) {
      case (CardValue.Jack):
        out += 'J';
        break;
      case (CardValue.Queen):
        out += 'Q';
        break;
      case (CardValue.King):
        out += 'K';
        break;
      case (CardValue.Ace):
        out += 'A';
        break;
    }
  }
  switch (card.suit) {
    case (CardSuit.Clubs):
      out += '♣'
      break;
    case (CardSuit.Diamonds):
      out += '♢'
      break;
    case (CardSuit.Hearts):
      out += '♡'
      break;
    case (CardSuit.Spades):
      out += '♠'
      break;
  }

  return out;
}

export function printCards(cards: Card[]) {
  let out = '';
  for(let i = 0; i < cards.length; i++) {
    out += (i === 0 ? '' : ' ') + printCard(cards[i]);
  }
  return out;
}
