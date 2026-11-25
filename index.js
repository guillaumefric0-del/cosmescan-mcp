#!/usr/bin/env node
/**
 * CosmeScan Official MCP Server (stdio)
 * https://cosmescan.com | https://cosmescan.com/api-docs/
 *
 * Exposes 3 read-only tools backed by CosmeScan's public Edge API:
 *  - decode_batch_code: Decode production date, age, shelf life, PAO & clone risk for 2,375 brands
 *  - search_brands: Search supported luxury, dermo-cosmetic, niche & K-Beauty houses
 *  - get_brand_info: Fetch batch format, engraving location, PAO & EU recall info for a brand
 */

import { realpathSync } from 'fs';
import { pathToFileURL } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = process.env.COSMESCAN_API_BASE || 'https://cosmescan-vision.guillaumefric0.workers.dev';
const USER_AGENT = 'cosmescan-mcp/1.0.0 (+https://cosmescan.com)';

async function fetchCosmeScan(path, params = {}) {
  const url = new URL(path, API_BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      url.searchParams.set(k, String(v).trim());
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const errMsg = data?.error || data?.message || `HTTP ${res.status}`;
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ok: false,
              status: res.status,
              error: errMsg,
              retryAfter: res.headers.get('Retry-After') || undefined,
              docs: 'https://cosmescan.com/api-docs/',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function createServer() {
  const server = new McpServer({
    name: 'cosmescan-mcp',
    version: '1.0.0',
  });

  server.tool(
    'decode_batch_code',
    'Decode a cosmetic, skincare, K-Beauty, or perfume batch/lot code across 2,375 brands. Returns manufacturing date, age in months, unopened shelf life, freshness status, and counterfeit clone signal.',
    {
      brand: z
        .string()
        .min(1)
        .max(64)
        .describe('Brand slug (e.g. "dior", "chanel", "cerave", "guerlain") or exact brand name.'),
      code: z
        .string()
        .min(1)
        .max(32)
        .describe('Alphanumeric batch / lot code engraved or printed on the bottle or box (e.g. "4B01", "38Z401").'),
      lang: z
        .enum(['en', 'fr', 'es', 'de', 'it', 'pt', 'pl', 'ja', 'zh', 'ko', 'ru', 'ar'])
        .optional()
        .default('en')
        .describe('Optional output language for human-readable labels (defaults to "en").'),
    },
    async ({ brand, code, lang }) => {
      return fetchCosmeScan('/v1/decode', { brand, code, lang });
    }
  );

  server.tool(
    'search_brands',
    'Search CosmeScan\'s catalog of 2,375 verified cosmetic, skincare, K-Beauty, and perfume brands by name, slug, conglomerate (LVMH, L\'Oréal, Estée Lauder, Puig, Coty, Shiseido), or category.',
    {
      q: z
        .string()
        .max(64)
        .optional()
        .describe('Optional search query (brand name, conglomerate, or category, e.g. "dior", "lvmh", "k-beauty").'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(20)
        .describe('Maximum number of brands to return (1–50, default 20).'),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe('Pagination offset (default 0).'),
    },
    async ({ q, limit, offset }) => {
      return fetchCosmeScan('/v1/brands', { q, limit, offset });
    }
  );

  server.tool(
    'get_brand_info',
    'Get detailed metadata, batch code format example, engraving location, default PAO, decennial cycle info, and active EU Safety Gate / FDA recall records for a specific brand slug.',
    {
      id: z
        .string()
        .min(1)
        .max(64)
        .describe('Canonical brand slug (e.g. "dior", "chanel", "estee-lauder", "hawaiian-tropic").'),
    },
    async ({ id }) => {
      const safeId = encodeURIComponent(id.trim().toLowerCase());
      return fetchCosmeScan(`/v1/brands/${safeId}`);
    }
  );

  return server;
}

let isMain = false;
try {
  isMain = Boolean(process.argv[1]) && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
} catch {
  isMain = true;
}
if (isMain) {
  const server = createServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error('[cosmescan-mcp] Fatal error:', err);
    process.exit(1);
  });
}
