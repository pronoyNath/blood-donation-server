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

// use verify admin after verifyToken
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
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
    const donationRequstCollection = database.collection("donationRequest")



    //auth(token) related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, { expiresIn: '365d' })
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


    // all-users info 
    app.get('/all-users', verifyToken, async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const status = req.query.status;
      // if (status) {
      //   const result = await usersInfoCollection.find({ status: status })
      //     .skip(page * size)
      //     .limit(size)
      //     .toArray();
      //   res.send(result);
      // }
      // console.log('pagination query', page, size);
      // else{
      const result = await usersInfoCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
      // }
    })

    //total user count
    app.get('/user-count', async (req, res) => {
      const count = await usersInfoCollection.estimatedDocumentCount();
      res.send({ count });
    })

    // Get user info
    app.get('/user/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      const result = await usersInfoCollection.findOne({ email })
      res.send(result)
    })


    // user info post 
    app.post('/user-info', async (req, res) => {
      const userInfo = req.body;
      // console.log(userInfo);
      const result = await usersInfoCollection.insertOne(userInfo)
      res.send(result)
    })

    // update user role 
    app.put('/user-info/:id', async (req, res) => {
      const userID = req.params.id;
      const role = req.body;
      // console.log(userID,role);
      const filter = { _id: new ObjectId(userID) };
      const options = { upsert: true };
      const updateUserRole = {
        $set: {
          role: role?.role
        }
      }
      const result = await usersInfoCollection.updateOne(filter, updateUserRole, options)
      res.send(result);
    })

    // update user status 
    app.put('/update-status/:id', verifyToken, async (req, res) => {
      const userID = req.params.id;
      const userStatus = req.body;
      // console.log(userID,userStatus);
      const filter = { _id: new ObjectId(userID) };
      const options = { upsert: true };
      const updateUserRole = {
        $set: {
          status: userStatus?.status
        }
      }
      const result = await usersInfoCollection.updateOne(filter, updateUserRole, options)
      res.send(result);
    })

    // update user info 
    app.put('/update-user-info/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const userInfo = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      // console.log(userInfo);
      const updateUserInfo = {
        $set: {
          name: userInfo?.name,
          imageURL: userInfo?.imageURL,
          bloodGroup: userInfo?.bloodGroup,
          district: userInfo?.district,
          upazila: userInfo?.upazila
        }
      }
      const result = await usersInfoCollection.updateOne(filter, updateUserInfo, options)
      res.send(result);
    })




    // donation request related api 

    //get doantion requests
    app.get('/donation-requests', verifyToken, async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      
      const result = await donationRequstCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    })


    // post donation request 
    app.post('/donation-request', verifyToken, async (req, res) => {
      const userInfo = req.body;
      // console.log(userInfo);
      const result = await donationRequstCollection.insertOne(userInfo)
      res.send(result)
    })
    //total donation request count
    app.get('/donation-requst-count', async (req, res) => {
      const count = await donationRequstCollection.estimatedDocumentCount();
      res.send({ count });
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