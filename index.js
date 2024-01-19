const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000


const secret = 'jsandbewhdnfesujfjdfdf'
// middleware or // parsers
app.use(cors({
  origin:'http://localhost:5173',
  credentials: true,
})); 
app.use(express.json());
app.use(cookieParser());

// Cleanco
// cl5sJ9HOgvvTLvXY




const uri = "mongodb+srv://Cleanco:cl5sJ9HOgvvTLvXY@cluster0.fohhaen.mongodb.net/?retryWrites=true&w=majority";

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('Cleanco').collection('services')
    const bookingCollection = client.db('Cleanco').collection('bookings')

    // middlewares
    // verify token and grant access
    const gateman =  (req , res , next) => {
      const {token} = req.cookies
      if(!token){
        return res.status(401).send({message: "You are not authorized"})
      }
      jwt.verify(token , secret , (err , decode)=> {
        if(err){
          return res.status(401).send({message: "Yoy are not authorized"})
        }
        req.user = decode;
        next();
      })
    }

    app.get('/api/v1/services' ,  gateman , async(req , res) => {
        const cursor = servicesCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })

    app.post('/api/v1/user/create-booking' , async(req , res) => {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
    })
    // user specific bookings
    app.get('/api/v1/user/create-booking' , gateman , async(req , res) => {
        const queryEmail = req.query.email;
        const tokenEmail = req.user.email;
        if(queryEmail !== tokenEmail){
          return res.status(403).send({message: 'forbidden access'})
        }

        let query = {}
        if(queryEmail){
          query.email = queryEmail
        }

        const result = await bookingCollection.find(query).toArray()
        res.send(result)
        
        
    })

    app.delete('/api/v1/user/cancel-booking/:bookingId' , async(req , res) => {
      const id = req.params.bookingId;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    app.post('/api/v1/auth/access-token',async(req , res) => {
      const user = req.body;
      const token =  jwt.sign(user , secret , {expiresIn: "12h"});
      res.cookie('token' , token , {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        // maxAge: 60*60*1000

      }).send({ success: true })
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {

  res.send('Hello World!')
})



app.listen(port, () => {
  console.log(`Clean co server is listening on port ${port}`)
})