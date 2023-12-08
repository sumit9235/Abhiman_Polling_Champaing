const express= require('express')
require('dotenv').config()
const cors=require('cors')
const { connection } = require('./Config/db')
const { userRouter } = require('./Routes/users.route')
const { authenticate } = require('./Middleware/auth.middleware')
const { pollRouter } = require('./Routes/polls.route')
const app=express()
app.use(cors())
app.use(express.json())
app.get("/",(req,res)=>{
  res.status(200).send("Welcome to Polling management system")
})
app.use("/users",userRouter)
app.use(authenticate)
app.use("/poll",pollRouter)



const PORT=process.env.PORT||5500
app.listen(PORT,async()=>{
    try {
        await connection
        console.log("Connected to MongoDB Database")
    } catch (error) {
        console.log(error.message)
    }
    console.log(`Connected to server on port ${PORT}`)
})