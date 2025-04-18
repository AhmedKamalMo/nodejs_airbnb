// amenityRoutes.js
const express = require("express");
const router = express.Router();
const { 
    createAmenity, 
    getAllAmenities, 
    getAmenityById, 
    updateAmenity, 
    deleteAmenity 
} = require("../controller/amenityController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Amenity:
 *       type: object
 *       required:
 *         - name
 *         - icon
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the amenity.
 *         name:
 *           type: string
 *           description: The name of the amenity.
 *         icon:
 *           type: string
 *           description: The icon URL of the amenity.
 *       example:
 *         id: 60d5ec49f8d2f81c8e4b7a1a
 *         name: Swimming Pool
 *         icon: https://example.com/icons/pool.png
 */

/**
 * @swagger
 * /amenities:
 *   post:
 *     summary: Create a new amenity
 *     tags: [Amenities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Amenity'
 *     responses:
 *       201:
 *         description: The amenity was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amenity'
 *       400:
 *         description: Some server error
 */
router.post("/", createAmenity);

/**
 * @swagger
 * /amenities:
 *   get:
 *     summary: Returns the list of all amenities
 *     tags: [Amenities]
 *     responses:
 *       200:
 *         description: The list of amenities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Amenity'
 */
router.get("/", getAllAmenities);

/**
 * @swagger
 * /amenities/{id}:
 *   get:
 *     summary: Get the amenity by id
 *     tags: [Amenities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The amenity id
 *     responses:
 *       200:
 *         description: The amenity description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amenity'
 *       404:
 *         description: The amenity was not found
 */
router.get("/:id", getAmenityById);

/**
 * @swagger
 * /amenities/{id}:
 *   put:
 *     summary: Update the amenity by id
 *     tags: [Amenities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The amenity id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Amenity'
 *     responses:
 *       200:
 *         description: The amenity was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Amenity'
 *       404:
 *         description: The amenity was not found
 *       400:
 *         description: Some error happened
 */
router.put("/:id", updateAmenity);

/**
 * @swagger
 * /amenities/{id}:
 *   delete:
 *     summary: Remove the amenity by id
 *     tags: [Amenities]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The amenity id
 *     responses:
 *       200:
 *         description: The amenity was deleted
 *       404:
 *         description: The amenity was not found
 */
router.delete("/:id", deleteAmenity);

module.exports = router;