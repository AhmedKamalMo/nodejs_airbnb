const express = require("express");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// استيراد جميع المسارات
const HotelRoutes = require("./routers/Hotel");
const CategoryHotel = require("./routers/categoryHotel");
const Booking = require("./routers/booking");
const reviewRoutes = require("./routers/reviewRoutes");
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

// إعدادات Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb API",
      version: "1.0.0",
      description: "Airbnb",
    },
    servers: [
      {
        url: "http://localhost:3000", 
      },
    ],
  },
  apis: ["./routers/*.js"], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/airbnb/users", users);
app.use("/category", CategoryHotel);
app.use("/Hotel", HotelRoutes);
app.use("/Booking", Booking);
app.use("/reviews", reviewRoutes);

app.use((err, req, res, next) => {
  res.status(500).json(err);
});

app.listen(3000, () => {
  console.log("server started on http://localhost:3000");
  console.log("Swagger Docs available at http://localhost:3000/api-docs");
});
