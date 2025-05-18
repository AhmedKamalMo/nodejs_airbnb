// 
const express = require("express");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");
const { whatsappService, server } = require('./services/whatsapp'); // Import whatsappService
require("dotenv").config();
var cors = require("cors");

const HotelRoutes = require("./routers/Hotel");
const CategoryHotel = require("./routers/categoryHotel");
const Booking = require("./routers/Booking");
const reviewRoutes = require("./routers/reviewRoutes");
const users = require("./routers/usrs");
const paymentRoutes = require("./routers/payment");
const amenities = require("./routers/amenity")
const chatRoutes = require('./routers/chatRouter');
const { scheduleBookingCleanup } = require('./utils/bookingCleanup');
app.use(express.json());
app.use(express.static("static"));
app.use(cors());

// WhatsApp QR Route
app.get('/qr', (req, res) => {
  if (!whatsappService.qrCodeData) {
    return res.send('Please wait... QR is being generated.');
  }
  res.send(`
    <html>
      <body style="text-align:center;">
        <h2>Scan the WhatsApp QR</h2>
        <img src="${whatsappService.qrCodeData}" alt="QR Code" style="width:300px;height:300px;" />
      </body>
    </html>
  `);
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas Connected Successfully");
    // Start the booking cleanup scheduler
    scheduleBookingCleanup();
    console.log("✅ Booking cleanup scheduler started");
  })
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
app.use('/chat', chatRoutes);
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.env.PORT || 3000;

// Export the Express API
module.exports = app;

// Start the server
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server URL: http://localhost:${port}`);
    console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
    console.log(`📲 Scan WhatsApp QR at http://localhost:${port}/qr`);
  }
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

