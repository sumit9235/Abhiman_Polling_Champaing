const jwt=require('jsonwebtoken')
require('dotenv').config()
const authenticate = (req,res,next)=>{
    const token=req.headers.authorization
    if(token){
        jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
            if(decoded){
                req.body.userid=decoded.id
                next()
            }else{
                res.send({"msg":"Please login first","error":err.message})
            }
        })
    }else{
        res.send({"msg":"Authorization failed"})
    }
}
module.exports={authenticate}