import React, {useState} from 'react';
import './App.css';

import Data from './data.json'

function GamePicker({gameList, setGame, game}) {
  const dropdown = <div className="btn-group">
    <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {game || "Choose a game"}
    </button>
    <div className="dropdown-menu">
      {gameList.map(([shortName, object]) =>
        <a className={"dropdown-item " + (shortName === game ? "active" : "")}
        href="#"
        key={shortName}
        onClick={() => setGame(shortName)}>
          {shortName}: {object.subtitle}
        </a>
      )}
    </div>
  </div>

  return dropdown
}

function getRule(ruleset, game) {
  let rule = ruleset[game.code]
  if(rule) {
    return rule
  }
  for(let baseRule of game.baseRules) {
    rule = ruleset[baseRule]
    if(rule) {
      return rule
    }
  }
  return ruleset["Rest"]
}

function DisplayDiffRows({game1, game2}) {
  const rules = Data.rules;
  const differentRules = rules.filter(([heading, ruleset]) =>
    getRule(ruleset, game1) !== getRule(ruleset, game2)
  )

  return <tbody>
    {
      differentRules.map(([heading, ruleset]) => {
        return <tr key={heading}>
          <td>{heading}</td>
          <td>{getRule(ruleset, game1)}</td>
          <td>{getRule(ruleset, game2)}</td>
        </tr>
      })
    }
  </tbody>
}

function App() {
  const sortedGames = Object.entries(Data.games).sort((g1, g2) =>
    g1[0].localeCompare(g2[0])
  )

  const [gameCode1, setGameCode1] = useState(null)
  const [gameCode2, getGameCode2] = useState(null)

  const game1 = Data.games[gameCode1]
  const game2 = Data.games[gameCode2]

  let tableBody = null
  if(game1 && game2) {
    tableBody = <DisplayDiffRows game1={game1} game2={game2} />
  }

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

      <p>
        <button class="btn btn-default" type="button" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
          What rules aren't included on this page?
        </button>
      </p>
      <div class="collapse" id="collapseExample">
        <div class="card card-body">
          <p>These sections from the original rules difference list are not yet included here</p>
          <ul>
            <li>1.1 - How much cash do players start with?</li>
            <li>2.5 - What are the player certificate limits?</li>
            <li>5.3 - Must a tile replacement extend existing track?</li>
            <li>6.2 - Can you lay more than one station marker per turn?</li>
            <li>7.4 - Can one train run to two stations on the same tile?</li>
            <li>7.6 - Rules about villages</li>
            <li>7.7 - Must the maximum possible revenue be claimed?</li>
            <li>9.7 - Can a company buy more than one train from the bank per OR?</li>
            <li>Section 12 - Game Phases</li>
            <li>15.1 - Total cash in game</li>
            <li>15.2 - Trains available</li>
            <li>15.3 - Tiles available</li>
            <li>15.4 - Other items in limited supply</li>
            <li>Section 16 - Miscellaneous Points</li>
          </ul>
        </div>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th></th>
            <th>
              <GamePicker game={gameCode1} setGame={setGameCode1} gameList={sortedGames} />
            </th>
            <th>
              <GamePicker game={gameCode2} setGame={getGameCode2} gameList={sortedGames} />
            </th>
          </tr>
        </thead>
        {tableBody}
      </table>
    </div>
  );
}

export default App;
