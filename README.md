# TurtleLogs Scraping

A simple browser-side script to scrape DPS rankings from [Turtle WoW Logs](https://www.turtlogs.com/pve/ranking), 
aggregate the results, and show analytics in a draggable/sortable overlay.

## Features
- Extracts class + spec DPS data from the ranking page
- Shows avg and median DPS
- Filter by percentile (e.g. top 10% only)
- Draggable overlay with sortable tables

## Usage
1. Open [turtlogs.com PvE ranking](https://www.turtlogs.com/pve/ranking).
2. Press **F12** → Console.
3. Copy the content of `turtlogs_scraping.js` and paste it in the console.
4. Run:
   ```js
   analyzeTurtLogs({ percentile: 1.0 })  // all logs
   analyzeTurtLogs({ percentile: 0.90 }) // top 10% only
