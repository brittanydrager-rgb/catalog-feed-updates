import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { v4 as uuid } from 'uuid'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'

import { db } from './db.js'
import { typeDefs } from './schema.js'
import { resolvers } from './resolvers.js'
import { seedMappings } from './columnMappings.js'
import { processFeedSync } from './pipeline/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Seed Kroger mappings on startup
seedMappings('703')

// --- Express setup ---
const app = express()
const PORT = 4000

// CORS for frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4000'],
  credentials: true,
}))

// --- Multer for file upload ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are supported'))
    }
  },
})

// --- REST: File Upload endpoint ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const retailerId = (req.body.retailerId as string) || '703'
    const uploadId = uuid()

    // Create upload record
    db.prepare(`
      INSERT INTO feed_uploads (upload_id, retailer_id, file_name, file_format, file_size_bytes, file_url, status)
      VALUES (?, ?, ?, 'csv', ?, ?, 'pending')
    `).run(uploadId, retailerId, file.originalname, file.size, file.path)

    console.log(`[upload] Created upload ${uploadId} for file ${file.originalname} (${file.size} bytes)`)

    // Run the pipeline (async for PLS API calls)
    await processFeedSync(uploadId, file.path, retailerId)

    // Return result
    const result = db.prepare('SELECT * FROM feed_uploads WHERE upload_id = ?').get(uploadId) as Record<string, unknown>

    // Also get the diff_id for convenience
    const diff = db.prepare(
      'SELECT diff_id FROM feed_diffs WHERE upload_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(uploadId) as { diff_id: string } | undefined

    res.json({
      uploadId,
      status: result.status,
      totalRows: result.total_rows,
      validRows: result.valid_rows,
      invalidRows: result.invalid_rows,
      rejectionReason: result.rejection_reason,
      diffId: diff?.diff_id || null,
      processedAt: result.processed_at,
    })
  } catch (error) {
    console.error('[upload] Error:', error)
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: message })
  }
})

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// --- Apollo Server (GraphQL) ---
async function startServer() {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  })

  await apollo.start()

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apollo, {
      context: async () => ({}),
    })
  )

  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`  Catalog Feed Server running on port ${PORT}`)
    console.log(`  REST upload: POST http://localhost:${PORT}/api/upload`)
    console.log(`  GraphQL:     http://localhost:${PORT}/graphql`)
    console.log(`  Health:      http://localhost:${PORT}/api/health`)
    console.log(`${'='.repeat(60)}\n`)
  })
}

startServer().catch(console.error)
