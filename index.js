const express = require('express');
const app = express();
const cors = require('cors');
// mongoDB 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// dot env
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tl5czkc.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();


        // DB collections
        // for [users]
        const usersCollection = client.db('bistroDb').collection('users');
        // for [menus]
        const menuCollection = client.db('bistroDb').collection('menu');
        // for [reviews]
        const reviewCollection = client.db('bistroDb').collection('reviews');
        // for [cart-items]
        const cartCollection = client.db('bistroDb').collection('carts');



        // 
        // [menuCollection] related apis
        //
        // find all menuitem: get operation
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        });


        // 
        // [reviewCollection] related apis
        //
        // find all review: get operation
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });



        // 
        // [cartCollection] related apis
        // 
        // get items from cart for specific email
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }
            else {
                const query = { email: email };
                const result = await cartCollection.find(query).toArray();
                res.send(result);
            }
        });
        // post an item to the cart
        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        });
        // delete an item from the cart
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });


        // 
        // [userCollection] related apis
        //
        // find all users: get operation
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // post an user to the [user-db]
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);

            // [checking] of whether [the-user] is already in [usersCollection] or not
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            // console.log('existing user', existingUser);

            // if [existing-user] found in DataBase, then the operatin will end by [return]
            if (existingUser) {
                // // for [existing-user] DataBase, the operatin will end by this [return]
                return res.send({ message: 'user already in database' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });




        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Boss is sitting!');
})

app.listen(port, () => {
    console.log(`Boss is sitting on port: ${port}`);
})


/**
 * --------------------------------
 *      NAMING CONVENTION
 * --------------------------------
 * users : userCollection
 * app.get('/users')
 * app.get('/users/:id')
 * app.post('/users')
 * app.patch('/users/:id')
 * app.put('/users/:id')
 * app.delete('/users/:id')
*/
