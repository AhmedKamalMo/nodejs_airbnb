const express = require("express");
const Payment = require("../models/Payment");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the payment
 *         bookingId:
 *           type: string
 *           description: The ID of the booking associated with the payment
 *         userId:
 *           type: string
 *           description: The ID of the user who made the payment
 *         amount:
 *           type: number
 *           description: The amount paid
 *         status:
 *           type: string
 *           enum: ["pending", "completed", "failed", "refunded"]
 *         paymentMethod:
 *           type: string
 *           enum: ["credit_card", "debit_card", "paypal", "bank_transfer"]
 *         transactionId:
 *           type: string
 *           description: The transaction ID from the payment gateway
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments with optional filters
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: A list of payments
 *       500:
 *         description: Internal server error
 */
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find(req.query);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Update a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPayment) return res.status(404).json({ message: "Payment not found" });
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
    if (!deletedPayment) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * @swagger
 * /payments/summary:
 *   get:
 *     summary: Get a summary of payments
 *     description: Retrieve the total number of payments, breakdown by status, and total amounts per status.
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Successfully retrieved the payment summary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPayments:
 *                   type: integer
 *                   example: 100
 *                 completedPayments:
 *                   type: integer
 *                   example: 50
 *                 pendingPayments:
 *                   type: integer
 *                   example: 30
 *                 failedPayments:
 *                   type: integer
 *                   example: 10
 *                 refundedPayments:
 *                   type: integer
 *                   example: 10
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *                   example: 5000.75
 *                 completedAmount:
 *                   type: number
 *                   format: float
 *                   example: 2500.50
 *                 pendingAmount:
 *                   type: number
 *                   format: float
 *                   example: 1000.25
 *                 refundedAmount:
 *                   type: number
 *                   format: float
 *                   example: 500.00
 *       500:
 *         description: Server error
 */
router.get("/summary", async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ status: "completed" });
    const pendingPayments = await Payment.countDocuments({ status: "pending" });
    const failedPayments = await Payment.countDocuments({ status: "failed" });
    const refundedPayments = await Payment.countDocuments({ status: "refunded" });

    const totalAmount = await Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const completedAmount = await Payment.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const pendingAmount = await Payment.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const refundedAmount = await Payment.aggregate([{ $match: { status: "refunded" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
     console.log(refundedAmount + " " + pendingAmount + " " + pendingAmount + " " + refundedAmount)
    res.json({
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalAmount: totalAmount[0]?.total || 0,
      completedAmount: completedAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      refundedAmount: refundedAmount[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
