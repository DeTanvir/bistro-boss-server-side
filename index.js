const express = require('express');
const app = express();
const cors = require('cors');
// jwt 
const jwt = require('jsonwebtoken');
// mongoDB 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// dot env
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



// it's middleware
// ======================================================================================
//                                verifyJWT 
// ======================================================================================
// ======================================================================================
// verify [JWT] to whether the [requesting-email] has valid token or not 
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    // bearer token
    const token = authorization.split(' ')[1];

    // Main [jwt-verification]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // if [error] happens, return
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }

        // user's [token-decoded]
        req.decoded = decoded;
        // calling the [user's-get] function, after [jwt-verify]
        next();
    })
}
// ======================================================================================
// ======================================================================================
// ======================================================================================






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


        // ======================================================================================
        // ======================================================================================
        // ======================================================================================
        // DB collections
        // for [users]
        const usersCollection = client.db('bistroDb').collection('users');
        // for [menus]
        const menuCollection = client.db('bistroDb').collection('menu');
        // for [reviews]
        const reviewCollection = client.db('bistroDb').collection('reviews');
        // for [cart-items]
        const cartCollection = client.db('bistroDb').collection('carts');
        // ======================================================================================
        // ======================================================================================
        // ======================================================================================



        // ======================================================================================
        // JWT token creation
        // ======================================================================================
        // ======================================================================================
        // JWT request[is not an async-await function]
        app.post('/jwt', (req, res) => {
            const user = req.body;
            // token comes from [jwt.io]
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })
        // ======================================================================================
        // ======================================================================================
        // ======================================================================================


        // Warning: we have to use verifyJWT before using verifyAdmin. 
        // verifyAdmin needs mongoDB, so we've to use [verifyAdmin] after mongoDB connects
        const verifyAdmin = async (req, res, next) => {
            // everywhere [verifyAdmin] is used after [verifyJWT], so [req.decoded.email] is from [verifyJWT]
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden access' });
            }
            next();
        }

        /**
         * 0. do not show secure links to those who should not see the links
         * 1. use jwt token: verifyJWT
         * 2. use verifyAdmin middleware
        */


        // ======================================================================================
        // MENU
        // ======================================================================================
        // ======================================================================================
        // 
        // [menuCollection] related apis
        //
        // find all menuitem: get operation
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        });
        // ======================================================================================
        // ======================================================================================
        // ======================================================================================





        // ======================================================================================
        // REVIEWS
        // ======================================================================================
        // ======================================================================================
        // 
        // [reviewCollection] related apis
        //
        // find all review: get operation
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });
        // ======================================================================================
        // ======================================================================================
        // ======================================================================================





        // ======================================================================================
        // CART
        // ======================================================================================
        // ======================================================================================
        //  
        // [cartCollection] related apis
        // 
        // get items from cart for specific email
        // verifying [verifyJWT] for valid-token
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }


            // [security-level1]-use [verifyJWT]
            // [security-level2]-email-matching            
            // for [verifyJWT] email matching
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' });
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
        // ======================================================================================
        // ======================================================================================
        // ======================================================================================




        // ======================================================================================
        // USERS
        // ======================================================================================
        // ======================================================================================
        // 
        // [userCollection] related apis
        //
        // find all users: get operation
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // post an user to the [user-db]
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);

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

        // delete an user from the userDB
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });
        // update an [user's role] by patch, ['/users/admin/:id'] to understand that: it is [admin-operation]
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            // [filter] is to find the right [user] by [id]
            const filter = { _id: new ObjectId(id) };
            // this is to determine which field would be updated
            const updateDoc = {
                $set: {
                    role: `admin`
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        // checking of whether a user is [admin] or not 
        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;


            // [security-level1]-use [verifyJWT]
            // [security-level2]-email-matching
            // [security-level3]-check-admin

            // for [verifyJWT] email matching
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' });
            }


            else {
                const query = { email: email };
                const user = await usersCollection.findOne(query);
                const result = { admin: user?.role === 'admin' }
            }
        })
        // ======================================================================================
        // ======================================================================================
        // ======================================================================================
        // 





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
