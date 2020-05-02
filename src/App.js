import React, {useState} from 'react';
import './App.css';

import Data from './data.json'
console.log(Data)

function GamePicker({gameList, setGame, game}) {
  const dropdown = <div className="btn-group">
    <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {game || "Choose a game"}
    </button>
    <div className="dropdown-menu">
      {Object.entries(gameList).map(([shortName, long]) =>
        <a className={"dropdown-item " + (shortName === game ? "active" : "")}
        href="#"
        onClick={() => setGame(shortName)}>
          {shortName}: {long}
        </a>
      )}
    </div>
  </div>

  return dropdown
}

function App() {
  const game_list = Object.entries(Data.games).map(([short, long]) => <div>
    <strong>{short}</strong>: {long}
  </div>)

  const [g1, setG1] = useState(null)
  const [g2, setG2] = useState(null)

  return (
    <div className="App">
      <header className="App-header">
        18xx rule concordance
      </header>

      <p className="text-center">
        Compare the rules of 18XX games, side-by-side.
        <a href="http://www.fwtwr.com/18xx/rules_difference_list/single_list.htm#1">
          Based on this excellent document from Keith Thomasson.
        </a>
      </p>

      <table className="table table-striped">
        <thead>
          <tr>
            <th></th>
            <th>
              <GamePicker game={g1} setGame={setG1} gameList={Data.games} />
            </th>
            <th>
              <GamePicker game={g2} setGame={setG2} gameList={Data.games} />
            </th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  );
}

export default App;
