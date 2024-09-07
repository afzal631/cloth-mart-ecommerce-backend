const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorMidlleware");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectdb = require("./lib/db");

dotenv.config();

const port = process.env.PORT;

const app = express();

app.use(express.json({ limit: "25mb" }));
// app.use(express.urlencoded({ limit: "25mb" }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin:
      process.env.NODE_ENV == "development"
        ? "http://localhost:5173"
        : "https://cloth-mart-frontend.vercel.app/",
    credentials: true,
  })
);

connectdb()
  .then(() => console.log("mongodb connection established successfully."))
  .catch((err) => console.log(err));

app.use("/api/users", userRoutes);
app.get("/", (req, res) => {
  res.send("server started");
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
