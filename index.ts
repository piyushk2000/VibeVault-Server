import express from "express"
import dotenv from "dotenv"
import { createServer } from "http"
import router from "./src/routes/index.routes"
import cors from "cors"
import { initializeSocket } from "./src/socket/socketServer"

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '10mb' })) // Increased limit for profile pictures
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('', router)

// Initialize Socket.IO
const io = initializeSocket(server)

server.listen(port, () => {
  console.log(`🚀 VibeVault Server running on port ${port}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 API Base URL: http://localhost:${port}`)
  console.log(`🔌 WebSocket Server initialized`)
})