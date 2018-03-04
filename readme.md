README.md

stats.nba.com/stats/

Scoreboard, Summary are available live
playergamelog updated periodically but not live (at half, and likely quarter end) 

The others are only updated after game

endpoints:

Scoreboard
parameters:
1. Date
2. LeagueID (default and should set at 00)
3. DayOffset (use 0)

example
http://stats.nba.com/stats/scoreboard?GameDate=12/23/2017&LeagueID=00&DayOffset=0

contains
GameHeader resultSets[0].rowSet[game]   basic game info
LineScore resultSets[1]                 pts, wins losses, basic team stat ast fg reb etc *read warning&
SeriesStandings resultSets[2]           series stats between home/away teams
LastMeeting resultSets[3]               team cities and names, last meeting
EastConfStandingsByDay resultSets[4]    all east teams win loss, home and road record
WestConfStandingsByDay resultSets[5]
Available resultSets[6]                 game id + "PT_AVAILABLE", not sure what stands for

**Warning** LineScore order of teams in future games is sometimes mixed up, not sure if automated? Supposed to be visitor then home to reflect the GameHeader, but inconsistently and erroneously shows home then away team sometimes. Compare to GameHeader and LastMeeting which are consistently in correct corresponding order. Might need function to verify correct team? UPDATE: seems like they correct the values on day of game, but keep in mind might show teams mixed up on games not yet played

Box score quick summary: shows refs, inactive players
boxscoresummaryv2
http://stats.nba.com/stats/boxscoresummaryv2
"GameID is required"
parameters:
GameID (find through scoreboard)
extra: if use &StartPeriod=0&EndPeriod=0&StartRange=0&EndRange=0 after GameID
then it will show extra Table9 featuring basic player stats like season avg, not sure if intended? Update: Seems like after game ends Table9 is eventually added without need for the extra parameters 
Update 2: appears to be inconsistent, sometimes will appear if adding RangeType, try changing around parameters if desired 
e.g. https://stats.nba.com/stats/boxscoresummaryv2?GameID=0021700494&StartPeriod=0&EndPeriod=0&StartRange=0&EndRange=0

shows: pts in paint, 2nd chance pts, largest lead, lead changes and ties, TOs, team rebounds, pts from TOs
PTS_PAINT
PTS_2ND_CHANCE
PTS_FB
LARGEST_LEAD
LEAD_CHANGES
TIMES_TIED
TEAM_TURNOVERS
TOTAL_TURNOVERS
TEAM_REBOUNDS
PTS_OFF_TO

Player Game Log
http://stats.nba.com/stats/playergamelog
examples:
http://stats.nba.com/stats/playergamelog/?PlayerId=203967&Season=2017-18&SeasonType=Regular+Season&LeagueId=00
http://stats.nba.com/stats/playergamelog/?PlayerId=2544&Season=2017-18&SeasonType=Regular+Season&LeagueId=00

parameters:
PlayerID
Season (YYYY-YY)
SeasonType: Regular+Season
LeagueID (default 0)


Traditional Box Score
http://stats.nba.com/stats/boxscoretraditionalv2?
"GameID is required; The StartPeriod property is required.; The EndPeriod property is required.; The StartRange property is required.; The EndRange property is required.; The RangeType property is required."
parameters:
GameID
QUARTER RANGE range is 0-14 14= 4 + 10 possible OTs, use RangeType 1 if using
StartPeriod: starting quarter (default use 0, start 0 to end 1 equal to 1 1, while 0/1 - 2 corresponds to 1st half )
EndPeriod (default use 0 if RangeType = 0 or 2 )

RANGE BY TIME  Input RangeType 2 to use, appears to be real time in deciseconds 0.1s, but attempting conversion seems to indicate it includes play stoppages)
StartRange (default 0 to ignore)
"The field StartRange must be between 0 and 2147483647."
EndRange (default 0)
RangeType (default 0, 0 seems to show full game, 1 flag for using StartPeriod and EndPeriod, 2 for use with StartRange and EndRange )

Fantasy bball basic counting stats box score + fantasy pts
https://stats.nba.com/stats/infographicfanduelplayer
parameters:
GameID

Play by play
https://stats.nba.com/stats/playbyplayv2
parameters:
GameID
StartPeriod
EndPeriod

OTHERS
all players
http://stats.nba.com/stats/commonallplayers?IsOnlyCurrentSeason=0&LeagueID=00&Season=2017-18
"LeagueID is required; Season is required; IsOnlyCurrentSeason is required"
parameters:
Season: year e.g. 2017-18
LeagueID (use 0)
IsOnlyCurrentSeason: only current players or all historical (1 or 0)

Winprobabilitypbp (maybe used for their site to calc win probability, shows home/away teams and team IDs, pts for each side )
http://stats.nba.com/stats/winprobabilitypbp
"GameID is required; Runtype is required"
parameters:
GameID
Runtype (not sure what this is, doesn't seem to do much, set at 0)

Misc stats (extra detailed box score stats)
https://stats.nba.com/stats/boxscoremiscv2

ex: https://stats.nba.com/stats/boxscoremiscv2?GameID=0021700480&startperiod=1&endperiod=2&startrange=1&endrange=4&rangetype=1

Four factors, has efg%, fta rate, team TO %, OReb % for team and opposing player 
https://stats.nba.com/stats/boxscorefourfactorsv2

Advanced stats
https://stats.nba.com/stats/boxscoreadvancedv2
same params as traditional box score

Scoring stats
https://stats.nba.com/stats/boxscorescoringv2
Same params as trad box score

Usage stats
https://stats.nba.com/stats/boxscoreusagev2
Same params as trad box score

Box score other analytics such as speed and distance, not sure units
https://stats.nba.com/stats/boxscoreplayertrackv2?gameid=0021700480
parameters:
GameID


test values
GameID=0021700480
?GameID=0021700480&StartPeriod=0&EndPeriod=0&StartRange=0&EndRange=0&RangeType=0

http://stats.nba.com/stats/teamdashboardbygeneralsplits
"SeasonType is required; TeamID is required; MeasureType is required; PerMode is required; PlusMinus is required; PaceAdjust is required; Rank is required; Season is required; The Outcome property is required.; The Location property is required.; Month is required; The SeasonSegment property is required.; The DateFrom property is required.; The DateTo property is required.; OpponentTeamID is required; The VsConference property is required.; The VsDivision property is required.; The GameSegment property is required.; Period is required; LastNGames is required"


custom dropdown icon source
https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_keyboard_arrow_down_48px-128.png 