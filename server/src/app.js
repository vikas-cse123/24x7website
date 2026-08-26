import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config/index.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.js'

const app = express()

app.use(cors({ origin: config.clientOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
