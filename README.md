# CosmeScan MCP Server (`cosmescan-mcp`)

Official **Model Context Protocol (MCP)** server for [CosmeScan](https://cosmescan.com) — decode cosmetic, skincare, K-Beauty, and luxury perfume **batch codes**, verify **manufacturing dates & PAO freshness**, check **cloned counterfeit lots**, and inspect **EU Safety Gate / FDA recalls** across **2,375 verified beauty brands** directly from Claude Desktop, Cursor, Windsurf, VS Code, or any MCP-compatible AI agent.

- **Web App (12 languages):** https://cosmescan.com
- **Public REST API Docs:** https://cosmescan.com/api-docs/
- **2026 Counterfeit & Recall Observatory:** https://cosmescan.com/observatory-2026/
- **No API key required** (free public read-only Edge API, fair-use rate limits: 6 req/min, 30 req/hour per IP).

---

## Available Tools

| Tool | Description | Example Inputs |
| :--- | :--- | :--- |
| **`decode_batch_code`** | Decodes a batch/lot code into manufacturing date, age in months, unopened shelf life, freshness status, and cloned-lot counterfeit risk. | `brand: "dior"`, `code: "4B01"`, `lang: "en"` |
| **`search_brands`** | Searches 2,375 supported cosmetic, skincare, K-Beauty & perfume houses by name, conglomerate (`LVMH`, `L'Oréal`, `Estée Lauder`, `Puig`, `Coty`, `Shiseido`), or category. | `q: "guerlain"`, `limit: 10` |
| **`get_brand_info`** | Returns batch code format example, bottle/box engraving location, default PAO, decennial cycle flag, and active EU/FDA safety recalls for a brand slug. | `id: "chanel"` |

---

## Quick Start

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "cosmescan": {
      "command": "npx",
      "args": ["-y", "cosmescan-mcp"]
    }
  }
}
```

### Cursor / Windsurf / VS Code
Add `cosmescan` to your `.cursor/mcp.json` or MCP settings:
```json
{
  "mcpServers": {
    "cosmescan": {
      "command": "npx",
      "args": ["-y", "cosmescan-mcp"]
    }
  }
}
```

### Example Prompts
- *"Decode Dior batch code `6B01` and tell me if the bottle is fresh."*
- *"Search all Estée Lauder brands supported by CosmeScan."*
- *"Where do I find the batch code on a Chanel perfume bottle, and are there any active EU recalls?"*

---

## Privacy & Fair Use
- **Zero tracking, zero API keys, zero personal data collected.**
- Backed by CosmeScan's deterministic Edge decoder (`https://cosmescan-vision.guillaumefric0.workers.dev/v1/*`) — see [Methodology](https://cosmescan.com/methodology/) and [Privacy Policy](https://cosmescan.com/privacy/).

## License
MIT © [CosmeScan](https://cosmescan.com)
