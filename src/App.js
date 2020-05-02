import React, {useState} from 'react';
import './App.css';

import Data from './data.json'

function GamePicker({gameList, setGame, game}) {
  const dropdown = <div className="btn-group">
    <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {game || "Choose a game"}
    </button>
    <div className="dropdown-menu">
      {gameList.map(([shortName, long]) =>
        <a className={"dropdown-item " + (shortName === game ? "active" : "")}
        href="#"
        key={shortName}
        onClick={() => setGame(shortName)}>
          {shortName}: {long}
        </a>
      )}
    </div>
  </div>

  return dropdown
}

function DisplayDiffRows({game1, game2}) {
  const rules = Data.rules;
  const differentRules = rules.filter(([heading, ruleset]) =>
    ruleset[game1] !== ruleset[game2]
  )

  return <tbody>
    {
      differentRules.map(([heading, ruleset]) => {
        return <tr key={heading}>
          <td>{heading}</td>
          <td>{ruleset[game1]}</td>
          <td>{ruleset[game2]}</td>
        </tr>
      })
    }
  </tbody>
}

function App() {
  const sortedGames = Object.entries(Data.games).sort((g1, g2) =>
    g1[0].localeCompare(g2[0])
  )

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
              <GamePicker game={g1} setGame={setG1} gameList={sortedGames} />
            </th>
            <th>
              <GamePicker game={g2} setGame={setG2} gameList={sortedGames} />
            </th>
          </tr>
        </thead>
        <DisplayDiffRows game1={g1} game2={g2} />
      </table>
    </div>
  );
}

export default App;
