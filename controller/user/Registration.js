// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const usersModel = require("../../models/users");
// ghada update////
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// const Registration = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, dateOfBirth, address } = req.body;

//     if (!firstName || !lastName || !email || !password || !dateOfBirth || !address) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const existingUser = await usersModel.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     const newUser = new usersModel(req.body);
//     await newUser.save();

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// module.exports = Registration;
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'ID Token is required' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;

    // هنا تقدري تدخلي userId, email, name في قاعدة بياناتك
    console.log("User verified:", payload);

    res.json({
      success: true,
      user: {
        id: userId,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      }
    });

  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid ID Token' });
  }
};

module.exports = { googleLogin };