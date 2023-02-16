// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const url = require('url');

require('dotenv').config();


const baseUrl = 'https://frantic-slug-undershirt.cyclic.app';

const port =process.env.port ||3000;

const uri = process.env.DB_URI;

// Create a new instance of the Express server
const app = express();

// Set up body parsing middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up a route for generating shortened URLs
app.post("/shorten", async (req, res) => {
  // Connect to MongoDB Atlas
  let client;
  try {
    client = await MongoClient.connect(uri);
    const db = client.db("urls");

    // Generate a new unique rm -f .git/index.lockidentifier
    const id = generateUniqueId();

    // Insert a new document into the URLs collection
    const result = await db.collection("urls").insertOne({
      id: id,
      original_url: req.body.url,
      clicks: 0,
      created_at: new Date(),
    });

    if (!result.insertedId) {
      throw new Error("Insert failed");
    }

    // Construct the shortened URL and return it to the user
    // const shortenedUrl = url.format({
    //   protocol: baseUrl.protocol,
    //   host: baseUrl.host,
    //   pathname: `/${id}`,
    // });
    const shortenedUrl = `${baseUrl}/${id}`;
    res.send({ url: shortenedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  } finally {
    if (client) {
      client.close();
    }
  }
});

// Set up a route for redirecting to the original URL
app.get("/:id", async (req, res) => {
  // Connect to MongoDB Atlas
  let client;
  try {
    client = await MongoClient.connect(uri);
    const db = client.db("urls");

    // Look up the original URL in the URLs collection
    const result = await db
      .collection("urls")
      .findOneAndUpdate(
        { id: req.params.id },
        { $inc: { clicks: 1 } },
        { returnOriginal: false }
      );

    // If a matching URL is found, redirect to it
    if (result.value) {
      res.redirect(result.value.original_url);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  } finally {
    if (client) {
      client.close();
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Helper function for generating unique IDs
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 8);
}
