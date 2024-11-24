import express from "express"
import dotenv from "dotenv"
import router from "./src/routes/index.routes"
import cors from "cors"

const app = express()
const port = 3000

app.use(cors()) // Add this line to allow all origins
app.use(express.json())

app.use('', router)

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})