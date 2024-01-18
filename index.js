const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt =require('bcryptjs')
const jwt = require("jsonwebtoken")
const User = require("./models/User")
const Post = require('./models/Post')
const app = express();
const connectdb= require("./db")
const cookieParser = require('cookie-parser')
const multer = require('multer')
const  uploadMiddleware = multer({dest:'uploads/'})
const fs = require('fs')
const salt = bcrypt.genSaltSync(10)
const secret ='jf803u4dj02948jkfaalrla'
app.use(cors({credentials:true,origin:"https://blog-client-gules-nine.vercel.app/"}));

app.use(cookieParser())
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
      console.log(error)
        // Unique constraint violation
        const duplicateField = Object.keys(error.keyValue)[0];
        res.status(400).json({ error: `This ${duplicateField} is already taken.` });
        
      } else {
        res.status(500).json({ error: 'An error occurred during registration.' });
      }
    }

})
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received login request:', req.body);

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if(isPasswordValid){
      jwt.sign({username,id:user._id},secret,{},(err,token)=>{
        if(err){
          throw new Error(err)
        }
        // setUserName(username);
        res.cookie('token',token).json({
          id:user._id,
          username,
        })
    })
  } 
  else {
    res.status(401).json({ error: 'Invalid password.' })
    }
  
}
  catch (error) {
    console.error('An error occurred during login:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});
app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});
app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});
app.post('/post',uploadMiddleware.single('file'),async(req,res)=>{
  const {originalname,path} = req.file
  const parts = originalname.split('.')
  const extension = parts[parts.length-1]
  const newPath = path+"."+extension
  fs.renameSync(path,newPath)

  const {title,summary,content} = req.body
 const post = await Post.create({
  title,
  summary,
  content,
  cover:newPath
 })
  res.json([post])
})
connectdb()
app.listen(4000,()=>{
    console.log('App is running at port 4000')
})

