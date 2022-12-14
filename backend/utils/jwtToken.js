// create and send token and save in the cookie 

const sendToken = (user, statusCode, res) => {

    //create jwt token
    const token = user.getJwtToken();

    //options for cookie 
    const options = {
        //CONVERT TO milliseconds
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly : true
    }

    res.status(statusCode).cookie('token', token, options).json({
        success : true,
        user,
        token
    })


}

module.exports = sendToken;
//http only cookie can only be accessed from the from the backend 
    //it cannot be accessed with any javascript code 

