const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri =
    "mongodb+srv://tanjirdemo:tanjir%40123@cluster0.3jhfr.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

/*----Varify JWT Token-----*/
function verifyJwt(req, res, next) {
    const bearToken = req.headers.authorization;
    if (!bearToken) {
        return res.status(401).send({ message: "Unauthorize access" });
    }
    const token = bearToken.split(" ")[1];

    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbiden Access" });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const todoCollection = client.db("todo-app").collection("todos");
        app.get("/todos", verifyJwt, async (req, res) => {
            const decodeEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodeEmail) {
                const query = { email: email };
                const cursor = todoCollection.find(query);
                const todos = await cursor.toArray();
                res.send(todos);
            } else {
                res.status(403).send({ message: "Forbiden Access" });
            }
        });
        app.post("/todos", async (req, res) => {
            const todo = req.body;
            const result = await todoCollection.insertOne(todo);
            res.send(result);
        });
        app.delete("/todo/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await todoCollection.deleteOne(query);
            res.send(result);
        });
        app.patch("/todo/:id", async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const result = await todoCollection.updateOne(query, {
                $set: {
                    isCompleted: true,
                },
            });
            res.send(result);
        });
        app.post("/login", async (req, res) => {
            const user = req.body;

            const accessToken = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
                expiresIn: "1d",
            });
            res.send({ accessToken });
        });
    } finally {
    }
}
run().catch(console.dir);

app.get("/", async (req, res, next) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log("Server running successfully");
});
