README.md

# SlimScore

## get today's nba game scores

[Use application here](https://changa0.github.io/boxscores/)

An application with a small footprint for viewing live NBA game scores, compatible with desktop and mobile web browsers

### Issues/Notes
* the application uses JSONP to fetch api data because of cross origin resource sharing (CORS) restrictions, as such can only get basic score info at this time rather than full box score data 
* sometimes teams under team records are in different order from the other parts on the page, this is an "error" with nba's stats api