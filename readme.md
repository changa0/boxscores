README.md

# SlimScore
### v1.0

## View today's nba game scores

[Use application here](https://changa0.github.io/boxscores/)

[Chrome extension version](https://github.com/changa0/boxscoreschrome)

An application with a small footprint for viewing live NBA game scores, compatible with desktop and mobile web browsers

### Issues/Notes
* The application uses JSONP to fetch api data for the list of games (scoreboard) due to cross origin resource sharing (CORS) restrictions, and XMLHttpRequests for individual game data forwarded from a Heroku-based proxy to compensate for CORS restrictions.
* Full box score for in progress games and completed is now functional
* The proxy increases response times, particularly when Heroku dyno is in sleep. **When dyno is asleep, getting live game data may take around 10 seconds initially.**
* Scoreboard endpoint restricts heroku/aws/other web host access and thus must use JSONP. Only github.io is whitelisted to use the proxy
* Rarely, teams under team records are in upcoming games may differe from the ones selected, this is due to an issue with nba's stats api mixing up the order in the requested data
* Google chrome version is available, uses cross origin XHR requests instead of jsonp, allowed by extension permissions. Supports live full box scores with player statistics, more responsive than github.io version since proxy is not needed, no proxy delay or sleep delays.
