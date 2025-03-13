const Payment = require("../models/Payment");

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