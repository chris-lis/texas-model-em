import { findBestHand, compareHands, Hand, HandRank, HandResult } from "../hand";
import { Card, CardValue, CardSuit } from '../deck';

describe(findBestHand, async () => {
  it('finds the correct best hand from input cards', async () => {
    const board: Card[] = [
      {
        value: CardValue.Six,
        suit: CardSuit.Spades,
      },
      {
        value: CardValue.Seven,
        suit: CardSuit.Spades,
      },
      {
        value: CardValue.Eight,
        suit: CardSuit.Spades,
      },
      {
        value: CardValue.Deuce,
        suit: CardSuit.Hearts,
      },
      {
        value: CardValue.Deuce,
        suit: CardSuit.Diamonds,
      },
    ]
    const highCardBoard: Card[] = board.slice()
    highCardBoard[4] = {
      value: CardValue.Three,
      suit: CardSuit.Diamonds,
    }

    const hole1: Card[] = [
      {
        value: CardValue.King,
        suit: CardSuit.Clubs,
      },
      {
        value: CardValue.Ten,
        suit: CardSuit.Clubs,
      }
    ]

    expect(await findBestHand(hole1, highCardBoard)).toEqual({ rank: HandRank.HighCard, cards: [hole1[0], hole1[1], highCardBoard[2], highCardBoard[1], highCardBoard[0]]})

  })

  it('finds the better two pairs')

  it('finds the better three of a kind', async () => {

  })
  
  it('finds the straight despite repeats', async () => {
    
  })
  
  it('finds the A-5 straight (the wheel)', async () => {

  })

  it('finds the better straight', () => {
    
  })
  
  it('finds the better flush')

  it('finds the better full house')
});