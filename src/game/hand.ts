import { Card, CardSuit } from './deck';

export enum HandRank {
  HighCard,
  Pair,
  TwoPairs,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
}

export interface Hand {
  rank: HandRank;
  cards: Card[];
}

export enum HandResult {
  Hand1IsBetter,
  Hand2IsBetter,
  Draw,
}

/** Comapre hand2 to hand1, return Win if hand1 is better, Lose if hand 2 is better, and Draw if their value is the same */
export function compareHands(hand1: Hand, hand2: Hand) {
  if (hand1.rank > hand2.rank) {
    return HandResult.Hand1IsBetter;
  }
  if (hand1.rank < hand2.rank) {
    return HandResult.Hand2IsBetter;
  }
  for (let i = 0; i < 5; i++) {
    if (hand1.cards[i].value > hand2.cards[i].value) {
      return HandResult.Hand1IsBetter;
    }
    if (hand1.cards[i].value < hand2.cards[i].value) {
      return HandResult.Hand2IsBetter;
    }
  }
  return HandResult.Draw;
}

export async function findBestHand(
  holeCards: Card[],
  board: Card[]
): Promise<Hand> {
  const cards = holeCards.concat(board);

  // Check for flush & repeats
  const flushPromise = checkForFlush(cards);
  const repeatsPromise = checkForRepeats(cards);

  // Check for straight
  let straight: Card[] | undefined;
  let flush = await flushPromise;
  // If you have a flush, check for straight flush
  if (flush) {
    straight = await checkForStraight(flush);
    if (straight) {
      return { rank: HandRank.StraightFlush, cards: straight.reverse().slice(0, 5) };
    }

    flush = flush.reverse();
  } else {
    straight = await checkForStraight(cards);
  }

  const repeats = await repeatsPromise;

  // Check for four of a kind
  const maxRep = repeats.shift();
  if (maxRep && maxRep.length === 4) {
    cards.sort((a, b) => (a.value > b.value ? -1 : 1));
    for (const card of cards) {
      if (card.value !== maxRep[0].value) {
        return { rank: HandRank.FourOfAKind, cards: maxRep.concat([card]) };
      }
    }
  }
  // Check for full house
  else if (maxRep && maxRep.length === 3) {
    const secRep = repeats.shift();
    if (secRep) {
      return {
        rank: HandRank.FullHouse,
        cards: maxRep.concat(secRep.slice(0, 2)),
      };
    }
    // Check if three of a kind is best
    if (!flush && !straight) {
      let count = 0;
      const res = maxRep;
      cards.sort((a, b) => (a.value > b.value ? -1 : 1));
      for (const card of cards) {
        if (card.value !== maxRep[0].value) {
          count++;
          res.push(card);
        }
        if (count === 2) {
          return { rank: HandRank.ThreeOfAKind, cards: res };
        }
      }
    }
  }
  if (flush) {
    return { rank: HandRank.Flush, cards: flush.slice(0, 5) };
  }
  if (straight) {
    return { rank: HandRank.Straight, cards: straight.reverse().slice(0, 5) };
  }
  // Check for pair or two pairs
  if (maxRep) {
    const secRep = repeats.shift();
    if (secRep) {
      cards.sort((a, b) => (a.value > b.value ? -1 : 1));
      const res = maxRep.concat(secRep);
      for (const card of cards) {
        if (card.value !== maxRep[0].value && card.value !== secRep[0].value) {
          return { rank: HandRank.TwoPairs, cards: res.concat([card]) };
        }
      }
    } else {
      let count = 0;
      const res = maxRep;
      cards.sort((a, b) => (a.value > b.value ? -1 : 1));
      for (const card of cards) {
        if (card.value !== maxRep[0].value) {
          count++;
          res.push(card);
        }
        if (count === 3) {
          return { rank: HandRank.Pair, cards: res };
        }
      }
    }
  }
  cards.sort((a, b) => (a.value > b.value ? -1 : 1));
  return { rank: HandRank.HighCard, cards: cards.slice(0, 5) };
}

async function checkForFlush(cards: Card[]) {
  const clubs: Card[] = [];
  const diamonds: Card[] = [];
  const hearts: Card[] = [];
  const spades: Card[] = [];

  for (const card of cards) {
    switch (card.suit) {
      case CardSuit.Clubs:
        clubs.push(card);
        break;
      case CardSuit.Diamonds:
        diamonds.push(card);
        break;
      case CardSuit.Hearts:
        hearts.push(card);
        break;
      case CardSuit.Spades:
        spades.push(card);
        break;
    }
  }

  for (const suit of [clubs, diamonds, hearts, spades]) {
    if (suit.length >= 5) {
      suit.sort((a, b) => (a.value > b.value ? -1 : 1));
      return suit;
    }
  }
  return undefined;
}

async function checkForStraight(cards: Card[]) {
  cards.sort((a, b) => (a.value > b.value ? 1 : -1));

  let straight: Card[] = [];
  for (const card of cards) {
    if (straight.length === 0) {
      if (card.value === 2 && cards[cards.length - 1].value === 14) {
        straight.push(cards[cards.length - 1]);
      }
      straight.push(card);
    } else {
      const prevCard = straight[straight.length - 1];
      if (prevCard.value === card.value - 1) {
        straight.push(card);
      } else if (prevCard.value > card.value) {
        straight = [card];
      }
    }
  }
  if (straight.length >= 5) {
    return straight;
  }

  return undefined;
}

function checkForRepeats(cards: Card[]) {
  const repeatsMap = new Map<number, Card[]>();

  for (const card of cards) {
    const rep = repeatsMap.get(card.value);
    if (rep) {
      rep.push(card);
    } else {
      repeatsMap.set(card.value, [card]);
    }
  }

  const repeats: Card[][] = [];

  repeatsMap.forEach(rep => rep.length >= 2 && repeats.push(rep));
  return repeats.sort((r1, r2) =>
    r1.length > r2.length ? -1 : r1.length < r2.length ? 1 : r1[0].value > r2[0].value ? -1 : 0
  );
}
