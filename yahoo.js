// netlify/functions/yahoo.js (simple fetch)
exports.handler = async function(event, context){
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const p = event.queryStringParameters || {};
  try{
    if(p.type === 'quote'){
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(p.symbols||'AAPL')}`;
      const r = await fetch(url); const j = await r.json();
      return { statusCode: 200, headers: {...headers, 'Content-Type':'application/json'}, body: JSON.stringify({result: j?.quoteResponse?.result||[]}) };
    }
    if(p.type === 'history'){
      const from = p.from || '2025-08-01';
      const p1 = Math.floor(new Date(from).getTime()/1000); const p2 = Math.floor(Date.now()/1000);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(p.symbol||'AAPL')}?period1=${p1}&period2=${p2}&interval=1d&events=div%2Csplit`;
      const r = await fetch(url); const j = await r.json();
      const c = j?.chart?.result?.[0]; const ts=c?.timestamp||[]; const q=c?.indicators?.quote?.[0]||{}; const rows=[];
      for(let i=0;i<ts.length;i++){ const date=new Date(ts[i]*1000).toISOString().slice(0,10);
        const row={date, symbol:p.symbol||'AAPL', open:q.open?.[i]??null, high:q.high?.[i]??null, low:q.low?.[i]??null, close:q.close?.[i]??null, volume:q.volume?.[i]??null, notes:'yahoo-history'};
        if(row.close!=null) rows.push(row);
      }
      return { statusCode: 200, headers: {...headers, 'Content-Type':'application/json'}, body: JSON.stringify({rows}) };
    }
    return { statusCode: 400, headers, body: JSON.stringify({error:'missing type'}) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({error:'server error '+(e&&e.message||e)}) };
  }
};
