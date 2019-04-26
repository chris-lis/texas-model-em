import { TotalPot } from './pot';
import { Card } from './deck';

// Naive approaches
export const callingMachine = (...args: any) => {
  return 0;
}

export const raisingMachine = (...args: any) => {
  return 1;
}

export const callRaiseMachine = (...args: any) => {
  return Math.floor(Math.random() * 2);
}

export const random = (...args: any) => {
  return Math.floor(Math.random() * 3);
}
