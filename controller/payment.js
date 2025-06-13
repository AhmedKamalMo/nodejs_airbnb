const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const mongoose = require("mongoose");
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
        const hostId = req.user._id;

        if (req.user.role === "Host") {
            const payments = await Payment.aggregate([
                // ربط المدفوعات بالحجز
                {
                    $lookup: {
                        from: "bookings",         // اسم collection bookings
                        localField: "bookingId",
                        foreignField: "_id",
                        as: "bookingDetails"
                    }
                },
                { $unwind: "$bookingDetails" }, // نجعل bookingDetails كائن وليس array

                // ربط الحجز بالعقارات
                {
                    $lookup: {
                        from: "hotels",           // اسم collection hotels
                        localField: "bookingDetails.properties.propertyId",
                        foreignField: "_id",
                        as: "hotelDetails"
                    }
                },
                { $unwind: "$hotelDetails" }, // نجعل hotelDetails كائن

                // التأكد أن العقار يعود للمستخدم الحالي
                {
                    $match: {
                        "hotelDetails.hostId": new mongoose.Types.ObjectId(hostId)
                    }
                },

                // (اختياري) إزالة بيانات غير ضرورية من الاستجابة
                {
                    $project: {
                        bookingDetails: 0,
                        hotelDetails: 0
                    }
                }
            ]);

            if (!payments.length) {
                return res.status(404).json({ message: "No payments found for this host." });
            }

            return res.status(200).json(payments);
        }

        // إذا لم يكن Host، نرسل كل المدفوعات حسب الفلاتر
        const payments = await Payment.find(req.query);
        return res.json(payments);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

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
        const { role, _id: userId } = req.user;

        let matchStage = {};

        if (role === "Host") {
            // جلب جميع الحجوزات مع تعبئة بيانات العقارات
            const hostBookings = await Booking.find().populate({
                path: "properties",
                select: "hostId"
            }).exec();

            // التأكد من أن البيانات موجودة قبل الوصول إليها
            const validHostBookingIds = hostBookings
                .filter(booking => {
                    return booking.properties?.hostId?.toString() === userId.toString();
                })
                .map(booking => booking._id);

            matchStage = { bookingId: { $in: validHostBookingIds } };
        } else if (role !== "Admin") {
            return res.status(403).json({
                message: "Access denied. Only admins and hosts can view payment summaries."
            });
        }

        // جلب إحصائيات المدفوعات حسب الحالة
        const statusCounts = await Payment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    amount: { $sum: "$amount" }
                }
            }
        ]);

        const summary = {
            totalPayments: 0,
            completedPayments: 0,
            pendingPayments: 0,
            failedPayments: 0,
            refundedPayments: 0,
            totalAmount: 0,
            completedAmount: 0,
            pendingAmount: 0,
            refundedAmount: 0
        };

        statusCounts.forEach(({ _id: status, count, amount }) => {
            summary.totalPayments += count;
            summary.totalAmount += amount;

            switch (status) {
                case "completed":
                    summary.completedPayments = count;
                    summary.completedAmount = amount;
                    break;
                case "pending":
                    summary.pendingPayments = count;
                    summary.pendingAmount = amount;
                    break;
                case "failed":
                    summary.failedPayments = count;
                    break;
                case "refunded":
                    summary.refundedPayments = count;
                    summary.refundedAmount = amount;
                    break;
            }
        });

        res.json(summary);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


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
                        value: totalAmount.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: amount.toFixed(2)
                            },
                            tax_total: {
                                currency_code: "USD",
                                value: taxAmount.toFixed(2)
                            }
                        }
                    }
                }
            ],
            application_context: {
                return_url: `https://airbnb-reactproject.vercel.app/payment/success?Paymentid=${payment._id}`,
                cancel_url: "https://fundamental-amitie-ahmedkamal-a550a1ad.koyeb.app/payment/cancel",
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

        // // Find the associated booking to calculate refund
        // const bookingDetails = await Booking.findById(payment.bookingId);
        // if (!bookingDetails) {
        //     return res.status(404).json({ message: "Associated booking not found" });
        // }

        // // Validate booking has properties
        // if (!bookingDetails.properties || bookingDetails.properties.length === 0) {
        //     return res.status(400).json({ message: "No properties found in booking" });
        // }

        // // Calculate refund amount based on remaining days
        // const now = new Date();
        // const checkIn = new Date(bookingDetails.properties[0].startDate);
        // const checkOut = new Date(bookingDetails.properties[0].endDate);

        // // Validate dates
        // if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        //     return res.status(400).json({ message: "Invalid booking dates" });
        // }

        // const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        // const remainingDays = Math.ceil((checkOut - now) / (1000 * 60 * 60 * 24));

        // // If the check-in date hasn't passed, refund the full amount
        // // If check-in date has passed, calculate refund based on remaining days
        // const refundPercentage = now < checkIn ? 1 : Math.max(0, remainingDays / totalDays);
        // const refundAmount = payment.amount * refundPercentage;

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
                    note_to_payer: `Refund for cancelled booking )`
                });

                // Process the refund
                const refundResponse = await client().execute(request);
                console.log("PayPal Refund Response:", JSON.stringify(refundResponse.result, null, 2));

                if (refundResponse.result.status === "COMPLETED") {
                    payment.status = "refunded";
                    // payment.refundAmount = refundAmount;
                    // payment.refundDate = new Date();
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
        // Save payment after booking is updated
        await payment.save();

        res.json({
            message: payment.status === "refunded" ?
                `Payment refunded successfully ` :
                "Payment cancelled successfully",
            paymentId: payment._id,
            status: payment.status,
            bookingStatus: "cancelled",
            // refundAmount: refundAmount.toFixed(2),
            // refundPercentage: Math.round(refundPercentage * 100)
        });
    } catch (error) {
        console.error("Cancel/Refund payment error:", error);
        res.status(500).json({
            message: "Failed to cancel/refund payment",
            error: error.message
        });
    }
};