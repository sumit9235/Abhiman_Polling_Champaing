const mongoose= require('mongoose');
const userSchema = mongoose.Schema({
    userName: String,
    userEmail: String,
    userPassword: String,
    responses: [{
      pollId: String,
      questionId: String,
      answer: String
    }]
},{
    versionKey:false
})

const UserModel=mongoose.model("user",userSchema)

module.exports={
    UserModel
}
