import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Deck, Card } from './game/deck';

class App extends Component {
  render() {
    let deck = new Deck;

    let cards: Card[] = []

    for (let i = 0; i < 5; i++) {
      let card = deck.deal();
      if (card) cards.push(card);
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        {cards.map(c => (
          <>
            {c.value} of {c.suit}<br/>  
          </>
        ))}        
      </div>
    );
  }
}

export default App;
