const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// mongodb connection
mongoose
  .connect(
    "mongodb+srv://atharvpatil5177:veVloV8rUKaW9aLA@cluster0.6m7xsik.mongodb.net/storedb",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Product Schema
const productSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date,
});

const Product = mongoose.model("Product", productSchema);

app.get("/", (req, res) => {
  res.send("hello world!");
});

// Initialize Database with Seed Data
app.get("/api/initialize", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json",
    );
    const products = response.data;

    await Product.deleteMany(); // Clear existing data
    await Product.insertMany(products); // Insert new data
    res.status(200).send("Database initialized with seed data");
  } catch (error) {
    res.status(500).send("Error initializing database: " + error.message);
  }
});

app.get('/api/transactions', async (req, res) => {
  const { search = '', page = 1, perPage = 10 } = req.query;

  // Initialize query object
  const query = {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  };

  // Handle price search separately
  if (!isNaN(search) && search.trim() !== '') {
    // If search is a number, search for an exact price match
    query.$or.push({ price: parseFloat(search) });
  }

  try {
    const transactions = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    
    const total = await Product.countDocuments(query);

    res.status(200).json({ transactions, total, page: parseInt(page), perPage: parseInt(perPage) });
  } catch (error) {
    res.status(500).send('Error fetching transactions: ' + error.message);
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
