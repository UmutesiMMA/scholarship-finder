require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const axios = require("axios");
const { error } = require("console");
const required_env = ["BASE_URL", "API_KEY", "API_HOST", "PORT"];
const missing = required_env.filter((k)=> !process.env[k]);
if(missing.length){
  console.error(`Missing required env variables: ${missing.join(", ")}`);
  process.exit(1);
}

const app = express();

app.use(express.static(require("path").join(__dirname, "..")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

function toApiError(e) {
    if (e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") {
      return { status: 504, message: "The scholarship service took too long to respond." };
    }
    if (e.response) {
      if (e.response.status === 429) {
        return { status: 429, message: "Too many requests. Please try again later." };
      }
      if (e.response.status === 404) {
        return { status: 404, message: "Scholarship not found." };
      }
      return { status: 502, message: "The scholarship service returned an error." };
    }
    return { status: 502, message: "Could not reach the scholarship service." };
  }


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
    const {status, message} = toApiError(e)
    res.status(status).json({ error: message });
  }
});

app.use("/api", (req,res)=>{
  res.status(404).json({error:"Not found."});
})
app.use((err,req,res,next)=>{
  res.status(505).json({error:"Something went wrong"});
})

app.listen(process.env.PORT,"127.0.0.1", () => console.log("Server listening on port 3000"));
