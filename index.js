const express = require('express')
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000
//  midlewire
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Travel server is running')
})
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kl0ltne.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const serviceCollection = client.db('travels').collection('services')
        const reviewCollection = client.db('travels').collection('reviews')

        function verifyJwt(req, res, next) {
            const headers = req.headers.authorization;
            if (!headers) {
                return res.status(401).send({ massage: 'UnAuthorization access' })
            }
            const token = headers.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
                if (error) {
                    return res.status(401).send({ massage: 'unAuthrization' })
                }
                req.decoded = decoded;
                next()

            })

        }
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })
        app.get('/serviceLimit', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const serviceLimit = await cursor.limit(3).toArray()
            res.send(serviceLimit)
        })
        app.post('/services', async (req, res) => {
            const reviews = req.body;
            const result = await serviceCollection.insertOne(reviews)
            res.send(result)
        })
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewCollection.insertOne(reviews)
            res.send(result)
        })
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);
            res.send(review);
        })
        app.get('/reviews', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ massage: 'UnAuthorization access' })
            }
            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query)
            const reviews = await cursor.toArray()
            res.send(reviews)
        })
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const review = await reviewCollection.deleteOne(query)
            res.send(review)
        })
        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const unique = { _id: ObjectId(id) };
            const review = req.body;
            const option = { upsert: true };
            const updateReview = {
                $set: {
                    name: review.name,
                    massege: review.massege,

                }
            }
            const result = await reviewCollection.updateOne(unique, updateReview, option);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.log(err))


app.listen(port, () => {
    console.log('My server is running', port)
})