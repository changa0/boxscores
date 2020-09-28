"use strict";

const SCOREBOARD_URL = "https://data.nba.net/prod/v2/";
const SCOREBOARD_URL_SUFFIX = "/scoreboard.json?noCache=";
const GAME_URL_PRE = "https://data.nba.com/data/v2015/json/mobile_teams/nba/";
const GAME_URL_PART = "/scores/gamedetail/";
const GAME_URL_SUFFIX = "_gamedetail.json";
// can't use proxy on local since not whitelisted
const PROXY_URL = !window.location.href.match(/github.io/) ? '' : 'https://corsrouter.herokuapp.com/';
var initialLoad = 1;
var messagePresent = 0; // indicate if message text is currently present

var lastMeeting;    // stores LastMeeting
var gameJSON;

pageLoad();

/**
 * returns today's date, a parameter that can be used to prevent caching, and month, day, year components
*/
function getDate() {
    const date = new Date( Date.now() );
    // added a param to prevent caching of the jsonp response
    const noCache = date.getTime() - 1.515e12;
    // set options for date format
    const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    };
    const formatted = new Intl.DateTimeFormat("en-US", options).format(date);
    const validatedDate = dateValidationHelper(formatted); // ["11/12/2014", "11", "12", "2014"]
    const month = validatedDate[1];
    const day = validatedDate[2];
    const year = validatedDate[3];

    return [formatted, noCache, month, day, year];
}

/**
 * returns the month, day, year components in format ["11/12/2014", "11", "12", "2014"]
*/
function dateValidationHelper(date) {
    const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const validatedDate = dateRegex.exec(date);
    return validatedDate;
}

/**
 * generate url for xhr json request
 * @param {string} season season in year, ex: 2017 is 2017-18 season
 * @param {string} gameId gameID for specific game
 */
function genUrl(gameId, season) {
    var url = PROXY_URL + GAME_URL_PRE + season + GAME_URL_PART + gameId + GAME_URL_SUFFIX;
    return url;
}

/**
 * Get games for the current date. To get games on different date for debugging, use console
 * @param {string} date - date in m{d}/d{d}/yyyy format, ex. "1/7/2018"
 */
function requestGames(date) {
    let noCache;
    let games;

    if ( !date ) {
        date = getDate();
        noCache = date[1];
    } else {
        noCache = new Date(Date.now()).getTime() - 1.515e12;
    }

    const validatedDate = dateValidationHelper(date);

    if ( !validatedDate ) {
        console.log("Invalid date, takes MM/DD/YYYY");
        return;
    }

    const year = validatedDate[3];
    const month = ( validatedDate[1].length > 1 ) ? validatedDate[1] : '0' + validatedDate[1];
    const day = ( validatedDate[2].length > 1 ) ? validatedDate[2] : '0' + validatedDate[2];
    const formattedDateComponent = year + month + day;

    const url = SCOREBOARD_URL + formattedDateComponent + SCOREBOARD_URL_SUFFIX + noCache;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "json";
    console.time();
    xhr.onload = () => {
        if (initialLoad || messagePresent === 1 ) deleteMessage();
        if ( xhr.status === 200 || xhr.status === 304 ) {
            games = xhr.response.games;
            populateDropdown(games);
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

    console.log(url);
    return;
}

/**
 * populates the dropdown menu with current day's games
*/
function populateDropdown(games) {
    const dropdown = document.getElementById("dropdown");

    removeNoGamesAlert();
    clearDropdown();

    if ( !games || games.length < 1 ) {
        displayAlert("No games available today");
        const noGames = document.createElement("h1");
        noGames.setAttribute("id", "no-games");
        noGames.appendChild( document.createTextNode("No games available today") );
        document.getElementById("placeholder").appendChild(noGames);

        if ( document.getElementById("info") ) deleteInfo();
        return;
    }

    for (const game of games) {
        const option = document.createElement("option");
        const gameId = game.gameId;
        const season = game.seasonYear;

        const awayAbbrev = game.vTeam.triCode;
        const awayRecord = `${game.vTeam.win}-${game.vTeam.loss}`;
        const homeAbbrev = game.hTeam.triCode;
        const homeRecord = `${game.hTeam.win}-${game.hTeam.loss}`;
        const gameStatus = game.statusNum; // seems 1 is yet to play, 2 is probably in progress, 3 is finished
        let gameStatusMessage;

        const playing = (game.period > 0) ? 1 : 0;
        option.value = gameId;
        option.setAttribute("data-status", gameStatus);
        option.setAttribute("data-season", season);
        option.setAttribute("data-away-record", awayRecord);
        option.setAttribute("data-home-record", homeRecord);

        if ( playing === 0 && gameStatus === 1 ) {
            const startTime = game.startTimeEastern;
            gameStatusMessage = `- ${startTime}`;
            option.setAttribute("class", "inactive");
        } else if ( gameStatus === 2 ) {
            gameStatusMessage = `- ${startTime}`;
            option.setAttribute("class", "active");
        } else {
            gameStatusMessage = '- Final';
            option.setAttribute("class", "active");
        }

        option.text = `${awayAbbrev} vs. ${homeAbbrev} ${gameStatusMessage}`;

        dropdown.appendChild(option);
    }

    updateScore();
    return;
}

/**
 * @param {string} gameId string containing gameID for selected game
 */
function getGameJSON(gameId, season) {
    var url = genUrl(gameId, season);
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

/**
 *  Updates scores for current game by removing the old table and then calling for game JSON
 */
function updateScore() {
    const dropdown = document.getElementById("dropdown");
    if ( dropdown.value == "" ) dropdown.value = 0; // edge case when going from day w/ no games to day w/ games

    const selected = dropdown.selectedIndex; // selected option
    const gameId = dropdown.value;
    const season = dropdown[selected].getAttribute("data-season");
    const status = dropdown[selected].getAttribute("data-status");

    // delete info if existing
    if ( document.getElementById("info") ) deleteInfo();

    // check if game hasn't started yet
    if ( status === '1' ) {
        // var awayName = game[9] + " " + game[10]; // was previously full name, but not provided data later
        // var homeName = game[4] + " " + game[5];
        const awayName = dropdown[selected].text.substring(0,3);
        const homeName = dropdown[selected].text.substring(8,11);
        const awayRecord = dropdown[selected].getAttribute("data-away-record");
        const homeRecord = dropdown[selected].getAttribute("data-home-record");
        const gameTime = dropdown[selected].text.substring(14);

        dropdown.setAttribute("class", "inactive");
        inactiveGame(homeName, awayName, homeRecord, awayRecord, gameTime);
        return;
    } else { // remove inactive style if present
        if ( dropdown.getAttribute("class") ) dropdown.setAttribute("class","active");
    }
    if (initialLoad) {     // upon first load, may need to wait for heroku dyno
        genMessage("Waiting for dyno...");
        console.time();
    }
    getGameJSON(gameId, season);
}

// creates and adds the DOM elements for the formatted info
function formatInfo() {
    const dropdown = document.getElementById("dropdown");
    const selected = dropdown.selectedIndex;
    var placeholder = document.getElementById("placeholder");
    var awayName = gameJSON.vls.tc + " " + gameJSON.vls.tn;
    const awayAbbrev = gameJSON.vls.ta;
    var homeName = gameJSON.hls.tc + " " + gameJSON.hls.tn;
    const homeAbbrev = gameJSON.hls.ta;
    var awayStats = gameJSON.vls;
    var homeStats = gameJSON.hls;
    const awayRecord = dropdown[selected].getAttribute("data-away-record");
    const homeRecord = dropdown[selected].getAttribute("data-home-record");

    //create div to contain info elements
    var toUpdate = document.createElement("div");
    toUpdate.setAttribute("id", "info");
    var text;

    var teamsInfo = genTeamInfo(awayName, homeName);
    toUpdate.appendChild(teamsInfo);

    var scores = formatScoreText( gameJSON.lpla.vs, gameJSON.lpla.hs );
    toUpdate.appendChild(scores[0]);
    toUpdate.appendChild(scores[1]);
    toUpdate.appendChild(scores[2]);

    var period = document.createElement("h2");
    if ( gameJSON.stt === "Final" ) {
        text = document.createTextNode("Final");
    } else {
        var clock = gameJSON.cl.replace(/^0+/, '');
        text = document.createTextNode( gameJSON.stt + "\xa0\xa0" + clock );
    }
    period.appendChild(text);
    toUpdate.appendChild(period);

    var quarterTable = genQuarterTable( awayStats, homeStats );
    toUpdate.appendChild(quarterTable);

    var awayBox = genBox(awayStats, awayName);
    var homeBox = genBox(homeStats, homeName);
    toUpdate.appendChild(awayBox);
    toUpdate.appendChild(homeBox);

    var recordsHeader = document.createElement("h3");
    text = document.createTextNode("Team Records");
    recordsHeader.appendChild(text);
    const records = genRecords(homeAbbrev, awayAbbrev, homeRecord, awayRecord);
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

function genQuarterTable(awayStats, homeStats) {
    var currentQuarter = gameJSON.p;
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

    var awayRow = quarterTableHelper( awayStats, currentQuarter );
    var homeRow = quarterTableHelper( homeStats, currentQuarter );
    tblBody.appendChild(awayRow);
    tblBody.appendChild(homeRow);
    tbl.appendChild(tblHead);
    tbl.appendChild(tblBody);
    tbl.setAttribute("id", "quarter-table");
    return tbl;
}

function quarterTableHelper(team, quarter) {
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = document.createTextNode(team.ta);

    cell.appendChild(cellText);
    row.appendChild(cell);

    var counter = 4; // make 4 cells/quarters min
    if ( quarter > 4 ) counter = quarter;
    for ( var i = 1; i <= counter; i++ ) {
        cell = document.createElement("td");
        if ( i < 5 && i <= quarter ) {
            cellText = document.createTextNode( team["q" + i] );
        } else if ( i > 4 ) {
            cellText = document.createTextNode( team["ot" + (i - 4)] );
        } else { // if quarter hasn't been played yet
            cellText = document.createTextNode("-");
        }
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    return row;
}

function genBox(team , teamName) {
    var boxData = team.pstsg; //player stats
    var div = document.createElement("div");
    div.setAttribute("class", "box-area");
    var label = document.createElement("h2");
    label.appendChild( document.createTextNode(teamName) );
    div.appendChild(label);
    var inactive = [];

    var tbl = document.createElement("table");
    var tblHead = document.createElement("thead");
    var tblBody = document.createElement("tbody");
    var headData = [ "", "Pos", "Min", "Pts", "FG", "3Pt", "FT", "Reb", "Off", "Def", "Ast", "Blk", "Stl", "TO", "BA", "PF", "+/-" ];
    var header = rowHelper(headData, "th");
    tblHead.appendChild(header);
    var key = "Off: Offensive rebounds<br>Def: Defensive rebounds<br>BA: Blocked shot attempts<br>Bolded players: On court";
    var tooltip = document.createElement("span");
    tooltip.innerHTML = key;
    tblHead.setAttribute("class", "tooltippable");
    tblHead.appendChild(tooltip);

    for (var p of boxData) {
        var name = p.fn + " " + p.ln;
        if ( p.status === "I" ) {
            inactive.push(name);
            continue;
        }
        var time = p.min + ":" + (function(s) {if (s < 10) s = "0" + s; return s;})(p.sec);
        var fg = p.fgm + "-" + p.fga;
        var tp = p.tpm + "-" + p.tpa;
        var ft = p.ftm + "-" + p.fta;
        var rowData = [ name, p.pos, time, p.pts, fg, tp, ft, p.reb, p.oreb, p.dreb, p.ast, p.blk, p.stl, p.tov, p.blka, p.pf, p.pm];
        var row = rowHelper(rowData, "td");
        if ( p.court === 1 ) row.setAttribute("class", "on-court");
        tblBody.appendChild(row);
    }
    tbl.appendChild(tblHead);
    tbl.appendChild(tblBody);
    tbl.setAttribute("class", "box-table");
    div.appendChild(tbl);

    var text = "Inactive: ";
    for ( var i = 0; i < inactive.length; i++ ) {
        if ( i < inactive.length - 1) {
            text += inactive[i] + " | ";
        } else {
            text += inactive[i];
        }
    }
    var extra = document.createElement("h5");
    extra.appendChild( document.createTextNode(text) );
    div.appendChild(extra);

    return div;
}

/**
 * generate team records info, fix if server returns data in opposite order
 * @param {string} home - home team abbreviation
 * @param {string} away
 * @param {string} homeRecord - home team record
 * @param {string} awayRecord
 */
function genRecords(home, away, homeRecord, awayRecord) {
    var table = document.createElement("table");
    var team1 = [ home, "(" + homeRecord + ")" ];
    var team2 = [ away, "(" + awayRecord + ")" ];

    let rowData = team2;
    let row = rowHelper(rowData, "td");
    table.appendChild(row);

    rowData = team1;
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
function inactiveGame(homeName, awayName, homeRecord, awayRecord, gameTime) {
    var placeholder = document.getElementById("placeholder");
    var toUpdate = document.createElement("div");
    toUpdate.setAttribute("id", "info");

    var teamsInfo = genTeamInfo(awayName, homeName);
    toUpdate.appendChild(teamsInfo);

    var message = document.createElement("h1");
    message.setAttribute("class", "message");
    message.appendChild( document.createTextNode("Game begins at") );
    toUpdate.appendChild(message);

    var timeMessage = document.createElement("h2");
    timeMessage.setAttribute("class", "message");
    timeMessage.appendChild( document.createTextNode( gameTime ) );
    toUpdate.appendChild(timeMessage);

    var recordsHeader = document.createElement("h3");
    recordsHeader.appendChild( document.createTextNode("Team Records") );

    const records = genRecords(homeName, awayName, homeRecord, awayRecord);

    records.setAttribute("id", "record-table");

    toUpdate.appendChild(recordsHeader);
    toUpdate.appendChild(records);
    placeholder.appendChild(toUpdate);
}

// generates red message for alerts regarding proxy requests
function genMessage(text) {
    var message = document.createElement("h1");
    message.setAttribute("class", "message");
    message.appendChild( document.createTextNode(text) );
    document.getElementById("placeholder").appendChild(message);
    messagePresent = 1;
}

// deletes red message used for alerts regarding proxy requests
function deleteMessage() {
    if ( document.getElementsByClassName("message")[0] ) {
        document.getElementsByClassName("message")[0].remove();
        messagePresent = 0;
    }
}

/**
 * create an alert message which will show on overlay, instead of using window.alert()
 * @param {string} text message to appear in alert
 */
function displayAlert(text) {
    var overlay = document.createElement("div");
    overlay.setAttribute("id", "overlay");
    overlay.setAttribute("onclick", "dismissAlert()");
    var message = document.createElement("h1");
    message.setAttribute("id", "overlay-message");
    message.appendChild( document.createTextNode(text) );
    overlay.appendChild(message);
    var dismissText = document.createElement("h5");
    dismissText.append( document.createTextNode("(Press to dismiss message)") );

    overlay.appendChild(message);
    overlay.appendChild(dismissText);
    document.body.appendChild(overlay);
}

function dismissAlert() {
    var overlay = document.getElementById("overlay");
    overlay.remove();
}

function deleteInfo() {
    var info = document.getElementById("info");
    info.remove();
}

function clearDropdown() {
    if( document.getElementById("dropdown").hasChildNodes() ) document.getElementById("dropdown").innerText = "";
}

/**
 * for buttons to navigate scroll
 * @param {string} direction - either right or left
 */
function arrowNav(direction) {
    var dropdown = document.getElementById("dropdown");
    var selected = +dropdown.value //string to num

    if ( direction === "l" ) {
        if ( selected === 0 ) return;
        dropdown.value = +dropdown.value - 1;
        updateScore();
    } else if (direction === "r") {
        if ( selected === dropdown.options.length - 1 ) return;
        dropdown.value = +dropdown.value + 1;
        updateScore();
    }
}

// may use if the no games alert is present
function removeNoGamesAlert() {
    if ( document.getElementById("no-games") ) document.getElementById("no-games").remove();
}

// initiates upon loading page
function pageLoad() {
    requestGames();
}