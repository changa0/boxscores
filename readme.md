README.md

# SlimScore

## get today's nba game scores

[Use application here](https://changa0.github.io/boxscores/)

[Chrome extension version](https://github.com/changa0/boxscoreschrome)


An application with a small footprint for viewing live NBA game scores, compatible with desktop and mobile web browsers

### Issues/Notes
* the application uses JSONP to fetch api data because of cross origin resource sharing (CORS) restrictions, as such can only get basic score info at this time rather than full box score data 
* rarely, teams under team records are in upcoming games may differe from the ones selected, this is due to an issue with nba's stats api mixing up the order in the requested data
* chrome version is available, uses xhttp requests instead of jsonp. Will support live full box scores, currently displays same info as this app
