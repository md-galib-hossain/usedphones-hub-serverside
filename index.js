const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORt || 5000;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// middleware
app.use(cors());
app.use(express.json());
console.log(process.env.DB_USER);

// connect database

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fkxltzv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client
      .db("usedphones-hub")
      .collection("categories");
    const paymentCollection = client
      .db("usedphones-hub")
      .collection("payments");

    const productCollection = client
      .db("usedphones-hub")
      .collection("products");

    const bookedCollection = client.db("usedphones-hub").collection("booked");
    const advertisedCollection = client
      .db("usedphones-hub")
      .collection("advertiseditems");

    const userCollection = client.db("usedphones-hub").collection("users");
    const reportCollection = client
      .db("usedphones-hub")
      .collection("reporteditems");

    //Load Category
    app.get("/category", async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const category = await cursor.toArray();
      res.send(category);
    });
    // Load products by single category
    app.get("/category/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { idno: id };
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });
    // Load all products in seller account
    app.get("/products", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const products = await productCollection.find(query).toArray();
      res.send(products);
    });
    // add users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    //   get users
    app.get("/users", async (req, res) => {
      const query = {};
      const cursor = await userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });
    // get specific user by email
    app.get("/user", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });
    // get booked items
    app.get("/bookeditems", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const bookedItems = await bookedCollection.find(query).toArray();

      res.send(bookedItems);
    });
    // get single bookeditem
    app.get("/dashboard/payment/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const bookedItem = await bookedCollection.findOne(query);

      res.send(bookedItem);
    });
    // add to  booked
    app.post("/addbooked", async (req, res) => {
      const booked = req.body;
      const result = await bookedCollection.insertOne(booked);
      res.send(result);
    });
    // add product
    app.post("/addproduct", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // delete
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // add to advertise

    app.put("/advertise/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      // const book = req.body;
      // const newname = book.name;
      // const newbody = book.body;

      const updatedstatus = {
        $set: {
          isadvertised: "yes",
        },
      };
      const result = await productCollection.updateOne(filter, updatedstatus);
      res.send(result);
    });

    // Load advertised
    app.get("/advertised", async (req, res) => {
      const id = parseInt(req.params.id);
      const query = { $and: [{ isadvertised: "yes" }, { ispaid: "no" }] };
      const products = await productCollection.find(query).toArray();
      res.send(products);
    });

    // get seller and admin users
    app.get("/sellers", async (req, res) => {
      const query = { $or: [{ usertype: "Seller" }, { usertype: "Admin" }] };
      const users = await userCollection.find(query).toArray();
      res.send(users);
    });

    //  make verify user
    app.put("/userverify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const updatedverifiedstatus = {
        $set: {
          isverified: "Yes",
        },
      };

      const result = await userCollection.updateOne(
        filter,
        updatedverifiedstatus
      );
      res.send(result);
    });

    //  make admin user
    app.put("/makeadmin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const updatedverifiedstatus = {
        $set: {
          usertype: "Admin",
        },
      };

      const result = await userCollection.updateOne(
        filter,
        updatedverifiedstatus
      );
      res.send(result);
    });

    // delete user seller
    app.delete("/deleteuser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // get all buyers
    app.get("/buyers", async (req, res) => {
      const query = { usertype: "Buyer" };
      const users = await userCollection.find(query).toArray();
      res.send(users);
    });

    // delete buyer
    app.delete("/deletebuyer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //  report an item
    app.post("/report", async (req, res) => {
      const reported = req.body;

      const result = await reportCollection.insertOne(reported);
      res.send(result);
    });

    //  get reported
    //
    app.get("/reporteditems", async (req, res) => {
      const query = {};
      const reportedItem = await reportCollection.find(query).toArray();

      res.send(reportedItem);
    });
    // stripe payment
    app.post("/create-payment-intent", async (req, res) => {
      const booked = req.body;
      const price = booked.resaleprice;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // adding payments to database
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          ispaid: "yes",
        },
      };
      const updatedResult = await bookedCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));
//

app.listen(port, () => {
  console.log("server running on port:", port);
});
