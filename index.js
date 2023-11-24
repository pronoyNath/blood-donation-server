const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const cookieParse = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

// middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
      'http://localhost:5174',
    //   "https://grand-hotel-daa65.web.app",
    //   "https://grand-hotel-daa65.firebaseapp.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParse());

// custom middlewares 
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Forbidden" })
  }
  jwt.verify(token, process.env.ACESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      res.status(401).send({ message: 'unauthorized' })
    }
    req.user = decoded;
    next();
  })
}

app.post('/logout', async (req, res) => {
  const user = req.body;
  res.clearCookie('token', { maxAge: 0 }).send({ success: true })
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxzfy8n.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("bloodDonation");
    // collections
    const usersInfoCollection = database.collection("usersInfo")
//auth(token) related api
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, { expiresIn: '2h' })
  res
    .cookie('token', token, {

      // before deploy
      httpOnly: true,
      secure: false,


      // after deploy
      // httpOnly: false,
      // secure: true,
      // sameSite: 'none'
    })
    .send({ success: true })
})


    // donors api 
    app.post('/user-info', async (req, res) => {
      const userInfo = req.body;
      console.log(userInfo);
      const result = await usersInfoCollection.insertOne(userInfo)
      res.send(result)
    })

    // Get user role
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email
      const result = await usersInfoCollection.findOne({ email })
      res.send(result)
    })








    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
  res.send("Server is Running onnn....")
})

app.listen(port, () => {
  console.log(`blood donation server is running on port ${port}`);
})