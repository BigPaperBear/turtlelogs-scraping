(function(){
  const CLASS_MAP = {
    1: { name: "Warrior", specs: {1:"Arms", 2:"Fury", 3:"Protection"} },
    2: { name: "Paladin", specs: {1:"Holy", 2:"Protection", 3:"Retribution"} },
    3: { name: "Hunter",  specs: {1:"Beast Mastery", 2:"Marksmanship", 3:"Survival"} },
    4: { name: "Rogue",   specs: {1:"Assassination", 2:"Combat", 3:"Subtlety"} },
    5: { name: "Priest",  specs: {1:"Discipline", 2:"Holy", 3:"Shadow"} },
    7: { name: "Shaman",  specs: {1:"Elemental", 2:"Enhancement", 3:"Restoration"} },
    8: { name: "Mage",    specs: {1:"Arcane", 2:"Fire", 3:"Frost"} },
    9: { name: "Warlock", specs: {1:"Affliction", 2:"Demonology", 3:"Destruction"} },
    11:{ name: "Druid",   specs: {1:"Balance", 2:"Feral", 3:"Restoration"} },
  };

  function parseLocaleNumber(raw){
  if (raw == null) return NaN;
  let s = String(raw);

  // remove spaces & weird whitespace (NBSP, narrow NBSP, etc.)
  s = s.replace(/[\s\u00A0\u202F\u2007\u2009\u200A\u2060]+/g, "");

  // allow only numbers, signs, comma, dot
  s = s.replace(/[^0-9+,\.\-]/g, "");

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot && hasComma) {
    // e.g. "2,209.9" → drop commas
    s = s.replace(/,/g, "");
  } else if (!hasDot && hasComma) {
    // e.g. "2209,9" → treat comma as decimal
    s = s.replace(/,/g, ".");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

  function extractRows(){
    const bars = Array.from(document.querySelectorAll('.bar_container .bar, .bar'));
    const rows = [];
    for (const bar of bars) {
      try {
        const left = bar.querySelector('.bar_label_left');
        const right = bar.querySelector('.bar_label_right');
        const spansLeft = left ? Array.from(left.querySelectorAll('span')) : [];
        const rankText = spansLeft[0]?.textContent?.trim() ?? "";
        const nameText = spansLeft[1]?.textContent?.trim() ?? "";
        const rank = parseInt(rankText.replace(/\\D+/g, ""), 10);
        const rawValueText = right ? right.textContent.trim() : "";
        const value = parseLocaleNumber(rawValueText);
        if (!Number.isFinite(value)) continue;

        const icon = bar.querySelector('.icon');
        let bg = icon ? (icon.style?.backgroundImage || getComputedStyle(icon).backgroundImage || "") : "";
        const m = bg.match(/\/assets\/wow_hero_classes\/c(\d+)-(\d+)\.png/i);
        const classId = m ? parseInt(m[1], 10) : null;
        const specId  = m ? parseInt(m[2], 10) : null;

        const className = classId && CLASS_MAP[classId]?.name || (classId ? `Class ${classId}` : "Unknown");
        const specName  = (classId && specId && CLASS_MAP[classId]?.specs?.[specId]) || (specId ? `Spec ${specId}` : "Unknown");

        rows.push({ rank, name: nameText, value, classId, specId, className, specName });
      } catch {}
    }
    rows.sort((a,b)=>{
      const ar = Number.isFinite(a.rank) ? a.rank : Infinity;
      const br = Number.isFinite(b.rank) ? b.rank : Infinity;
      return ar - br;
    });
    return rows;
  }

  function average(nums){ return nums.length ? nums.reduce((s,x)=>s+x,0)/nums.length : 0; }

  function quantile(values, p){
    if (!values.length) return NaN;
    const v = values.slice().sort((a,b)=>a-b);
    const idx = (v.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return v[lo];
    const h = idx - lo;
    return v[lo]*(1-h) + v[hi]*h;
  }
  function median(nums){ return quantile(nums, 0.5); }

  function aggregate(rows, { percentile = 1.0 } = {}){
    let sample = rows;
    let threshold = null;

    if (percentile < 1) {
      const values = rows.map(r=>r.value);
      threshold = quantile(values, percentile);     // e.g. 0.95 → 95th percentile
      sample = rows.filter(r => r.value >= threshold); // top tail
    }

    const byClass = new Map();
    for (const r of sample) {
      const k = r.classId ?? "unknown";
      if (!byClass.has(k)) byClass.set(k, { classId: r.classId, className: r.className, values: [] });
      byClass.get(k).values.push(r.value);
    }
    const classAverages = Array.from(byClass.values()).map(x => ({
      classId: x.classId,
      className: x.className,
      count: x.values.length,
      avg: average(x.values),
      median: median(x.values)
    })).sort((a,b)=>b.avg - a.avg);

    const bySpec = new Map();
    for (const r of sample) {
      const k = `${r.classId ?? "u"}-${r.specId ?? "u"}`;
      if (!bySpec.has(k)) bySpec.set(k, { classId: r.classId, className: r.className, specId: r.specId, specName: r.specName, values: [] });
      bySpec.get(k).values.push(r.value);
    }
    const specAverages = Array.from(bySpec.values()).map(x => ({
      classId: x.classId,
      className: x.className,
      specId: x.specId,
      specName: x.specName,
      count: x.values.length,
      avg: average(x.values),
      median: median(x.values)
    })).sort((a,b)=>b.avg - a.avg);

    return { sampleSize: sample.length, total: rows.length, classAverages, specAverages, threshold };
  }

  // ===== Movable & Sortable Overlay =====
  function showOverlay({classAverages, specAverages, sampleSize, total, percentile, threshold}){
    // state for sorting
    const state = {
      classSort: { key: 'avg', dir: 'desc' }, // dir: 'asc' | 'desc' ; key: 'count' | 'avg' | 'median'
      specSort:  { key: 'avg', dir: 'desc' },
      classData: classAverages.slice(),
      specData:  specAverages.slice()
    };

    // base styles
    const container = document.createElement('div');
    container.className = 'turt-analytics-overlay';
    container.style.cssText = `
      position:fixed;top:12px;left:12px;z-index:999999;
      background:#111;color:#eee;font:12px/1.4 system-ui,Segoe UI,Arial;
      padding:0;border:1px solid #333;border-radius:10px;
      box-shadow:0 6px 24px rgba(0,0,0,.35);max-height:70vh;overflow:auto;max-width:760px
    `;

    // header (drag handle)
    const header = document.createElement('div');
    header.style.cssText = `
      padding:10px 12px;border-bottom:1px solid #333;border-radius:10px 10px 0 0;
      background:#0f0f0f;cursor:move;user-select:none;position:sticky;top:0
    `;
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-weight:600;flex:1">TurtLogs Analytics</div>
        <div style="opacity:.85;font-size:11px;white-space:nowrap">
          sample: ${sampleSize}/${total}
          ${percentile<1 ? ` • threshold (p=${(percentile*100).toFixed(1)}%): ${threshold?.toLocaleString?.() ?? threshold}` : ""}
        </div>
        <button title="Close" style="background:#222;color:#ddd;border:1px solid #444;border-radius:6px;padding:4px 8px;cursor:pointer">close</button>
      </div>
    `;
    const closeBtn = header.querySelector('button');
    closeBtn.onclick = () => container.remove();

    // drag logic
    (function makeDraggable(box, handle){
      let startX=0,startY=0,origLeft=0,origTop=0,dragging=false;
      function onDown(e){
        dragging = true;
        const ev = e.touches ? e.touches[0] : e;
        startX = ev.clientX; startY = ev.clientY;
        const rect = box.getBoundingClientRect();
        origLeft = rect.left; origTop = rect.top;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, {passive:false});
        document.addEventListener('touchend', onUp);
      }
      function onMove(e){
        if (!dragging) return;
        const ev = e.touches ? e.touches[0] : e;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        box.style.left = Math.max(0, origLeft + dx) + 'px';
        box.style.top  = Math.max(0, origTop  + dy) + 'px';
        box.style.right = 'auto';
      }
      function onUp(){
        dragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      }
      handle.addEventListener('mousedown', onDown);
      handle.addEventListener('touchstart', onDown, {passive:true});
    })(container, header);

    // content area
    const content = document.createElement('div');
    content.style.cssText = 'padding:12px 12px 8px';

    // helpers
    function sortData(arr, key, dir){
      const mul = dir === 'asc' ? 1 : -1;
      return arr.slice().sort((a,b)=>{
        const av = key==='avg' ? a.avg : key==='median' ? a.median : a.count;
        const bv = key==='avg' ? b.avg : key==='median' ? b.median : b.count;
        return (av - bv) * mul;
      });
    }
    function th(label, key, tableKey){
      const st = tableKey === 'class' ? state.classSort : state.specSort;
      const isActive = st.key === key;
      const arrow = isActive ? (st.dir === 'asc' ? '▲' : '▼') : '';
      return `<th data-key="${key}" data-table="${tableKey}" style="cursor:pointer;text-align:left;padding:4px 6px;border-bottom:1px solid #333;user-select:none">${label} ${arrow}</th>`;
    }
    function renderTables(){
      // apply current sorting
      const classSorted = sortData(state.classData, state.classSort.key, state.classSort.dir);
      const specSorted  = sortData(state.specData,  state.specSort.key,  state.specSort.dir);

      const classRows = classSorted.map(x=>`
        <tr>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${x.className ?? ''}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${x.count ?? ''}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${(Math.round(x.avg*100)/100).toLocaleString()}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${(Math.round(x.median*100)/100).toLocaleString()}</td>
        </tr>`).join('');

      const specRows = specSorted.map(x=>`
        <tr>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${x.className ?? ''}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${x.specName ?? ''}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${x.count ?? ''}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${(Math.round(x.avg*100)/100).toLocaleString()}</td>
          <td style="padding:4px 6px;border-bottom:1px dashed #2a2a2a">${(Math.round(x.median*100)/100).toLocaleString()}</td>
        </tr>`).join('');

      content.innerHTML = `
        <div style="font-weight:600;margin-top:4px">Class stats (thresholded if percentile set)</div>
        <table style="border-collapse:collapse;margin:8px 0 12px;width:100%">
          <thead>
            <tr>
              <th style="text-align:left;padding:4px 6px;border-bottom:1px solid #333">Class</th>
              ${th('count','count','class')}
              ${th('avg','avg','class')}
              ${th('median','median','class')}
            </tr>
          </thead>
          <tbody>${classRows}</tbody>
        </table>

        <div style="font-weight:600;margin-top:8px">Class + Spec stats (thresholded if percentile set)</div>
        <table style="border-collapse:collapse;margin:8px 0 12px;width:100%">
          <thead>
            <tr>
              <th style="text-align:left;padding:4px 6px;border-bottom:1px solid #333">Class</th>
              <th style="text-align:left;padding:4px 6px;border-bottom:1px solid #333">Spec</th>
              ${th('count','count','spec')}
              ${th('avg','avg','spec')}
              ${th('median','median','spec')}
            </tr>
          </thead>
          <tbody>${specRows}</tbody>
        </table>
      `;

      // bind sorting clicks
      content.querySelectorAll('th[data-key]').forEach(thEl=>{
        thEl.addEventListener('click', ()=>{
          const key = thEl.getAttribute('data-key');       // 'count' | 'avg' | 'median'
          const tableKey = thEl.getAttribute('data-table'); // 'class' | 'spec'
          const sortState = tableKey === 'class' ? state.classSort : state.specSort;

          if (sortState.key === key) {
            sortState.dir = (sortState.dir === 'desc') ? 'asc' : 'desc';
          } else {
            sortState.key = key;
            sortState.dir = 'desc';
          }
          renderTables(); // re-render with new arrows / order
        });
      });
    }

    // assemble UI
    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);

    // initial render
    renderTables();
  }

  window.analyzeTurtLogs = function(opts={}){
    const { percentile = 1.0 } = opts; // 1.0 = full sample; 0.95 = above 95th percentile (top 5%)
    const rows = extractRows();
    if (!rows.length) { console.warn("No data found."); return; }
    const result = aggregate(rows, { percentile });

    console.log(`Sample: ${result.sampleSize}/${result.total} | ${percentile<1 ? `threshold (p=${percentile}): ${result.threshold}` : "full sample"}`);
    console.log("Class averages/medians:");
    console.table(result.classAverages.map(x=>({classId:x.classId,className:x.className,count:x.count,avg:Math.round(x.avg*100)/100,median:Math.round(x.median*100)/100})));
    console.log("Class+Spec averages/medians:");
    console.table(result.specAverages.map(x=>({classId:x.classId,className:x.className,specId:x.specId,specName:x.specName,count:x.count,avg:Math.round(x.avg*100)/100,median:Math.round(x.median*100)/100})));

    showOverlay({ ...result, percentile });
    return result;
  };
})();
