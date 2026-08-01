require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/api/scholarships", async (req, res) => {
  try {
    const response = await axios.get(process.env.BASE_URL, {
      params: req.query,
      headers: {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": process.env.API_HOST,
      },
    });
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("Server listening on port 3000"));
