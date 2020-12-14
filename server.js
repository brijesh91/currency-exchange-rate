const express =  require('express')
const dotenv  = require("dotenv")
const colors = require('colors')
const connectDB = require('./config/db')

// Loading environment variables
dotenv.config({ path: './config/config.env' })

// Load database
connectDB()

// Load routes
const ratesRouter = require("./routes/rates")

// Create express application
const app = express()

// Body parser
app.use(express.json())

// Register rates router
app.use(ratesRouter)

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send('Hello from Express')
})

const server = app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`.yellow.bold))

// Custom handler for unhandled promise rejection
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red)
    // Close the server & exit process
    server.close(() => process.exit(1))
})