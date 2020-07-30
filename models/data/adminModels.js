const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

let adminSchema = new mongoose.Schema({
  username:String,
  email: {
    type: String,
    required: false,
    unique: true
  },
  password:{
    type: String,
    select: false
  },
role: {
    type: String,
    default: "Admin"
},
resetPasswordToken : String,
resetPasswordExpires : Date

})
adminSchema.plugin(passportLocalMongoose,{usernameField: 'username', emailField: 'email'});

module.exports = mongoose.model('Admin', adminSchema);