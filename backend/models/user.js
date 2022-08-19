const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');




const userSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please Enter Your Name'],
        maxlength: [30, 'Your Name cannot 30 Characters']
    }, 
    email: {
        type: String,
        required: [true, 'Please Enter your Email'],
        unique: true,
        validate: [validator.isEmail, 'Please Valid Email Address']

    },
    password: {
        type: String,
        required: [true, 'PLease Enter Your Password'],
        minlength: [6, 'Your Password must be longer than 6 characters'],
        select: false

    },
    avatar: {
        public_id : {
            type : String,
            required : true,
        },
        url : {
            type: String,
            required: true
        }

    },
    role : {
        type: String,
        default: 'user'
    }, 
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date



})

//Encrypting Password before saving user 
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        next()
    }

    this.password = await bcrypt.hash(this.password, 10);

})

//compare user Password 
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}


//Return JWT Token 
userSchema.methods.getJwtToken = function() {
    return jwt.sign({ id : this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });

}

//Generate Password Reset Token 
userSchema.methods.getResetPasswordToken = function () {
    
    //Generate Token 
    const resetToken = crypto.randomBytes(20).toString('hex');

    //Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    //set Token Expire Time - After 30 mins
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

    return resetToken

}

module.exports = mongoose.model('User', userSchema)

