const express = require('express');
const cookieParser = require('cookie-parser');//to store json tokens in cookies
require('dotenv').config();//to use environment variables from .env file if env folder is different then write the path to env inthe config paranthesis 
const app= express();

const port = process.env.PORT || 3000;

//regular middlewares
app.use(express.json())//from req body we can get json data
app.use(express.urlencoded({extended:true}))//to parse url encoded data

//middlewares for cookies
app.use(cookieParser());//to parse cookies from request


const userRouter= require('./routes/userRoutes');
app.use('/api/auth',userRouter)
const notificationRouter= require('./routes/notificationRoutes');
app.use('/api/notification',notificationRouter)


app.get('/',(req,res)=>{
    res.send('This is Sensible Server!');
})

app.listen(port,()=>{
    console.log(`Sensible server is running on port ${port}`);
    
})