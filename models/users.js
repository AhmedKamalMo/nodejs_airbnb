const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   firstName: {
//     type: String,
//     required: true,
//     trim: true,
//     minlength: 2,
//     maxlength: 50,
//   },
//   lastName: {
//     type: String,
//     required: true,
//     trim: true,
//     minlength: 2,
//     maxlength: 50,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//     match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
//   },
//   password: { type: String, required: true, minlength: 6 },
//   phone: {
//     type: String,
//     required: false,
//     match: [/^(01)(0|1|2|5)\d{8}$/, "Invalid phone number"],
//   },
//   profileImage: { type: String, trim: true },
//   dateOfBirth: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function (value) {
//         const ageDiff = new Date().getFullYear() - value.getFullYear();
//         return ageDiff >= 18;
//       },
//       message: "User must be at least 18 years old",
//     },
//   },
//   gender: { type: String, enum: ["Male", "Female"], required: false },
//   address: {
//     country: { type: String, required: true, trim: true },
//     city: { type: String, required: true, trim: true },
//   },
//   role: { type: String, enum: ["Guest", "Host", "Admin"], default: "Guest" },

//   hostDetails: {
//     isSuperHost: { type: Boolean, default: false },

//     reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
//   },

//   bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],

//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
//   wishlist: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Hotel',
//   }]
// });

// userSchema.pre("save", async function (next) {
//   try {
//     if (!this.isModified("password")) {
//       return next();
//     }
//     let salt = await bcrypt.genSalt(10);
//     let hashedPassword = await bcrypt.hash(this.password, salt);
//     this.password = hashedPassword;
//     this.updatedAt = Date.now();
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = mongoose.model("User", userSchema);

// upadte with ghadad
const userSchema = new mongoose.Schema({
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    firstName: {
    type: String,
    required: false,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },
  password: { type: String, required: false, minlength: 6 },
  phone: {
    type: String,
    required: false,
    match: [/^(01)(0|1|2|5)\d{8}$/, "Invalid phone number"],
  },
  profileImage: { type: String, trim: true },
  dateOfBirth: {
    type: Date,
    required: false,
    validate: {
      validator: function (value) {
        const ageDiff = new Date().getFullYear() - value.getFullYear();
        return ageDiff >= 18;
      },
      message: "User must be at least 18 years old",
    },
  },
  gender: { type: String, enum: ["Male", "Female"], required: false },
  address: {
    country: { type: String, required: false, trim: true },
    city: { type: String, required: false, trim: true },
  },
  name: String,
  email: { type: String, required: true, unique: true },
  googleId: String,
  avatar: String,
  isGoogleUser: { type: Boolean, default: false },
  role: { type: String, enum: ["Guest", "Host", "Admin"], default: "Guest" },
    hostDetails: {
    isSuperHost: { type: Boolean, default: false },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },

  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  }]
});

module.exports = mongoose.model('User', userSchema);
