const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin } = require("../middlewares/authrization");

const {
  add_category,
  getcategory,
  updatecategory,
  Deletecategory,
} = require("../controller/categoryHotel");

router.get("/", isAuthenticated, getcategory);

router.post("/", [isAuthenticated, authorizeAdmin], add_category);
router.patch("/:id", [isAuthenticated, authorizeAdmin], updatecategory);
router.delete("/:id", [isAuthenticated, authorizeAdmin], Deletecategory);

module.exports = router;
