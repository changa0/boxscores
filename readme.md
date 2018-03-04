README.md

# SlimScore

## get today's nba game scores

[Use application here](https://changa0.github.io/boxscores/)

### Issues/Notes
* the application uses JSONP to fetch api data because of cross origin resource sharing (CORS) restrictions, as such can only get basic score info at this time and not full box score data 
* sometimes teams under team records are in different order from the other parts on the page, this is an "error" with nba's stats api