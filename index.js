const express = require("express");
const app = express();
const HotelRoutes = require("./routers/Hotel");
const CategoryHotel = require("./routers/categoryHotel");
const Booking = require("./routers/booking");
const reviewRoutes = require("./routers/reviewRoutes");
// const todos = require("./routers/todos")
const users = require("./routers/usrs");
require("dotenv").config();
const mongoose = require("mongoose");
app.use(express.json());
app.use(express.static("static"));

mongoose
  .connect("mongodb://127.0.0.1:27017/airbnb")
  .then(() => {
    console.log("connection established");
  })
  .catch((err) => {
    console.log(err);
  });

var cors = require("cors");
app.use(cors());

app.use("/airbnb/users", users);

app.use((err, req, res, next) => {
  res.json(err).status(500);
});
app.use("/category", CategoryHotel);
app.use("/Hotel", HotelRoutes);
app.use("/Booking", Booking);
app.use("/reviews", reviewRoutes);

app.listen(3000, () => {
  console.log("server started on http://localhost:3000");
});
