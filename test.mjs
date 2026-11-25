import { spawn } from 'child_process';
import assert from 'assert';

const proc = spawn(process.execPath, ['index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
const responses = new Map();

proc.stdout.on('data', (chunk) => {
  buf += chunk.toString('utf8');
  const lines = buf.split('\n');
  buf = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined) responses.set(msg.id, msg);
  }
});

function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

async function waitFor(id, timeoutMs = 15000) {
  const start = Date.now();
  while (!responses.has(id)) {
    if (Date.now() - start > timeoutMs) throw new Error(`Timeout waiting for response id=${id}`);
    await new Promise((r) => setTimeout(r, 50));
  }
  return responses.get(id);
}

try {
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'cosmescan-mcp-test', version: '1.0.0' },
    },
  });
  const initRes = await waitFor(1);
  assert.strictEqual(initRes.result?.serverInfo?.name, 'cosmescan-mcp');

  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const listRes = await waitFor(2);
  const toolNames = (listRes.result?.tools || []).map((t) => t.name).sort();
  assert.deepStrictEqual(toolNames, ['decode_batch_code', 'get_brand_info', 'search_brands']);

  send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'decode_batch_code', arguments: { brand: 'dior', code: '4B01', lang: 'en' } },
  });
  const callRes = await waitFor(3);
  assert.ok(!callRes.result?.isError, `Tool call returned error: ${JSON.stringify(callRes)}`);
  const payload = JSON.parse(callRes.result.content[0].text);
  assert.ok(payload.brand || payload.productionDate || payload.ok, `Unexpected payload: ${JSON.stringify(payload)}`);

  console.log('PASS: initialize, tools/list (3 tools), and live decode_batch_code (dior/4B01) succeeded!');
} finally {
  proc.kill();
}
