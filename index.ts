import express, { Request, Response } from "express"
import dotenv from "dotenv"
import { createServer } from "http"
import router from "./src/routes/index.routes"
import cors from "cors"
import { initializeSocket } from "./src/socket/socketServer"
import prisma from "./src/database/prisma"
import { errorHandler } from "./src/middleware/error.middleware"

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const port = process.env.PORT || 3000

// Configure CORS to allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))

app.use(express.json({ limit: '10mb' })) // Increased limit for profile pictures
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Default route - server status
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'VibeVault Server is running! 🚀',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.use('', router)

// Error handling middleware (must be after routes)
app.use(errorHandler)

// Initialize Socket.IO
const io = initializeSocket(server)

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    server.listen(port, () => {
      console.log(`🚀 VibeVault Server running on port ${port}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🌐 API Base URL: http://localhost:${port}`)
      console.log(`🔌 WebSocket Server initialized`)
    })
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    console.error('🔄 Retrying in 5 seconds...')
    setTimeout(startServer, 5000)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

startServer()