"use strict";
const NBA_STATS_URL = "https://stats.nba.com/stats/";
const SCOREBOARD_URL = "https://stats.nba.com/stats/scoreboard/?GameDate=";
const SCOREBOARD_URL_SUFFIX = "&LeagueID=00&DayOffset=0&callback=getGames&noCache=";
const SCOREBOARD_URL_REFRESH = "&LeagueID=00&DayOffset=0&callback=refresh&noCache=";

var scoreboard;     // stores full returned data for scoreboard jsonp request
var games;          // stores GameHeader object from jsonp request
var lineScore;      // stores LineScore object from jsonp request
var lastMeeting;    // stores LastMeeting

pageLoad();

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
 * prepares url for jsonp call, and inserts the necessary script inline
 * to invoke callback for JSONP
*/
function requestGames() {
    var insertedScript = document.createElement("script");
    var date = getDate();
    var url = SCOREBOARD_URL + date[0] + SCOREBOARD_URL_SUFFIX + date[1];

    console.log(url);
    insertedScript.setAttribute("src", url);
    insertedScript.setAttribute("class","jsonp-script");
    document.body.appendChild(insertedScript);
}

/**
 * for debugging using console, get games on different dates
 * @param {string} date - date in m{d}/d{d}/yyyy format, ex. "1/7/2018"
 */
function debugDate(date) {
    clearDropdown(); // otherwise will iterate out of index for dropdown menu
    var script = document.createElement("script");
    var url = SCOREBOARD_URL + date + SCOREBOARD_URL_SUFFIX + Math.floor( Math.random() * 1000 );
    console.log(url);
    script.setAttribute("src", url);
    document.body.appendChild(script);
}

function requestRefresh() {
    var insertedScript = document.createElement("script");
    var date = getDate();
    var url = SCOREBOARD_URL + date[0] + SCOREBOARD_URL_REFRESH + date[1];

    console.log(url);
    insertedScript.setAttribute("src", url);
    insertedScript.setAttribute("class","jsonp-script");
    document.body.appendChild(insertedScript);
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

    if ( games.length < 1 ) {
        window.alert("No games available today");
        var noGames = document.createElement("h2");
        noGames.appendChild( document.createTextNode("No games available") );
        document.getElementById("placeholder").appendChild(noGames);
        return;
    }
}

/**
 * Callback function for JSONP, runs upon page load. Need to put desired actions in jsonp callback
 * function since the dynamically inserted script is run last
 * @param data jsonp enclosed json object
 */
function getGames(data) {

    storeData(data);
    populateDropdown();
    updateScore();
}

/**
 * populates the dropdown menu with current day's games
*/
function populateDropdown() {
    var dropdown = document.getElementById("dropdown");

    for (var game of lastMeeting) {
        var option = document.createElement("option");
        var gameIndex = lastMeeting.indexOf(game);
        //var awayName = game[9] + " " + game[10];
        //var homeName = game[4] + " " + game[5];
        var awayAbbrev = game[11];
        var homeAbbrev = game[6];
        var gameStatus = games[gameIndex][4]; // shows time or final
        var playing = games[gameIndex][9];

        option.text = awayAbbrev + " vs. " + homeAbbrev + " - " + gameStatus;
        option.value = gameIndex;
        if ( playing == 0 ) {
            option.setAttribute("class", "inactive");
        } else {
            option.setAttribute("class", "active");
        }
        dropdown.appendChild(option);
    }
}

/**
 *  Updates scores for current game by removing the old table and then adding updated.
 */
function updateScore() {
    var dropdown = document.getElementById("dropdown");
    var selected = dropdown.value;
    var game = lastMeeting[selected];
    var awayName = game[9] + " " + game[10];
    var homeName = game[4] + " " + game[5];

    // delete info if existing
    if ( document.getElementsByTagName("h2")[0] ) deleteInfo();

    // check if game hasn't started yet
    if ( games[selected][9] == 0 ) {
        dropdown.setAttribute("class", "inactive");
        inactiveGame(awayName, homeName, selected);
        window.alert("Game has not started yet");
        return;
    } else { // remove inactive style if present
        if ( dropdown.getAttribute("class") ) dropdown.setAttribute("class","active");
    }

    var placeholder = document.getElementById("placeholder");
    var awayLineScore = lineScore[ 2*selected ];
    var homeLineScore = lineScore[ 2*selected+1 ];
    var awayScore = awayLineScore[21];
    var homeScore = homeLineScore[21];

    //create div to contain info elements
    var toUpdate = document.createElement("div");
    toUpdate.setAttribute("id", "info");
    var text;

    var teamsInfo = genTeamInfo(awayName, homeName);
    toUpdate.appendChild(teamsInfo);

    var scores = formatScoreText(awayScore, homeScore);
    toUpdate.appendChild(scores[0]);
    toUpdate.appendChild(scores[1]);
    toUpdate.appendChild(scores[2]);

    var period = document.createElement("h2");
    if ( games[selected][4] == "Final" ) {
        text = document.createTextNode("Final");
    } else {
        text = document.createTextNode( "Q" + games[selected][9] + "\xa0\xa0" + games[selected][10] );
    }
    period.appendChild(text);
    toUpdate.appendChild(period);

    var quarterTable = genQuarterTable( selected, awayLineScore, homeLineScore );
    toUpdate.appendChild(quarterTable);

    var recordsHeader = document.createElement("h3");
    text = document.createTextNode("Team Records");
    recordsHeader.appendChild(text);
    var records = genRecords(selected);
    records.setAttribute("id", "record-table");

    toUpdate.appendChild(recordsHeader);
    toUpdate.appendChild(records);
    placeholder.appendChild(toUpdate);
}

function genTeamInfo(away, home) {
    var header = document.createElement("h2");
    header.appendChild( document.createTextNode( away + " at " + home ) );
    return header;
}

function formatScoreText(left, right) {
    var leftElement = document.createElement("h1");
    var rightElement = document.createElement("h1");
    var center = document.createElement("h1");
    var leftText = document.createTextNode(left);
    var rightText = document.createTextNode(right);

    leftElement.appendChild( document.createTextNode(left) );
    center.appendChild( document.createTextNode("\u2013") ); //endash
    rightElement.appendChild( document.createTextNode(right) );

    if ( left > right ) {
        leftElement.setAttribute("class", "leading");
    } else if ( left < right ) {
        rightElement.setAttribute("class", "leading");
    }

    return [leftElement, center, rightElement];
}

function genQuarterTable(game, away, home) {
    var currentQuarter = games[game][9];
    var tbl = document.createElement("table");
    var tblHead = document.createElement("thead");
    var tblBody = document.createElement("tbody");
    var header = "<tr><th>Team</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th>";

    // OT tonight
    if ( currentQuarter > 4 ) {
        for ( var i = 1; i <= currentQuarter - 4; i++ ) {
            if ( i == 1 ) {
                header += "<th>OT</th>";
            } else {
                header += "<th>OT" + i + "</th>";
            }
        }
    }
    header += "</tr>";
    tblHead.innerHTML = header;

    var awayRow = quarterTableHelper( away, currentQuarter );
    var homeRow = quarterTableHelper( home, currentQuarter );
    tblBody.appendChild(awayRow);
    tblBody.appendChild(homeRow);
    tbl.appendChild(tblHead);
    tbl.appendChild(tblBody);
    tbl.setAttribute("id", "quarter-table");
    return tbl;
}

function quarterTableHelper(team, quarters) {
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = document.createTextNode(team[4]);

    cell.appendChild(cellText);
    row.appendChild(cell);

    var counter = 4;
    if ( quarters > 4 ) counter = quarters;
    for ( var i = 0; i < counter; i++ ) {
        cell = document.createElement("td");
        if ( i < quarters ) {
            cellText = document.createTextNode(team[7 + i]);
        } else { // if quarter hasn't been played yet
            cellText = document.createTextNode("-");
        }
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    return row;
}
/**
 * generate team records info
 * @param {number} game - index for selected game 
 */
function genRecords(game) {
    var table = document.createElement("table");
    var rowData = [ lineScore[2*game][4], "(" + lineScore[2*game][6] + ")" ];
    var row = rowHelper(rowData);
    table.appendChild(row);

    rowData = [ lineScore[ 2*game+1 ][4], "(" + lineScore[ 2*game+1 ][6] + ")" ];
    row = rowHelper(rowData);
    table.appendChild(row);
    return table;
}
/**
 * use for creating table rows
 * @param {array} rowData - an array of strings for table data cells
 */
function rowHelper(rowData) {
    var row = document.createElement("tr");

    for (var text of rowData) {
        var cell = document.createElement("td");
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

    var gameTime = document.createElement("h2");
    gameTime.appendChild( document.createTextNode( games[game][4] ) );
    toUpdate.appendChild(gameTime);

    var recordsHeader = document.createElement("h3");
    recordsHeader.appendChild( document.createTextNode("Team Records") );
    var records = genRecords(game);
    records.setAttribute("id", "record-table");
    toUpdate.appendChild(recordsHeader);
    toUpdate.appendChild(records);

    placeholder.appendChild(toUpdate);
}

function deleteInfo() {
    var info = document.getElementById("info");
    info.remove();
}

function clearDropdown() {
    if( document.getElementById("dropdown").hasChildNodes() ) document.getElementById("dropdown").innerText = "";
}

function refresh(data) {
    var dropdown = document.getElementById("dropdown");
    var selectedGame = dropdown.value;
    // clean up old script
    if ( document.getElementsByClassName("jsonp-script")[0] ) {
        document.getElementsByClassName("jsonp-script")[0].remove();
    }
    storeData(data);
    updateScore();
    clearDropdown();
    populateDropdown();
    dropdown.value = selectedGame;  //restore selected game in dropdown, to reflect displayed
}

// initiates upon loading page
function pageLoad() {
    requestGames();
}