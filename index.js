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
app.use(cors({ credentials: true, origin: "https://blog-client-two-orpin.vercel.app" }));


app.use(cookieParser())
app.use(express.json());
app.use('/uploads',express.static(__dirname + '/uploads'))

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
        res.cookie('token',token, { sameSite: 'None', secure: true }).json({
          id:user._id,
          username,
        })
    });
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
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;

  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const extension = parts[parts.length - 1];
    newPath = path + '.' + extension;
    fs.renameSync(path, newPath);
  } else {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      console.error(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, summary, content } = req.body;

    try {
      const post = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id,
      });

      res.json([post]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while creating the post' });
    }
  });
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  // Check if a file was uploaded successfully
  let newPath = null
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const extension = parts[parts.length - 1];
    const newPath = path + '.' + extension;
    fs.renameSync(path, newPath);
   
 
  } 
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, title, summary, content } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isAuthor = JSON.stringify(post.author) === JSON.stringify(info.id);

    if (!isAuthor) {
      return res.status(403).json({ error: 'You are not the author of this post' });
    }

    // Update the post using findByIdAndUpdate
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        title,
        summary,
        content,
        cover: newPath || post.cover,
      },
      { new: true } // To return the updated post
    );

    res.json(updatedPost);
  });
});


 ;
app.get('/post',async(req,res)=>{
const posts = await Post.find()
              .populate('author',['username'])
              .sort({createdAt:-1})
              .limit(20)

  res.json(posts)
})
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id).populate('author', ['username']);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the post' });
  }
});

connectdb()
app.listen(4000,()=>{
    console.log('App is running at port 4000')
})
// mooongodb:
// password:t8jhVJGZKQzAvOzd