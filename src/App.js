import React from 'react';
import './App.css';

import useQueryString from './useQueryString'
import Data from './data.json'
import _ from "lodash"

function GamePicker({gameList, setGame, game}) {
  const dropdown = <div className="btn-group">
    <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {game || "Choose a game"}
    </button>
    <div className="dropdown-menu">
      {gameList.map(([shortName, object]) =>
        <button className={"dropdown-item " + (shortName === game ? "active" : "")}
        key={shortName}
        onClick={(e) => { e.preventDefault(); setGame(shortName)}}>
          {shortName}: {object.subtitle}
        </button>
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

function formatRule(rule) {
  if(!Array.isArray(rule))
    return rule

  return <table>
    <tbody>
      {
        rule.map(ruleRow => <tr>
            {
              ruleRow.map(ruleCell => <td>{ruleCell}</td>)
            }
          </tr>
        )
      }
    </tbody>
  </table>
}

function DisplayDiffRows({game1, game2}) {
  const rules = Data.rules;
  const differentRules = rules.filter(([heading, ruleset]) =>
    !_.isEqual(getRule(ruleset, game1), getRule(ruleset, game2))
  )

  return <tbody>
    {
      differentRules.map(([heading, ruleset]) => {
        return <tr key={heading}>
          <td>{heading}</td>
          <td>{formatRule(getRule(ruleset, game1))}</td>
          <td>{formatRule(getRule(ruleset, game2))}</td>
        </tr>
      })
    }
  </tbody>
}

function App() {
  const sortedGames = Object.entries(Data.games).sort((g1, g2) =>
    g1[0].localeCompare(g2[0])
  )

  const [gameCode1, setGameCode1] = useQueryString("game_1")
  const [gameCode2, setGameCode2] = useQueryString("game_2")

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
        <p className="App-subheader">
          Compare the rules of 18xx games, side-by-side.
        </p>
      </header>

      <p className="text-center">
        <a href="http://www.fwtwr.com/18xx/rules_difference_list/single_list.htm#1">
          Based on this excellent document from Keith Thomasson.
        </a>
      </p>

      <div className="text-center">
        <div className="btn-group">
          <button className="btn btn-outline-primary" type="button" data-toggle="collapse" data-target="#missingRulesCollapse" aria-expanded="false" aria-controls="missingRulesCollapse">
            What rules aren't included on this page?
          </button>
          <button className="btn btn-outline-primary" type="button" data-toggle="collapse" data-target="#ReportBugCollapse" aria-expanded="false" aria-controls="ReportBugCollapse">
            I found a mistake.
          </button>
          <button className="btn btn-outline-primary" type="button" data-toggle="collapse" data-target="#HelpOutCollapse" aria-expanded="false" aria-controls="HelpOutCollapse">
            I want to make this page better.
          </button>
        </div>
      </div>
      <div className="collapse" id="missingRulesCollapse">
        <div className="card card-body">
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
      <div className="collapse" id="ReportBugCollapse">
        <div className="card card-body">
          <p>Great, thanks for finding it.</p>
          <p>If it's a problem with the version of the rules on
          <a href="http://www.fwtwr.com/18xx/rules_difference_list/single_list.htm">http://www.fwtwr.com/18xx/rules_difference_list/single_list.htm</a>
          then please contact Keith Thomasson via the link on that page. That data is where the data for this page
          comes from.</p>
          <p>If the data is correct on fwtwr.com then please let me know about the bug. I'm @h on the 18xx Slack, and @h
          on the HOGGS Slack too.</p>
        </div>
      </div>
      <div className="collapse" id="HelpOutCollapse">
        <div className="card card-body">
          <p>Excellent news!</p>
          <p>The code for this project lives at <a href="https://github.com/hcarver/18xx_concordance">https://github.com/hcarver/18xx_concordance</a>. Please submit a Pull Request to that repository with your improvement.</p>
        </div>
      </div>

      <div className="container">
      <p>
        <strong>What do I do? </strong>
        <p>
        Pick a game from the dropdown on the left, and another from the dropdown on the right. Then a table should appear
        listing the rules differences between the two games.
        </p>
      </p>
    </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th></th>
            <th>
              <GamePicker game={gameCode1} setGame={setGameCode1} gameList={sortedGames} />
            </th>
            <th>
              <GamePicker game={gameCode2} setGame={setGameCode2} gameList={sortedGames} />
            </th>
          </tr>
        </thead>
        {tableBody}
      </table>
    </div>
  );
}

export default App;
