/*
Concurrent Mess subscription stress test
Usage:
  node scripts/stress-mess-subscriptions.js --base=http://localhost:4000 --messId=... --concurrency=50 --requests=200 --tokens=./tokens.json

tokens.json should be a JSON array of bearer tokens: ["token1","token2", ...]
Or set env TOKEN_LIST as comma-separated tokens.

This script will POST to /api/mess/:id/subscribe concurrently and report results.
*/

const axios = require('axios');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('base', { type: 'string', demandOption: true })
  .option('messId', { type: 'string', demandOption: true })
  .option('concurrency', { type: 'number', default: 20 })
  .option('requests', { type: 'number', default: 200 })
  .option('tokens', { type: 'string', default: '' })
  .argv;

const BASE = argv.base.replace(/\/$/, '');
const MESS_ID = argv.messId;
const CONCURRENCY = Math.max(1, argv.concurrency);
const TOTAL = Math.max(1, argv.requests);

let tokens = [];
if (argv.tokens) {
  try {
    const raw = fs.readFileSync(argv.tokens, 'utf8');
    tokens = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tokens file:', e.message);
    process.exit(1);
  }
} else if (process.env.TOKEN_LIST) {
  tokens = process.env.TOKEN_LIST.split(',').map(t => t.trim()).filter(Boolean);
}

if (!tokens.length) {
  console.error('No tokens provided. Provide a tokens file or TOKEN_LIST env var.');
  process.exit(1);
}

const endpoint = `${BASE}/api/mess/${MESS_ID}/subscribe`;
console.log('Stress test config:', { endpoint, CONCURRENCY, TOTAL, tokens: tokens.length });

const stats = { success: 0, clientError: 0, serverError: 0, other: 0, details: {} };

function pickToken(i) {
  return tokens[i % tokens.length];
}

async function doRequest(i) {
  const token = pickToken(i);
  try {
    const res = await axios.post(endpoint, {
      plan: 'monthly-all',
      startDate: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000
    });
    stats.success += 1;
    stats.details[i] = { status: res.status, data: res.data };
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status >= 400 && status < 500) stats.clientError += 1;
      else if (status >= 500) stats.serverError += 1;
      else stats.other += 1;
      stats.details[i] = { status, data: err.response.data };
    } else {
      stats.other += 1;
      stats.details[i] = { error: err.message };
    }
  }
}

async function run() {
  const start = Date.now();
  let inFlight = 0;
  let launched = 0;

  return new Promise((resolve) => {
    function launchNext() {
      while (inFlight < CONCURRENCY && launched < TOTAL) {
        const idx = launched;
        launched += 1;
        inFlight += 1;
        doRequest(idx).finally(() => {
          inFlight -= 1;
          if (launched < TOTAL) launchNext();
          else if (inFlight === 0) resolve();
        });
      }
    }
    launchNext();
  }).then(() => {
    const end = Date.now();
    console.log('Test complete. Time (ms):', end - start);
    console.log('Stats:', {
      total: TOTAL,
      success: stats.success,
      clientError: stats.clientError,
      serverError: stats.serverError,
      other: stats.other
    });
    // dump a summary of first 20 details to a file
    const summary = Object.fromEntries(Object.entries(stats.details).slice(0, 20));
    fs.writeFileSync('stress-mess-summary.json', JSON.stringify({ stats: { total: TOTAL, ...stats }, sample: summary }, null, 2));
    console.log('Wrote stress-mess-summary.json (first 20 responses)');
  });
}

run().catch(e => {
  console.error('Run error:', e);
  process.exit(1);
});
