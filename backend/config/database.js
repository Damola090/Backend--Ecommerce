const mongoose = require('mongoose')

const connectDatabase = () => {
    mongoose.connect(process.env.DB_LOCAL_URI, {
        useNewUrlParser : true,
        //useCreateIndex : true,
        useUnifiedTopology : true
        

    }).then((con)=> {
         console.log(`mongoDB Database connected with Host ${con.connection.host}`)

    })
    
}

module.exports = connectDatabase