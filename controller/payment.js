const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

exports.createPayment = async (req, res) => {
    try {
        const payment = new Payment(req.body);
        await payment.save();
        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find(req.query);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getPaymentsById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: "Payment not found" });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.updatePaymentById = async (req, res) => {
    try {
        const updatedPayment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPayment) return res.status(404).json({ message: "Payment not found" });
        res.json(updatedPayment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.deletePaymentById = async (req, res) => {
    try {
        const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
        if (!deletedPayment) return res.status(404).json({ message: "Payment not found" });
        res.json({ message: "Payment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.paymentsSummary = async (req, res) => {

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
}


//* paypal ------------------------------------------------------------------------------------------------------------------
const { client } = require("../paypalConfig");

exports.createPayPalPayment = async (req, res) => {
    try {
        const userId = req.user._id;

        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        const hasPendingProperty = booking.properties.some(prop => prop.status === 'pending');

        if (!hasPendingProperty) {
            return res.status(400).json({ message: "Cannot proceed with payment. No pending properties in the booking." });
        }
        const amount = booking.properties.reduce((total, property) => total + property.totalPrice, 0);
        console.log(amount);
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // Calculate tax 
        const taxRate = 0.14;
        const taxAmount = parseFloat((amount * taxRate).toFixed(2));
        const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

        const payment = new Payment({
            bookingId,
            userId,
            amount: totalAmount,
            status: "pending",
            paymentMethod: "paypal",
        });
        await payment.save();

        const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: totalAmount.toString(),
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: amount.toString()
                            },
                            tax_total: {
                                currency_code: "USD",
                                value: taxAmount.toString()
                            }
                        }
                    }
                }
            ],
            application_context: {
                return_url: "http://localhost:3000/payment/success",
                cancel_url: "http://localhost:3000/payment/cancel",
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING"
            }
        });

        const response = await client().execute(request);
        console.log("PayPal Create Order Response:", JSON.stringify(response.result, null, 2));

        const approvalUrl = response.result.links.find((link) => link.rel === "approve").href;
        res.json({
            paymentId: payment._id,
            approvalUrl,
            orderId: response.result.id,
            breakdown: {
                subtotal: amount.toString(),
                tax: taxAmount.toString(),
                total: totalAmount.toString()
            }
        });
        console.log("Payment record ID:", payment._id);
        console.log("PayPal Order ID:", response.result.id);
        console.log("Approval URL:", approvalUrl);
    } catch (error) {
        console.error("PayPal Create Order Error:", error);
        res.status(500).json({
            message: "Failed to create PayPal payment",
            error: error.response ? error.response.message : error.message
        });
    }
};

exports.executePayPalPayment = async (req, res) => {
    try {
        const { paymentId, orderId } = req.body;

        if (!paymentId || !orderId) {
            return res.status(400).json({ message: "Payment ID and Order ID are required" });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
        request.prefer("return=representation");

        const response = await client().execute(request);

        if (response.result.status === "COMPLETED") {
            payment.status = "completed";
            payment.transactionId = response.result.purchase_units[0].payments.captures[0].id;
            await payment.save();

            const booking = await Booking.findById(payment.bookingId);

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            await Booking.updateOne(
                { _id: payment.bookingId },
                { $set: { "properties.$[].status": "completed" } }
            );

            res.json({
                message: "Payment completed successfully",
                transactionId: payment.transactionId,
                status: payment.status,
                bookingStatus: "completed"
            });
        } else {
            payment.status = "failed";
            await payment.save();

            const booking = await Booking.findById(payment.bookingId);
            if (booking) {
                await Booking.updateOne(
                    { _id: payment.bookingId },
                    { $set: { "properties.$[elem].status": "cancelled" } },
                    {
                        arrayFilters: [{ "elem.status": "pending" }]
                    }
                );
            }

            res.status(400).json({
                message: "Payment failed",
                paypalStatus: response.result.status,
                bookingStatus: "cancelled"
            });
        }
    } catch (error) {
        console.error("PayPal execution error:", error);
        res.status(500).json({
            message: "Failed to execute PayPal payment",
            error: error.message
        });
    }
};
exports.paypalReturn = async (req, res) => {
    const { token } = req.query;

    console.log('Order ID returned from PayPal:', token);

    res.send('Payment Approved! Order ID: ' + token);
};
exports.paypalCancel = (req, res) => {
    res.send('Payment was cancelled by the user.');
}

exports.cancelPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        // Find the payment
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // Only allow cancellation of completed or pending payments
        if (!["completed", "pending"].includes(payment.status)) {
            return res.status(400).json({
                message: "Cannot cancel payment",
                details: `Payment is already ${payment.status}`
            });
        }

        // If payment was completed and has a PayPal transaction, process refund
        if (payment.status === "completed" && payment.transactionId && payment.paymentMethod === "paypal") {
            try {
                // Create a refund request
                const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(payment.transactionId);
                request.requestBody({
                    amount: {
                        currency_code: "USD",
                        value: payment.amount.toString()
                    },
                    note_to_payer: "Refund for cancelled booking"
                });

                // Process the refund
                const refundResponse = await client().execute(request);
                console.log("PayPal Refund Response:", JSON.stringify(refundResponse.result, null, 2));

                if (refundResponse.result.status === "COMPLETED") {
                    payment.status = "refunded";
                } else {
                    return res.status(400).json({
                        message: "Failed to process refund",
                        paypalStatus: refundResponse.result.status
                    });
                }
            } catch (refundError) {
                console.error("PayPal refund error:", refundError);
                return res.status(500).json({
                    message: "Failed to process PayPal refund",
                    error: refundError.message
                });
            }
        } else {
            // If payment was pending or non-PayPal, just mark as cancelled
            payment.status = "cancelled";
        }

        await payment.save();

        // Update the associated booking status
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
            booking.properties.forEach(property => {
                if (["pending", "completed"].includes(property.status)) {
                    property.status = "cancelled";
                }
            });
            await booking.save();
        }

        res.json({
            message: payment.status === "refunded" ?
                "Payment refunded successfully" :
                "Payment cancelled successfully",
            paymentId: payment._id,
            status: payment.status,
            bookingStatus: "cancelled"
        });
    } catch (error) {
        console.error("Cancel/Refund payment error:", error);
        res.status(500).json({
            message: "Failed to cancel/refund payment",
            error: error.message
        });
    }
};