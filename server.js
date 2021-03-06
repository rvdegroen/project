// REQUIRE VARIABLES
require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const multer = require("multer");
const compression = require("compression");
// INCLUDED IN NODEJS
const path = require("path");

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
  try {
    // Connect client to url that's save in .env (server)
    await client.connect();
    // Establish and  verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
    // Variable of dish-exchange database
    database = client.db("dish-exchange");
    // Variable of dishes collection within dish-exchange
    dishesCollection = database.collection("dishes");
    // NEW
  } catch (err) {
    // TEMPORARY
    // I want to show the error with error message in a (Server error response)
    console.dir(err);
    // if I wanted to show it up on the 404 page as variable use next line below:
    // res.render("pages/404", { error: err.message });
  }
}
run();

// MIDDLEWARE
app.use(compression({ level: 9 }));
// express knows all my static files are in my static folder
app.use(express.static("static"));
// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// MIDDLEWARE MULTER | source: https://stackoverflow.com/questions/31592726/how-to-store-a-file-with-file-extension-with-multer/39650303#39650303
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./static/images/uploads/");
  },
  filename(_req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ROUTES

// homepage
app.get("/", async (req, res) => {
  // I want to retrieve data from mongoDB with .find, which returns a cursor
  const cursor = dishesCollection.find();
  // I have a cursor but I want my collection with all the dishes documents
  const allDishes = await cursor.toArray();
  // console.log(allDishes);

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

// add-dish post into mongoDB
app.post("/add-dish", upload.single("uploadImage"), async (req, res) => {
  console.log(req.file);
  // using try & catch for things that could potentially throw an error
  try {
    const newDish = await dishesCollection.insertOne({
      name: req.body.dishName,
      quality: req.body.dishQuality,
      ingredients: req.body.ingredients.split(","),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags],
      // it doesn't comes back as undefined if it doesn't exist
      img: req?.file?.filename,
    });
    // console log will return the insertedId
    // console.log("newDish", newDish);
    const insertedId = newDish.insertedId;
    // using ``, because then I can use the ${} to insert variables (template literals)
    res.redirect(`/dish/${insertedId}`);
    // if something goes wrong then it will stop the code in try and go to catch to show the error on the add-dish page
  } catch (err) {
    res.render("pages/add-dish", { error: err.message });
  }
});

// dish-details page
// dishId has the same Id as insertedId from line 79, because that's where you go redirected
app.get("/dish/:dishId", async (req, res) => {
  const urlId = req.params.dishId;
  console.log("urlId", urlId);
  // a query will basically filter the information you're looking for
  // we need to convert the urlId from "string" to (a new variable) objectId
  // source: https://stackoverflow.com/questions/8233014/how-do-i-search-for-an-object-by-its-objectid-in-the-mongo-console
  const query = { _id: new ObjectId(urlId) };
  const dish = await dishesCollection.findOne(query);
  // making sure that when you click on a dish, it will console.log the dish
  // console.log("dish", dish);

  res.render("pages/dish-details", {
    // variables in the front-end
    dish,
  });
});

// dish details edit page
app.get("/dish/:dishId/edit", async (req, res) => {
  const urlId = req.params.dishId;
  console.log("urlId", urlId);
  // a query will basically filter the information you're looking for
  // we need to convert the urlId from "string" to (a new variable) objectId
  // source: https://stackoverflow.com/questions/8233014/how-do-i-search-for-an-object-by-its-objectid-in-the-mongo-console
  const query = { _id: new ObjectId(urlId) };
  const dish = await dishesCollection.findOne(query);
  // making sure that when you click on a dish, it will console.log the dish
  // console.log("dish", dish);

  res.render("pages/edit-dish", {
    // variables in the front-end
    dish,
  });
});

// edit a dish
app.post("/dish/:dishId/edit", upload.single("uploadImage"), async (req, res) => {
  const urlId = req.params.dishId;
  console.log("urlId", urlId);
  // a query will basically filter the information you're looking for
  // we need to convert the urlId from "string" to (a new variable) objectId
  // source: https://stackoverflow.com/questions/8233014/how-do-i-search-for-an-object-by-its-objectid-in-the-mongo-console
  const query = { _id: new ObjectId(urlId) };
  const dish = await dishesCollection.findOne(query);
  // using try & catch for things that could potentially throw an error
  try {
    await dishesCollection.updateOne(query, {
      $set: {
        name: req.body.dishName,
        quality: req.body.dishQuality,
        ingredients: req.body.ingredients.split(","),
        tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags],
        // it will not throw an error without a ?
        img: req?.file?.filename,
      },
    });
    // using ``, because then I can use the ${} to insert variables (template literals)
    res.redirect(`/dish/${urlId}`);
    // if something goes wrong then it will stop the code in try and go to catch to show the error on the add-dish page
  } catch (err) {
    res.render("pages/edit-dish", { error: err.message, dish });
  }
});

// To delete a document/ dish
app.delete("/dish/:dishId", async (req, res) => {
  const urlId = req.params.dishId;
  console.log("urlId", urlId);
  // a query will basically filter the information you're looking for
  // we need to convert the urlId from "string" to (a new variable) objectId
  // source: https://stackoverflow.com/questions/8233014/how-do-i-search-for-an-object-by-its-objectid-in-the-mongo-console
  const query = { _id: new ObjectId(urlId) };
  // using try & catch for things that could potentially throw an error
  try {
    await dishesCollection.deleteOne(query);
    // if deleteOne sends the response of "OK" then the brower knows it can redirect
    res.send(`OK`);
    // if something goes wrong then it will stop the code in try and go to catch to show the error on the add-dish page
  } catch (err) {
    // res.render("pages/edit-dish", { error: err.message, dish });
    res.status(400).send(err.message);
  }
});

// 404 error pages
app.get("*", (req, res) => {
  res.send("This page does not exist!");
});

// APP LISTENING
app.listen(process.env.PORT || 3000);
