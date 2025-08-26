# TurtleLogs Scraping

A simple browser-side script to scrape DPS rankings from [Turtle WoW Logs](https://www.turtlogs.com/pve/ranking), 
aggregate the results, and show analytics in a draggable/sortable overlay or as a Chrome extension popup with a tier list.

## Features
- Extracts class + spec DPS data from the ranking page
- Shows **average** and **median** DPS
- Filter by percentile (e.g. top 10% only)
- Draggable overlay with sortable tables (by count, avg, median)
- (Extension) Tier list popup with Popularity / Avg / Median / Combined metrics

## Option A — Quick use (console script)
1. Open [turtlogs.com PvE ranking](https://www.turtlogs.com/pve/ranking).
2. Press **F12** to open Developer Tools → Console.
3. Copy the content of `turtlogs_scraping.js` and paste it into the console.
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

# Option B — Chrome extension (plugin)

Analyze rankings without touching the console. The popup builds a **tier list (S → D)** right from the rankings page and supports filtering by percentile and multiple metrics.

## Install (Chrome/Edge/Brave)
1. **Download / clone** this repo.
2. Open `chrome://extensions` → toggle **Developer mode** (top-right).
3. Click **Load unpacked** → select the `turtlogs-analyzer-extension` folder (the one containing `manifest.json`).
4. You should see **TurtLogs Analyzer** appear in the list.

## Use
1. Open **[turtlogs.com PvE ranking](https://www.turtlogs.com/pve/ranking)** and wait until the page finishes loading.
2. Click the **TurtLogs Analyzer** toolbar icon to open the popup.
3. In the popup:
   - **Percentile (%)** — filter to the top X% of logs (e.g., `25` = top 25%).  
   - **Metric** — choose how to rank specs:
     - **Popularity** = share of logs for each spec in the filtered sample.  
       > Computed as `count / Σ count` for the current percentile filter.
     - **Throughput (Avg)** = ranks by average DPS.
     - **Throughput (Med)** = ranks by median DPS.
     - **Combined** = weighted blend of Popularity + Median (adjust weights).
   - If **Combined** is selected, set **Pop** and **Med** weights.
4. Click **Build**.  
   - The popup shows a **collapsible tier list**.  
   - Each tier header shows how many specs landed in that tier.  
   - Pills display the spec and a context label (e.g., `% share`, `avg`, or `median` depending on metric).

> Note: The on-page draggable overlay is still available via the console script (Option A). The extension popup is a separate, self-contained view.

## Files the extension loads
- `manifest.json` — extension config & permissions  
- `turtlogs_scraping.js` — scrapes & aggregates the visible ranking rows  
- `bridge.js` — connects the popup to the content script on the page  
- `popup.html` / `popup.js` — the popup UI (tier list, controls)

## Permissions
- **Host**: `https://turtlogs.com/*` and `https://www.turtlogs.com/*`  
- **Active Tab/Scripting**: to run the scraper on the currently open rankings page

## Troubleshooting
- **“No response (is the site loaded and content script injected?)”**  
  - Make sure you’re on a **turtlogs.com PvE ranking** page.  
  - Refresh the page after installing/updating the extension.  
  - Wait for the ranking bars to render, then click **Build** again.
- **“The message port closed before a response was received.”**  
  - Usually a timing issue. Refresh the page and re-open the popup.
- **Numbers don’t match expectations**  
  - Check the **Percentile** and **Metric** selected.  
  - Remember: **Popularity** uses pure **count share** in the **filtered** sample.
- **Popup too tall / scrollbars**  
  - The popup CSS is trimmed for a 600×600 window. Collapse tiers you don’t need.

## Uninstall / Update
- To update: pull latest files and click **⟳ Reload** on the extension in `chrome://extensions`.  
- To uninstall: click **Remove** in `chrome://extensions`.

## License
MIT
