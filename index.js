const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@best-tech0.ucbvt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const productCollection = client.db('best-tech0').collection('product')
        const reviewCollection = client.db('best-tech0').collection('review')

        app.get('/product', async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        app.get('/product/:id', async (req, res) => {
            let id = req.params.id;
            const query = { _id: ObjectId(id) }
            console.log(query);
            const product = await productCollection.findOne(query);
            res.send(product);
        })

        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        })

        app.post('/review', async (req, res) => {
            const doctor = req.body;
            const result = await reviewCollection.insertOne(doctor)
            res.send(result)
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