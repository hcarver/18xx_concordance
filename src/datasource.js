const cheerio = require('cheerio')
const fs = require('fs');

const RULES_DIFFERENCE_FILE = "input/18xx Games - 18xx Rules Difference List - Single Page Version.htm"

// Map of the rulesets that a game is based on.
const BASE_RULES = {
  "1822+": ["1822"],
  "1822MRS": ["1822"],
  "1830 v1": ["1830"],
  "1830 v2": ["1830"],
  "1830 v3": ["1830"],
  "1830Lummerland": ["1830"],
  "1830NL": ["1830"],
  "1876v2": ["1830"],
  "1899": ["1830"],
  "18AL": ["18GA"],
  "1876 (1830)": ["1876", "1830"],
  "1876 (1835)": ["1876", "1835"],
  "18SY-G": ["18SY"],
  "18SY-O": ["18SY"]
}

// Games which the original page lists as a single entry which we divide into multiple entries.
const COMBINED_GAMES = [
  "1876",
  "18SY"
]

// Games where the code we parse from the games list isn't the one that's used on the rest of the page.
const GAME_CODE_MAP = {
  "1822MRS (Medium Regional Scenario)": "1822MRS",
  "1862: Railways of the Eastern Counties (1862EA)": "1862EA",
  "1862 v2: Railways of the Eastern Counties (1862EA v2)": "1862EA v2"
}


function parseGameList($, h2) {
  const games = {}
  const game_list = $($(h2).next().next())

  let game_code = ""
  // A list of strings to be joined later
  let gameSubtitle = []

  for(let node = game_list.children()[0]; node !== null; node = node.next) {
    if(node.name === "br" || node.name === "font") {
      if(game_code !== "") {
        if(!COMBINED_GAMES.includes(game_code)){
          // Map the game code if we've parsed it wrongly. Otherwise, leave it unchanged.
          if(game_code in GAME_CODE_MAP) {
            original_code = game_code
            game_code = GAME_CODE_MAP[game_code]
            gameSubtitle = [original_code].concat(gameSubtitle)
          }

          // We'll skip some games so they don't have individual entries.
          games[game_code] = {
            code: game_code,
            subtitle: gameSubtitle.join(" "),
            baseRules: BASE_RULES[game_code] || []
          }
        }
        game_code = ""
      }
      gameSubtitle = []
    } else if((node.name === "b" || node.name === "strong") && game_code === "" && gameSubtitle.length === 0) {
      // Not all strong tags are game codes - some are used to highlight parts of the game name.
      // The first strong tag on a line is always the game's code, however.
      // If there's already some text in the gameSubtitle, then this is a comment line, so should be ignored.
      game_code = $(node).text()
      gameSubtitle = []
    } else {
      const text = $(node).text().trim()
      if(text !== ""){
        gameSubtitle.push(text)
      }
    }
  }

  games["1876 (1830)"] = {
    code: "1876 (1830)",
    subtitle: "Trinidad - using 1830 rules",
    baseRules: ["1876", "1830"]
  }
  games["1876 (1835)"] = {
    code: "1876 (1835)",
    subtitle: "Trinidad - using 1835 rules",
    baseRules: ["1876", "1835"]
  }
  games["18SY-G"] = {
    code: "18SY-G",
    subtitle: "18SY - Generalisation rules",
    baseRules: ["18SY"]
  }
  games["18SY-O"] = {
    code: "18SY-O",
    subtitle: "18SY - Original rules",
    baseRules: ["18SY"]
  }

  return games
}

class AbstractRulesParser {
  static parse($, cxt) {
    const pp = new this()
    pp.consume($, cxt)
    return pp.rules
  }

  constructor(){
    this.rules = {}
  }

  // MUST BE IMPLEMENTED IN SUBCLASS
  // consume($, nodes) {}

  addToRules(game_list, rule_text) {
    // Within this loop, we ensure any whitespace in the middle of rules or games codes is replaced with a single space
    // char
    if(game_list.length > 0 && rule_text.length > 0){
      const rule = rule_text.join(" ").replace(/\s+/g, ' ')
      for(let game of game_list) {
        game = game.replace(/\s+/g, ' ')
        this.rules[game] = rule
      }
    }
  }
}

// This parser assumes that every rule set is separated by line breaks. There will be some strong / bold text which is a list
// of one or more game codes. There will be some other text (which may include more strong / bold text) which is not a
// list of game codes.
class BrBrokenParagraphParser extends AbstractRulesParser {
  consume($, nodes) {
    // Maintain a list of games and rules that apply to them
    let game_list = []
    let rule_text = []

    // nodes probably just contains a single p tag
    for(let node of nodes) {
      // Iterate through the children of all passed nodes
      for(let child = node.children()[0]; child !== null; child = child[0].next) {
        if(child === undefined)
          console.log(node.text())

        child = $(child);
        if(child[0].name === "br") {
          this.addToRules(game_list, rule_text)
          game_list = []
          rule_text = []
        }

        // Strong text indicates a new list of games only if we haven't yet encountered some rule text.
        if(rule_text.length == 0 && (child[0].name === "strong" || child[0].name === "b")) {
          // List the games in the strong / bold node
          const games = child.text().split(",")
          for(let game of games){
            game_list.push(game.trim())
          }
        }
        else {
          const child_text = child.text().trim()
          if(child_text !== "" && child_text !== ",") {
            rule_text.push(child_text)
          }
        }
      }
    }

    // When we get to the end of the nodes, we have probably read another rule variant.
    this.addToRules(game_list, rule_text)
  }
}

// This parser assumes there will be some strong / bold text followed by some text that isn't strong or bold.
// The strong / bold text is the code of one or more games, the remainder is the rules.
class ParagraphParser extends AbstractRulesParser {
  consume($, nodes) {
    // Maintain a list of games and rules that apply to them
    let game_list = []
    let rule_text = []
    for(let node of nodes) {
      // Iterate through the children of all passed nodes
      for(let child = node.children()[0]; child !== null; child = child[0].next) {
        if(child === undefined)
          console.log(node.text())
        child = $(child);
        if(child[0] === undefined) {
          break
        }

        // Strong text indicates a new list of games
        if(child[0].name === "strong" || child[0].name === "b") {
          // If we are already maintaining a list of games and rules, store it, and reset.
          if(game_list.length > 0 && rule_text.length > 0){
            this.addToRules(game_list, rule_text)
            game_list = []
            rule_text = []
          }

          // List the games in the strong / bold node
          const games = child.text().split(",")
          for(let game of games){
            if(game_list.length === 0) {
              rule_text = []
            }
            game_list.push(game.trim())
          }
        }
        else {
          const child_text = child.text().trim()
          if(child_text !== "" && child_text !== ",") {
            rule_text.push(child_text)
          }
        }
      }
    }

    // When we get to the end of the nodes, we have probably read another rule variant.
    this.addToRules(game_list, rule_text)
  }
}

const headingStartToParserMap = {
  "1.2 ": ParagraphParser,
  "1.3 ": ParagraphParser,
  "1.4 ": ParagraphParser,
  "2.1 ": ParagraphParser,
  "2.2 ": ParagraphParser,
  "2.3 ": BrBrokenParagraphParser,
  "2.4 ": ParagraphParser,
  // "2.5"
  "2.6 ": ParagraphParser,
  "2.7 ": ParagraphParser,
  "2.8 ": ParagraphParser,
  "2.9 ": ParagraphParser,
  "2.10 ": ParagraphParser,
  "2.11 ": ParagraphParser,
  // "2.12" - unneeded, covered by 10.1
  "3.1 ": ParagraphParser,
  "3.2 ": ParagraphParser,
  "3.3 ": ParagraphParser,
  "3.4 ": ParagraphParser,
  "4.1 ": ParagraphParser,
  "4.2 ": ParagraphParser,
  "5.1 ": ParagraphParser,
  "5.2 ": ParagraphParser,
  // "5.3" - permissive / restrictive track
  "5.4 ": ParagraphParser,
  "6.1 ": ParagraphParser,
  // "6.2" - lay more than one station marker per turn?
  "6.3 ": ParagraphParser,
  "6.4 ": ParagraphParser,
  "7.1 ": ParagraphParser,
  "7.2 ": ParagraphParser,
  "7.3 ": ParagraphParser,
  // "7.4" - can you run one train to two stations on the same tile?
  "7.5 ": ParagraphParser,
  // "7.6" - Rules about villages
  // "7.7" - do you have to claim the max possible revenue?
  "8.1 ": ParagraphParser,
  "8.2 ": ParagraphParser,
  "8.3 ": ParagraphParser,
  "8.4 ": ParagraphParser,
  "9.1 ": ParagraphParser,
  "9.2 ": ParagraphParser,
  "9.3 ": ParagraphParser,
  "9.4 ": ParagraphParser,
  "9.5 ": ParagraphParser,
  "9.6 ": ParagraphParser,
  // "9.7" - can a company buy more than one train per OR?
  "10.1 ": ParagraphParser,
  "10.2 ": ParagraphParser,
  "10.3 ": ParagraphParser,
  "10.4 ": ParagraphParser,
  "10.5 ": ParagraphParser,
  "10.6 ": ParagraphParser,
  "11.1 ": ParagraphParser,
  "11.2 ": ParagraphParser,
  "11.3 ": ParagraphParser,
  // "12" - Game phases
  "13.1 ": ParagraphParser,
  "13.2 ": ParagraphParser,
  "13.3 ": ParagraphParser,
  "13.4 ": ParagraphParser,
  "14.1 ": ParagraphParser,
  "14.2 ": ParagraphParser,
  "14.3 ": ParagraphParser,
  "14.4 ": ParagraphParser,
  // "15.1" - total cash in game
  // "15.2" - trains available
  // "15.3" - tiles available
  // "15.4" - other limited items
  // "16" - other miscellaneous points
}

function parseRuleSet($, h2) {
  let currentNode = $(h2);
  const headingText = currentNode.text().trim()

  // Find parsers that fit
  const appropriateParsers = Object.entries(headingStartToParserMap).filter(
    ([prefix, parser]) => {
      return headingText.startsWith(prefix)
    }
  ).map(
    ([_, parser]) => parser
  )

  // Confirm there are exactly 0 or 1 matching parsers.
  if(appropriateParsers.length > 1) {
    console.log(`ERROR: found ${appropriateParsers.length} parsers for ${headingText}`)
  }
  if(appropriateParsers.length === 0) {
    return null
  }

  // Collect all nodes up to the beginning of the next section
  let sibling = $(currentNode.next())
  const siblingNodes = []
  do {
    siblingNodes.push(sibling)
    sibling = $(sibling.next())
  } while(sibling[0] !== null && sibling[0].name !== "h2")

  // Parse the sibling nodes with the appropriate parser
  return appropriateParsers[0].parse($, siblingNodes)
}

function parsePageAndWrite(body) {
  const $ = cheerio.load(body)

  // Page is structured around h2 tags. Find them all.
  let h2s = $($('h2').get())
  let games;
  const rules = []

  for(let i = 0; i < h2s.length; i++){
    const heading = $(h2s[i]).text().trim()
    if(heading === "Games") {
      games = parseGameList($, h2s[i]);
    } else {
      const ruleSet = parseRuleSet($, h2s[i])
      if(ruleSet !== null) {
        rules.push([heading, ruleSet])
      }
    }
  }

  fs.writeFileSync('data.json', JSON.stringify({
    games: games,
    rules: rules
  }, null, 4))
}

// eslint-disable-next-line
function loadAndParse() {
  fs.readFile(RULES_DIFFERENCE_FILE, function(err, data) {
    if(err) {
      console.log(err)
      throw err
    }
    parsePageAndWrite(data)
  })
}

loadAndParse()
