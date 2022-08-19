const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');

const crypto = require('crypto');
const cloudinary = require('cloudinary');


// Register a User => /api/v1/register
const registerUser = catchAsyncErrors(async (req, res, next) => {
    
    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder : 'avatars',
        width: 150,
        crop: "scale"

    })


    const { name, email, password } = req.body;

    console.log(name, email, password, "Successfully Created")

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        }
    })

    sendToken(user, 200, res) 

})

// login user => /api/v1/login
const loginUser = catchAsyncErrors( async(req, res, next)=> {
    console.log(req.body)

    const { email, password } = req.body;


    //check if email and password is entered by user 
    if(!email || !password) {
        return next(new ErrorHandler('PLease Enter Email & password', 400))
    }

    //finding user in database 
    const user = await User.findOne({ email }).select('+password')


    if(!user) {
        return next(new ErrorHandler('invalid Email or password', 401));

    }

    // checks if password is correct or not 
     const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or password', 400));

    }

    sendToken(user, 200, res) 

})


//Get currently Logged in User Profile => /api/v1/me
const getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success : true,
        user
    })

})


//update / change Password => /api/v1/password/update
const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    console.log("user variable", user)
    // check previous user password 
    const isMatched = await user.comparePassword(req.body.oldPassword)
    
    console.log(isMatched)
    if(!isMatched) {
        return next(new ErrorHandler('old password is incorrect'), 401);

    }

    user.password = req.body.password
    await user.save()

    sendToken(user, 200, res)

}) 

//update user Profile => api/v1/me/update 
const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // update Avatar : TODO

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
       runValidators: true,
       useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })



})


//logout user => /api/v1/logout
const logoutUser = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'logged out'

    })

});


//Forgot Password => /api/v1/password/forgot
const forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });

    if(!user) {
        return next(new ErrorHandler('User not found with this email', 404));

    }

    // Get reset Token 
    const resetToken = user.getResetPasswordToken();
 
    await user.save({ validateBeforeSave: false})

    // create reset Password url 
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message = `your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it`

    try {

        await sendEmail({
            email: user.email,
            subject: 'shopIT password Recovery',
            message

        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch(error) {

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false});

        return next(new ErrorHandler(error.message, 500))


    }

})


//Reset Password => /api/v1/password/reset/:token
const resetPassword = catchAsyncErrors(async (req, res, next) => {

    //Hash URL Token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    //Query to the database
        //check resetPasswordExpire strored in the database
            //Ensure the date is greater than the current date 
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }  
        
    })

    if(!user) {
        return next(new ErrorHandler('password reset token is invalid or has been expired', 400))

    }

    if(req.body.password !== req.body.confirmPassword) {
            return next(new ErrorHandler('Password does not match', 400))
    }

    // Setup new Password 
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res)
})

// Admin Routes 

//Get All Users => /api/v1/admin/users
const allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success : true,
        users

    })
})

//Get user details => /api/v1/admin/user:id
const getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`User was not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success : true,
        user
    })

})


//update user Profile => api/v1/admin/user/:id - Admin
const updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })



})

//Delete user  => /api/v1/admin/user:id
const deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`User was not found with id: ${req.params.id}`))
    }

    //Remove avatar from Cloudinary - Todo

    await user.remove()

    res.status(200).json({
        success : true,
    })

})






module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updatePassword,
    updateProfile,
    logoutUser,
    forgotPassword,
    resetPassword,

    //Admin 
    allUsers,
    getUserDetails,
    updateUser,
    deleteUser
}

