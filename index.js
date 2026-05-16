const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const dotenv=require('dotenv');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config()
app.use(cors())
app.use(express.json());
const port =process.env.PORT
const uri =process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// json web server token verified

const  JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
    )
 const authorization=async(req,res,next)=>{
 
const header = req?.headers.authorization
if(!header){
  return res.status(401).json({message:"unauthorized"})
}
const token = header.split(" ")[1]
if(!token){
   return res.status(401).json({message:"unauthorized"})
}
try{
const {payload}=await jwtVerify(token,JWKS)
console.log(payload);
next()
}catch(error){
  return res.status(401).json({message:"forbidden"})
}
 }


async function run() {
  try {
  //  await client.connect();
   const db=client.db("wanderlust")
   const collection = db.collection("destinations")
const bookingCollection = db.collection("bookings")
  

//get data 
   app.get('/destinations', async(req,res)=>{
    const cursor= await collection.find()
    const result = await cursor.toArray()
    res.send(result)
   })


   //get data by id
   app.get('/destinations/:id', authorization, async(req,res)=>{
const id = req.params.id;
const query = {
  _id:new ObjectId(id)
}
const result = await collection.findOne(query)
res.send(result)
   })
 
 // data post
   app.post('/destinations',authorization ,async(req,res)=>{
     const destination = req.body;
    //  console.log(destination);
     const result = await collection.insertOne(destination)
    res.send(result)
 })


 // data update
 app.patch('/destinations/:id', authorization ,async(req,res)=>{
  const id = req.params.id;
  const updateData = req.body;
  const filter={
    _id:new ObjectId(id)
  }
  const updateDestination={
    $set:updateData }
  const result = await collection.updateOne(filter,updateDestination)
  res.send(result)
 }) 

 // delete data
 app.delete('/destinations/:id',authorization ,async(req , res)=>{
  const id = req.params.id;
  const query = {
    _id :new ObjectId(id)
  }
  const result = await collection.deleteOne(query)
  res.json(result)
 })

app.post('/booking',authorization, async (req, res) => {
  try {
    const bookingData = req.body;

    const result = await bookingCollection.insertOne(bookingData);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get('/booking/:userId', authorization ,async(req,res)=>{
  const userId = req.params.userId;
  console.log(userId);
  const result = await bookingCollection.find({userId:userId}).toArray()
  res.send(result)
})


// delete bookings
app.delete('/booking/:id',authorization, async(req,res)=>{
  try{
 const id = req.params.id
 console.log(id ,":id");
 
  const result = await bookingCollection.deleteOne({_id:id})
  res.send(result)
  }catch(error){
 console.error(error);

    res.status(500).send({
      success: false,
      message: "Failed to delete booking",
    });
  }
 
})

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World! This is waderlast server')
})

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })
module.exports = app;