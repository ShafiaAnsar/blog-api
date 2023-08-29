const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const connectdb= require("./db")

app.use(cors());
app.use(express.json());

app.post('/register',(req,res)=>{
    const {username,email,password} = req.body
    console.log('Received registration request:', req.body);

    res.status(200).json({ requestData:{username,email,password} });

})
connectdb()
app.listen(4000,()=>{
    console.log('App is running at port 4000')
})
// mooongodb:
// password:t8jhVJGZKQzAvOzd