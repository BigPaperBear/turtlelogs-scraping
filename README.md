# TurtleLogs Scraping

A simple browser-side script to scrape DPS rankings from [Turtle WoW Logs](https://www.turtlogs.com/pve/ranking), 
aggregate the results, and show analytics in a draggable/sortable overlay.

## Features
- Extracts class + spec DPS data from the ranking page
- Shows **average** and **median** DPS
- Filter by percentile (e.g. top 10% only)
- Draggable overlay with sortable tables (by count, avg, median)

## Usage
1. Open [turtlogs.com PvE ranking](https://www.turtlogs.com/pve/ranking).
2. Press **F12** to open Developer Tools → Console.
3. Copy the content of `turtlogs_scraping.median.js` and paste it into the console.
4. Run:
   ```js
   analyzeTurtLogs({ percentile: 1.0 })  // show all logs
   analyzeTurtLogs({ percentile: 0.90 }) // show top 10% players
   ```
5. A draggable analytics window will appear on the page.  
   You can sort the tables by clicking the column headers.  
6. Close the overlay any time with the **close button**.

## Example Output

### Class stats (all logs, no tanks)
```
Rogue     count 407  avg 1065.13  median 1071.5
Mage      count 505  avg 1067.56  median 1051.8
Paladin   count 227  avg 1000.61  median 1019.1
Warrior   count 712  avg 951.92   median 993.8
Warlock   count 346  avg 1010.59  median 986.4
Hunter    count 351  avg 926.47   median 927.8
Priest    count 92   avg 979.98   median 974.65
Shaman    count 236  avg 889.53   median 873.35
Druid     count 340  avg 753.75   median 739.05
```

### Class stats (top 10% only, threshold ~1356 DPS)
```
Priest   count 4   avg 1574.63  median 1573.05
Rogue    count 78  avg 1565.58  median 1504.15
Mage     count 61  avg 1539.99  median 1513.1
Druid    count 23  avg 1512.93  median 1500.1
Shaman   count 10  avg 1516.16  median 1481
Paladin  count 42  avg 1503.29  median 1447.1
Warrior  count 59  avg 1492.34  median 1475.9
Warlock  count 32  avg 1480.09  median 1458.15
Hunter   count 13  avg 1414.00  median 1402.5
```

## License
MIT
