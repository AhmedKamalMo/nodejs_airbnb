const express = require("express");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// استيراد جميع المسارات
const HotelRoutes = require("./routers/Hotel");
const CategoryHotel = require("./routers/categoryHotel");
const Booking = require("./routers/Booking");
const reviewRoutes = require("./routers/reviewRoutes");
const users = require("./routers/usrs");

require("dotenv").config();
const mongoose = require("mongoose");
app.use(express.json());
app.use(express.static("static"));

// mongoose
//   .connect("mongodb://127.0.0.1:27017/airbnb")
//   .then(() => {
//     console.log("connection established");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
.catch(err => console.error("❌ MongoDB Connection Error:", err))
var cors = require("cors");

app.use(cors());

// إعدادات Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routers/*.js"], // تأكد أن هذا المسار صحيح
};

const swaggerDocs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/users", users);
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

