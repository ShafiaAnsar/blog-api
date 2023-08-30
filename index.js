const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt =require('bcryptjs')
const User = require("./models/User")
const app = express();
const connectdb= require("./db")


const salt = bcrypt.genSaltSync(10)
app.use(cors());
app.use(express.json());

app.post('/register', async(req,res)=>{
    const {username,email,password} = req.body
    console.log('Received registration request:', req.body);
 try {
    const user=  await User.create({
        username,
        email,
        password:bcrypt.hashSync(password,salt)
    })
    res.status(200).json(user);
 } catch (error) {
    if (error.code === 11000) {
        // Unique constraint violation
        const duplicateField = Object.keys(error.keyValue)[0];
        res.status(400).json({ error: `This ${duplicateField} is already taken.` });
      } else {
        res.status(500).json({ error: 'An error occurred during registration.' });
      }
    }

})
app.post('/login',async(req,res)=>{
  const {username,password} = req.body
    console.log('Received registration request:', req.body)
    const user = User.findOne({username})
})
connectdb()
app.listen(4000,()=>{
    console.log('App is running at port 4000')
})
// mooongodb:
// password:t8jhVJGZKQzAvOzd