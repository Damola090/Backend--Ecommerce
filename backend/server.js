const app = require('./app.js')
const dotenv = require('dotenv')
const connectDatabase = require('./config/database')
const cloudinary = require('cloudinary')

//Handle Uncaught Exception
process.on('uncaughtException', err => {
    console.log(`ERROR : ${err.message}`);
    console.log(`shutting Down due to Uncaught Exception`);
    process.exit(1)
})

//settings for enviroment variables 
dotenv.config( { path : 'backend/config/config.env'} )

//connecting to database
connectDatabase();


//setting up Cloudinary Configuration 
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

const server = app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`)
})
 

//handle Unhandled Promise Rejections
process.on('unhandledRejection', (err)=> {
    console.log(`ERROR : ${err.stack}`);
    console.log("Shutting down the server due to Unhandled promise Rejection")

    server.close(()=> {
        process.exit(1)
    })
})
