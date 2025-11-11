const express = require("express");
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const uri =
  "mongodb+srv://finEaseDB:9RpYIJNbrVNtaB26@cluster0.rzdhq8l.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("finEase-DB");
    const expenseCollection = db.collection("expenses");

    // view all data
    app.get("/transactions", async (req, res) => {
      const result = await expenseCollection.find().toArray();

      res.send(result);
    });

    // add data to the database
    app.post("/transactions", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await expenseCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // view single data
    app.get("/transactions/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id);
      const result = await expenseCollection.findOne({ _id: new ObjectId(id) });

      res.send({
        success: true,
        result,
      });
    });

    //update single data

    app.put("/transactions/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      console.log(data);
      // console.log(id);
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };

      const result = await expenseCollection.updateOne(filter, update);

      res.send({
        success: true,
        result,
      });
    });

    //delete api

    app.delete("/transactions/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };

      const result = await expenseCollection.deleteOne(filter);

      res.send({
        success: true,
        result,
      });
    });

    // overview total balance

    app.get("/overview", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res
            .status(400)
            .send({ success: false, message: "Email required" });
        }

        const transactions = await expenseCollection.find({ email }).toArray();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach((t) => {
          const type = t.type?.toLowerCase();
          const amount = Number(t.amount) || 0;

          if (type === "income") {
            totalIncome += amount;
          } else if (type === "expense") {
            totalExpense += amount;
          }
        });

        const balance = totalIncome - totalExpense;

        res.send({
          success: true,
          overview: {
            totalIncome,
            totalExpense,
            balance,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
