# Portfolio MCP Server

A Model Context Protocol (MCP) server for managing portfolio photos via AI chat agents.

## Features

- **JSON-RPC 2.0** compliant endpoint
- **Photo Management**: List, search, update, and delete photos
- **Security**: API key authentication, rate limiting, input validation
- **Audit Logging**: All operations are logged with timestamps

## Available Tools

| Tool | Description |
|------|-------------|
| `list_photos` | List all photos with optional category filter |
| `get_photo` | Get detailed info about a specific photo |
| `update_photo` | Update a photo's title, category, or labels |
| `delete_photo` | Delete a photo (requires confirmation) |
| `get_categories` | Get all unique photo categories |
| `search_photos` | Search photos by title or labels |

## Setup

1. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

## API Usage

### Authentication

All requests require an API key in the header:

```
X-API-Key: your-api-key-here
```

or

```
Authorization: Bearer your-api-key-here
```

### Endpoints

#### Health Check
```
GET /health
```

#### List Tools
```
GET /tools
```

#### JSON-RPC 2.0 (Recommended)
```
POST /rpc
Content-Type: application/json
X-API-Key: your-api-key

{
  "jsonrpc": "2.0",
  "method": "list_photos",
  "params": { "category": "Landscape", "limit": 10 },
  "id": 1
}
```

#### Direct Tool Call
```
POST /tools/list_photos
Content-Type: application/json
X-API-Key: your-api-key

{ "category": "Landscape", "limit": 10 }
```

## Example Requests

### List Photos
```bash
curl -X POST http://localhost:3001/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "list_photos",
    "params": { "limit": 5 },
    "id": 1
  }'
```

### Update Photo
```bash
curl -X POST http://localhost:3001/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "update_photo",
    "params": {
      "id": "photo-uuid-here",
      "title": "New Title",
      "category": "Nature"
    },
    "id": 2
  }'
```

### Delete Photo
```bash
curl -X POST http://localhost:3001/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "delete_photo",
    "params": {
      "id": "photo-uuid-here",
      "confirm": true
    },
    "id": 3
  }'
```

## Integration with Moltbot/OpenClaw

To connect this MCP server to Moltbot:

1. Deploy the server (Vercel, Railway, or any Node.js host)
2. In Moltbot, add your MCP server endpoint:
   - Server URL: `https://your-server.com/rpc`
   - API Key: Your generated MCP_API_KEY
3. The agent will auto-discover available tools via `/tools`

## Security Considerations

- **API Key**: Generate a strong, random key (32+ characters)
- **Service Role Key**: Never expose this client-side
- **Rate Limiting**: 60 requests/minute by default
- **Input Validation**: All inputs are sanitized
- **Audit Logging**: All operations are logged

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Max response items | 100 |
| Max labels per photo | 10 |
| Max title length | 200 chars |
| Max category length | 50 chars |
