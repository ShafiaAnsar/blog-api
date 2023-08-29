const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
// app.use(express.json());

app.post('/register',(req,res)=>{
    console.log('Received registration request:', req.body);

    res.status(200).json({ message: 'Registration successful' });

})

app.listen(4000)