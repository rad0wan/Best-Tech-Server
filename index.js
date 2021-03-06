const express = require('express')
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())
// app.use(cors({ origin: 'https://best-tech0.web.app/' }))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@best-tech0.ucbvt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorization access' })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next()
    });

}

async function run() {
    try {
        await client.connect()
        const productCollection = client.db('best-tech0').collection('product')
        const reviewCollection = client.db('best-tech0').collection('review')
        const userCollection = client.db('best-tech0').collection('user')
        const orderCollection = client.db('best-tech0').collection('order')
        const paymentCollection = client.db('best-tech0').collection('payment')
        const newProductCollection = client.db('best-tech0').collection('newProduct')

        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ["card"]
            })
            res.send({ clientSecret: paymentIntent.client_secret })
        })

        app.get('/product', async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            console.log(query);
            const product = await productCollection.findOne(query);
            res.send(product);
        })

        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            res.send(result)
        })

        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        })

        app.post('/review', async (req, res) => {
            const product = req.body;
            const result = await reviewCollection.insertOne(product)
            res.send(result)
        })

        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token })
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const profile = req.body;
            const options = { upsert: true };
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    education: profile.education,
                    linkedIn: profile.linkedIn,
                    location: profile.location,
                    phoneNumber: profile.phoneNumber
                }
            };
            console.log(updateDoc);
            const result = await userCollection.updateMany(filter, updateDoc, options)
            res.send(result)
            console.log(`Updated ${result.modifiedCount} documents`);
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            console.log(query);
            const user = await userCollection.findOne(query);
            res.send(user);
        })

        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user?.role === 'admin'
            console.log(user, isAdmin);
            res.send({ admin: isAdmin })
        })

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            // const requester = req.decoded.email;
            // const requesterAccount = await userCollection.findOne({ email: requester })
            // if (requesterAccount.role === 'admin') {

            // } else {
            //     return res.status(403).send({ message: 'Forbidden access' })
            // }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)

        })

        app.post('/order', async (req, res) => {
            const product = req.body;
            const result = await orderCollection.insertOne(product)
            res.send(result)
        })

        app.get('/order', async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        })

        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            // const decodedEmail = req.decoded.email;
            const authorization = req.headers.authorization;
            console.log('authorization', authorization);
            // if (decodedEmail === email) {

            // } else {
            //     return res.status(403).send({ message: 'Forbidden access' })
            // }
            const filter = { email: email }
            const result = await orderCollection.find(filter).toArray();
            res.send(result)
        })

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(query)
            res.send(result)
        })

        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    paid: true,
                    transitionId: payment.transitionId
                }
            }
            const result = await paymentCollection.insertOne(payment)
            const updatedOrder = await orderCollection.updateOne(filter, updateDoc);
            res.send(updateDoc)
        })

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})