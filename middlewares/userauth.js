const jwt = require("jsonwebtoken");
const User = require("../models/users");


const isAuthenticated = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized, token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token and ensure it has an 'id' field
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.id) {
        throw new Error("Invalid token format");
      }
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized, invalid token" });
    }

    // Retrieve the user associated with the token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized, user not found" });
    }

    // Attach the user to the request object
    req.user = user;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized, invalid token" });
  }
};

module.exports = { isAuthenticated };