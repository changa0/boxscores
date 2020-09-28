// these have been deprecated and are probably non-functional due to changed access restrictions on NBA API side

const SCOREBOARD_URL = "https://stats.nba.com/stats/scoreboard/?GameDate=";
const SCOREBOARD_URL_SUFFIX = "&LeagueID=00&DayOffset=0&callback=getGames&noCache=";
const SCOREBOARD_URL_REFRESH = "&LeagueID=00&DayOffset=0&callback=refresh&noCache=";

var scoreboard;     // stores full returned data for scoreboard jsonp request
var games;          // stores GameHeader object from jsonp request
var lineScore;      // stores LineScore object from jsonp request

/**
 * returns today's date, and a parameter to prevent caching of jsonp response page
*/
function getDate() {
    var date = new Date( Date.now() );
    // added a param to prevent caching of the jsonp response
    var noCache = date.getTime() - 1.515e12;
    // set options for date format
    var options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    };
    var formatted = new Intl.DateTimeFormat("en-US", options).format(date);

    return [formatted, noCache];
}


/**
 * for debugging using console, get games on different dates
 * @param {string} date - date in m{d}/d{d}/yyyy format, ex. "1/7/2018"
 */
function debugDate(date) {
    const validatedDate = dateValidationHelper(date); // ["11/12/2014", "11", "12", "2014"]
    if ( !validatedDate ) {
        console.log("Wrong date format, takes MM/DD/YYYY");
        return;
    }

    clearDropdown(); // otherwise will iterate out of index for dropdown menu
    if ( document.getElementById("info") ) deleteInfo();
    var script = document.createElement("script");
    var url = SCOREBOARD_URL + date + SCOREBOARD_URL_SUFFIX + Math.floor( Math.random() * 1000 );
    console.log(url);
    script.setAttribute("src", url);
    document.body.appendChild(script);
}

/**
 * prepares url for jsonp call, and inserts the necessary script inline
 * to invoke callback for JSONP
*/
function requestRefresh() {
    var insertedScript = document.createElement("script");
    var date = getDate();
    var url = SCOREBOARD_URL + date[0] + SCOREBOARD_URL_REFRESH + date[1];

    console.log(url);
    insertedScript.setAttribute("src", url);
    insertedScript.setAttribute("class","jsonp-script");
    document.body.appendChild(insertedScript);
}

function requestGames() {
    var insertedScript = document.createElement("script");
    var date = getDate();
    var url = SCOREBOARD_URL + date[0] + SCOREBOARD_URL_SUFFIX + date[1];

    console.log(url);
    insertedScript.setAttribute("src", url);
    insertedScript.setAttribute("class","jsonp-script");
    document.body.appendChild(insertedScript);
}

function checkNoGames() {
    if ( games.length < 1 ) {
        displayAlert("No games available today");
        var noGames = document.createElement("h1");
        noGames.setAttribute("id", "no-games");
        noGames.appendChild( document.createTextNode("No games available today") );
        document.getElementById("placeholder").appendChild(noGames);

        if ( document.getElementById("info") ) deleteInfo();
        return true;
    }
    return false;
}

/**
 * takes the returned JSONP, sets data for scoreboard, games, lineScore, lastMeeting global variables
 * @param data passed from jsonp function, enclosed json object
 */
function storeData(data) {
    scoreboard = data;
    games = data.resultSets[0].rowSet;
    lineScore = scoreboard.resultSets[1].rowSet;
    lastMeeting = scoreboard.resultSets[3].rowSet; // get lastMeeting array in scoreboard object
}

/**
 * Callback function for JSONP, runs upon page load. Need to put desired actions in jsonp callback
 * function since the dynamically inserted script is run last
 * @param data jsonp enclosed json object
 */
function getGames(data) {

    storeData(data);
    if ( checkNoGames() ) return;
    populateDropdown();
    updateScore();
}

/**
 * @param {string} gameId string containing gameID for selected game
 */
function getGameJSON(gameId) {
    var season = games[0][8];
    var url = genUrl(season, gameId);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.onload = function () {
        if (initialLoad || messagePresent === 1 ) deleteMessage();
        if ( xhr.status === 200 || xhr.status === 304 ) {
            gameJSON = xhr.response.g; // g for JSON key
            formatInfo();
        } else if ( xhr.status === 403 ) {
            genMessage("Error: Proxy rejected non-whitelisted domain");
        } else if ( xhr.status === 429 ) {
            genMessage("Too many requests. Server is restricted to 12 requests per minute");
        } else {
            genMessage("An error occurred while retrieving live game data");
        }
        if ( initialLoad ) {
            console.timeEnd();
            initialLoad = null;
        }
    }
    xhr.send();
}

function updateScore() {
    var dropdown = document.getElementById("dropdown");
    if ( dropdown.value == "" ) dropdown.value = 0; // edge case when going from day w/ no games to day w/ games
    var selected = dropdown.value;
    var gameId = games[selected][2];

    // delete info if existing
    if ( document.getElementById("info") ) deleteInfo();

    // check if game hasn't started yet
    if ( games[selected][9] === 0 ) {
        var game = lastMeeting[selected];
        var awayName = game[9] + " " + game[10];
        var homeName = game[4] + " " + game[5];
        dropdown.setAttribute("class", "inactive");
        inactiveGame(awayName, homeName, selected);
        return;
    } else { // remove inactive style if present
        if ( dropdown.getAttribute("class") ) dropdown.setAttribute("class","active");
    }
    if (initialLoad) {     // upon first load, may need to wait for heroku dyno
        genMessage("Waiting for dyno...");
        console.time();
    }
    getGameJSON(gameId);
}

function refresh(data) {
    var dropdown = document.getElementById("dropdown");
    var selectedGame = dropdown.value;
    // clean up old script
    if ( document.getElementsByClassName("jsonp-script")[0] ) {
        document.getElementsByClassName("jsonp-script")[0].remove();
    }
    storeData(data);
    if ( checkNoGames() ) return;
    if ( document.getElementById("no-games") ) document.getElementById("no-games").remove(); // edge case
    clearDropdown();
    populateDropdown();
    dropdown.value = selectedGame;  //restore selected game in dropdown, to reflect displayed
    updateScore();
}

function refresh(data) {
    var dropdown = document.getElementById("dropdown");
    var selectedGame = dropdown.value;

    storeData(data);
    if ( checkNoGames() ) return;
    if ( document.getElementById("no-games") ) document.getElementById("no-games").remove(); // edge case
    clearDropdown();
    populateDropdown();
    dropdown.value = selectedGame;  //restore selected game in dropdown, to reflect displayed
    updateScore();
}

/**
 * generate team records info, fix if server returns data in opposite order
 * @param {number} game - index for selected game
 * @param {number} fix - flag to fix or not
 */
function genRecords(game, fix) {
    var table = document.createElement("table");
    var team1 = [ lineScore[2*game][4], "(" + lineScore[2*game][6] + ")" ];
    var team2 = [ lineScore[ 2*game+1 ][4], "(" + lineScore[ 2*game+1 ][6] + ")" ];
    if ( fix === 1 ) {
        var rowData = team2;
        var row = rowHelper(rowData, "td");
        table.appendChild(row);
        rowData = team1;
    } else {
        var rowData = team1;
        var row = rowHelper(rowData, "td");
        table.appendChild(row);
        rowData = team2;
    }
    row = rowHelper(rowData, "td");
    table.appendChild(row);
    return table;
}

/**
 * use for creating table rows
 * @param {array} rowData - an array of strings for table data cells
 * @param {string} cellType - specifies th or td
 */
function rowHelper(rowData, cellType) {
    var row = document.createElement("tr");

    for (var text of rowData) {
        var cell = document.createElement(cellType);
        var cellText = document.createTextNode(text);
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    return row;
}

/**
 * generates info for games yet to begin
 * @param {string} awayName
 * @param {string} homeName
 * @param {number} game - index of game
 */
function inactiveGame(awayName, homeName, game) {
    var placeholder = document.getElementById("placeholder");
    var toUpdate = document.createElement("div");
    toUpdate.setAttribute("id", "info");

    var teamsInfo = genTeamInfo(awayName, homeName);
    toUpdate.appendChild(teamsInfo);

    var message = document.createElement("h1");
    message.setAttribute("class", "message");
    message.appendChild( document.createTextNode("Game begins at") );
    toUpdate.appendChild(message);

    var gameTime = document.createElement("h2");
    gameTime.setAttribute("class", "message");
    gameTime.appendChild( document.createTextNode( games[game][4] ) );
    toUpdate.appendChild(gameTime);

    var recordsHeader = document.createElement("h3");
    recordsHeader.appendChild( document.createTextNode("Team Records") );
    if ( games[game][5].substring(12) === lineScore[2*game+1][4] ) { // check team match
        var records = genRecords(game, 0);
    } else {
        var records = genRecords(game, 1);                  // or else fix
    }
    records.setAttribute("id", "record-table");

    toUpdate.appendChild(recordsHeader);
    toUpdate.appendChild(records);
    placeholder.appendChild(toUpdate);
}