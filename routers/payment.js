const express = require("express");
const Payment = require("../models/Payment");
const { createPayment, getPayments, getPaymentsById, updatePaymentById, deletePaymentById, paymentsSummary, createPayPalPayment, executePayPalPayment, cancelPayment, paypalReturn, paypalCancel } = require("../controller/payment");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/userauth");
const { authorizeAdmin, authorizeAdminOrHost } = require("../middlewares/authrization");

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
 *           enum: ["pending", "completed", "failed", "cancelled", "refunded"]
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
router.post("/", [isAuthenticated, authorizeAdmin], createPayment);

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
router.get("/", [isAuthenticated, authorizeAdminOrHost], getPayments);

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
router.get("/:id", [isAuthenticated, authorizeAdmin], getPaymentsById);

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
router.put("/:id", [isAuthenticated, authorizeAdmin], updatePaymentById);

/**
 * @swagger
 * /payments/{paymentId}/cancel:
 *   post:
 *     summary: Cancel a pending payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment to cancel
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *       400:
 *         description: Cannot cancel payment (e.g., already completed/cancelled)
 *       404:
 *         description: Payment not found
 */
router.post("/:paymentId/cancel", isAuthenticated, cancelPayment);
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
router.delete("/:id", [isAuthenticated, authorizeAdmin], deletePaymentById);


/**
 * @swagger
 * /payments/payment/summary:
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
router.get("/payment/summary", [isAuthenticated, authorizeAdmin], paymentsSummary);

router.post("/create-paypal-payment", [isAuthenticated], createPayPalPayment);
router.post("/execute-paypal-payment", [isAuthenticated], executePayPalPayment);

router.get('/paypal/return', paypalReturn)

router.get('/paypal/cancel', paypalCancel);
module.exports = router;
