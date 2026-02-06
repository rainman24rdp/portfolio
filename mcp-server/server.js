import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { validate as uuidValidate } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.MCP_PORT || 3001;

// Initialize Supabase with service role key (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  methods: ['POST', 'GET'],
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: { code: -32000, message: 'Rate limit exceeded' } }
});
app.use(limiter);

// API Key authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: Invalid API key' },
      id: req.body?.id || null
    });
  }
  next();
};

// Audit logging
const auditLog = (tool, params, result, apiKey) => {
  const timestamp = new Date().toISOString();
  const keyPrefix = apiKey?.substring(0, 8) || 'unknown';
  console.log(`[${timestamp}] AUDIT: ${tool} | key:${keyPrefix}... | params:${JSON.stringify(params)} | success:${!result.error}`);
};

// =============================================================================
// MCP TOOLS DEFINITION
// =============================================================================

const tools = {
  // List all photos with optional filtering
  list_photos: {
    description: 'List all photos in the portfolio with optional category filter',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category (optional)' },
        limit: { type: 'number', description: 'Maximum number of photos to return (default: 50)' },
        offset: { type: 'number', description: 'Number of photos to skip (default: 0)' }
      }
    },
    handler: async (params) => {
      let query = supabase
        .from('photos')
        .select('id, title, category, labels, url, created_at, captured_at, camera, lens')
        .order('created_at', { ascending: false });

      if (params.category) {
        query = query.eq('category', params.category);
      }

      const limit = Math.min(params.limit || 50, 100);
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      return {
        photos: data,
        count: data.length,
        offset,
        limit
      };
    }
  },

  // Get a single photo by ID
  get_photo: {
    description: 'Get detailed information about a specific photo by ID',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The photo UUID' }
      },
      required: ['id']
    },
    handler: async (params) => {
      if (!params.id || !uuidValidate(params.id)) {
        throw new Error('Invalid photo ID format');
      }

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Photo not found');

      return { photo: data };
    }
  },

  // Update a photo's metadata
  update_photo: {
    description: 'Update a photo\'s title, category, or labels',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The photo UUID' },
        title: { type: 'string', description: 'New title for the photo' },
        category: { type: 'string', description: 'New category for the photo' },
        labels: { type: 'array', items: { type: 'string' }, description: 'New labels array' }
      },
      required: ['id']
    },
    handler: async (params) => {
      if (!params.id || !uuidValidate(params.id)) {
        throw new Error('Invalid photo ID format');
      }

      // Build update object with only provided fields
      const updates = {};
      if (params.title !== undefined) {
        updates.title = sanitizeString(params.title, 200);
      }
      if (params.category !== undefined) {
        updates.category = sanitizeString(params.category, 50);
      }
      if (params.labels !== undefined) {
        if (!Array.isArray(params.labels)) {
          throw new Error('Labels must be an array');
        }
        updates.labels = params.labels.slice(0, 10).map(l => sanitizeString(l, 30));
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No fields to update');
      }

      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return {
        message: 'Photo updated successfully',
        photo: data
      };
    }
  },

  // Delete a photo
  delete_photo: {
    description: 'Delete a photo by ID (requires confirmation)',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The photo UUID' },
        confirm: { type: 'boolean', description: 'Must be true to confirm deletion' }
      },
      required: ['id', 'confirm']
    },
    handler: async (params) => {
      if (!params.id || !uuidValidate(params.id)) {
        throw new Error('Invalid photo ID format');
      }

      if (params.confirm !== true) {
        throw new Error('Deletion requires confirm: true');
      }

      // First get the photo to retrieve storage path
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('url, title')
        .eq('id', params.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (!photo) throw new Error('Photo not found');

      // Delete from database
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', params.id);

      if (deleteError) throw new Error(deleteError.message);

      // Attempt to delete from storage (extract path from URL)
      try {
        const urlPath = new URL(photo.url).pathname;
        const storagePath = urlPath.split('/photos/')[1];
        if (storagePath) {
          await supabase.storage.from('photos').remove([storagePath]);
        }
      } catch (storageError) {
        console.warn('Could not delete storage file:', storageError.message);
      }

      return {
        message: `Photo "${photo.title}" deleted successfully`,
        deleted_id: params.id
      };
    }
  },

  // Get categories
  get_categories: {
    description: 'Get all unique photo categories',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('category');

      if (error) throw new Error(error.message);

      const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
      return { categories };
    }
  },

  // Search photos
  search_photos: {
    description: 'Search photos by title or labels',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Maximum results (default: 20)' }
      },
      required: ['query']
    },
    handler: async (params) => {
      if (!params.query || params.query.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      const searchTerm = sanitizeString(params.query, 100);
      const limit = Math.min(params.limit || 20, 50);

      const { data, error } = await supabase
        .from('photos')
        .select('id, title, category, labels, url, created_at')
        .or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw new Error(error.message);

      // Also search in labels (Supabase text search on arrays)
      const labelMatches = data.filter(p =>
        p.labels?.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return {
        results: data,
        count: data.length,
        query: searchTerm
      };
    }
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

// =============================================================================
// MCP PROTOCOL ENDPOINTS
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'portfolio-mcp', version: '1.0.0' });
});

// List available tools (MCP discovery)
app.get('/tools', authenticate, (req, res) => {
  const toolList = Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: tool.parameters
  }));
  res.json({ tools: toolList });
});

// JSON-RPC 2.0 endpoint
app.post('/rpc', authenticate, async (req, res) => {
  const { jsonrpc, method, params, id } = req.body;
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  // Validate JSON-RPC format
  if (jsonrpc !== '2.0') {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      id
    });
  }

  // Check if tool exists
  const tool = tools[method];
  if (!tool) {
    const result = {
      jsonrpc: '2.0',
      error: { code: -32601, message: `Method not found: ${method}` },
      id
    };
    auditLog(method, params, result, apiKey);
    return res.json(result);
  }

  // Execute tool
  try {
    const result = await tool.handler(params || {});
    const response = {
      jsonrpc: '2.0',
      result,
      id
    };
    auditLog(method, params, response, apiKey);
    return res.json(response);
  } catch (error) {
    const response = {
      jsonrpc: '2.0',
      error: { code: -32000, message: error.message },
      id
    };
    auditLog(method, params, response, apiKey);
    return res.json(response);
  }
});

// MCP-style tool call endpoint (alternative format)
app.post('/tools/:toolName', authenticate, async (req, res) => {
  const { toolName } = req.params;
  const params = req.body;
  const apiKey = req.headers['x-api-key'];

  const tool = tools[toolName];
  if (!tool) {
    return res.status(404).json({ error: `Tool not found: ${toolName}` });
  }

  try {
    const result = await tool.handler(params);
    auditLog(toolName, params, { result }, apiKey);
    res.json(result);
  } catch (error) {
    auditLog(toolName, params, { error: error.message }, apiKey);
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          Portfolio MCP Server v1.0.0                       ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    GET  /health     - Health check                         ║
║    GET  /tools      - List available tools                 ║
║    POST /rpc        - JSON-RPC 2.0 endpoint                ║
║    POST /tools/:name - Direct tool invocation              ║
╠════════════════════════════════════════════════════════════╣
║  Available Tools:                                          ║
║    - list_photos    - List all photos                      ║
║    - get_photo      - Get photo by ID                      ║
║    - update_photo   - Update photo metadata                ║
║    - delete_photo   - Delete a photo                       ║
║    - get_categories - Get all categories                   ║
║    - search_photos  - Search by title/labels               ║
╚════════════════════════════════════════════════════════════╝

  Server running on port ${PORT}
  `);
});

export default app;
