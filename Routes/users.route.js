const express = require('express')
require('dotenv').config()
const jwt = require("jsonwebtoken")
const userRouter = express.Router()
const bcrypt = require('bcrypt')
const { UserModel } = require('../Models/user.model')

userRouter.post("/signup", async (req, res) => {
    const { userName, userEmail, userPassword } = req.body
    try{
        bcrypt.hash(userPassword,4,async(err,hash)=>{
            if(err){
                req.send(err.message)
            }else{
                const user=new UserModel({userName,userEmail,userPassword:hash})
                await user.save()
                res.status(200).send({"msg":"New user has been regitered Successfully"})
            }
        })
    } catch (error) {
        res.status(400).send({ "error": error.message })
    }
})

userRouter.post('/login', async (req, res) => {
    const { userEmail, userPassword } = req.body;
    try {
        const user = await UserModel.findOne({ userEmail:userEmail })
        if (user) {
          bcrypt.compare(userPassword, user.userPassword, (err, result) => {
            if (result) {
              let accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "100m" })
              res.status(200).send({
                "msg": "Login Succesfull", "AcessToken": accessToken,"username":user.userName
              })
            } else {
              res.status(400).send({ "msg": "Password is incorrect" })
            }
          })
        } else {
          res.status(404).send({ "msg": "Email does not exist" })
        }
      } catch (error) {
            res.status(500).send({
            "error": error.message
        })
    }
})

module.exports={
    userRouter
}