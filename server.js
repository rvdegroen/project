// REQUIRE VARIABLES
require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
// const bodyParser = require("body-parser");

// VARIABLES
const app = express();
// connection uri to database
const url = process.env.DATABASE_URL;

// CONFIGURATION
// sets configuration
app.set("view engine", "ejs");
app.set("views", "./views");
// new client mongodb
const client = new MongoClient(url);

// GLOBAL VARIABLES DATABASE - AFTER CLIENT IS CONNECTED
// Variable of the database dish-exchange
let database;
// Variable of dishes collection within dish-exchange
let dishesCollection;

// CONNECT DATABASE
async function run() {
  // Connect the client to url that's saved in .env file
  await client.connect();
  // Variable of the database dish-exchange
  database = client.db("dish-exchange");
  // Variable of dishes collection within dish-exchange
  dishesCollection = database.collection("dishes");
}
run();

// MIDDLEWARE
// express knows all my static files are in my static folder
app.use(express.static("static"));

// ROUTES

// homepage
app.get("/", async (req, res) => {
  // I want to retrieve data from mongoDB with .find, which returns a cursor
  const cursor = dishesCollection.find();
  // I have a cursor but I want my collection with all the dishes documents
  const allDishes = await cursor.toArray();
  console.log(allDishes);

  res.render("pages/dishes", {
    // variables in the front-end
    numberOfDishes: allDishes.length,
    allDishes,
  });
});

// add-dish page
app.get("/add-dish", (req, res) => {
  res.render("pages/add-dish");
});

// to post the info from add-dish into mongoDB
app.post("/add-dish", async (req, res) => {
  const newDish = {
    name: "test dish",
    quality: 3,
    ingredients: ["chicken", "milk", "rice", "cream"],
    tags: ["asian", "poke and sushi", "mild"],
    img: "test.jpeg",
  };
  dishesCollection = database.collection("dishes");
  dishesCollection.insertOne(newDish);
  console.log(dishesCollection);
  res.render("pages/add-dish");
});

// 404 error pages
app.get("*", (req, res) => {
  res.send("This page does not exist!");
});

// APP LISTENING
app.listen(process.env.PORT || 3000);
