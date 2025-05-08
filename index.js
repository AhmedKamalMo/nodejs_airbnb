// 
const express = require("express");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");
require("dotenv").config();
var cors = require("cors");

const HotelRoutes = require("./routers/Hotel");
const CategoryHotel = require("./routers/categoryHotel");
const Booking = require("./routers/Booking");
const reviewRoutes = require("./routers/reviewRoutes");
const users = require("./routers/usrs");
const paymentRoutes = require("./routers/payment");
const amenities = require("./routers/amenity");
const messageRoutes = require("./routers/message");

app.use(express.json());
app.use(express.static("static"));
app.use(cors());

// Configure Pusher credentials from environment variables
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.warn("⚠️ Pusher credentials not found in environment variables");
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err))


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
  apis: ["./routers/*.js"],
};

const swaggerDocs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// app.use('/api/users', usersRouter);

app.use("/users", users);
app.use("/category", CategoryHotel);
app.use("/Hotel", HotelRoutes);
app.use("/Bookings", Booking);
app.use("/reviews", reviewRoutes);
app.use("/payments", paymentRoutes);
app.use("/amenities", amenities);
app.use("/messages", messageRoutes);
app.use((err, req, res, next) => {
  res.status(500).json(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("server started on http://localhost:3000");
  console.log("Swagger Docs available at http://localhost:3000/api-docs");
});
