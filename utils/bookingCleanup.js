const cron = require('node-cron');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const cleanupExpiredBookings = async () => {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = await Booking.updateMany(
      {
        'properties.status': 'pending',
        createdAt: { $lt: threeHoursAgo }
      },
      {
        $set: {
          'properties.$[elem].status': 'cancelled',
          'properties.$[elem].cancellationReason': 'Automatically cancelled due to pending status timeout'
        }
      },
      {
        arrayFilters: [{ 'elem.status': 'pending' }],
        multi: true
      }
    );
    console.log(`Cleaned up ${result.modifiedCount} expired pending bookings`);
  } catch (error) {
    console.error('Error cleaning up expired bookings:', error);
  }
};

const cleanupExpiredPayments = async () => {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = await Payment.updateMany(
      {
        status: 'pending',
        createdAt: { $lt: threeHoursAgo }
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: 'Automatically cancelled due to pending status timeout'
        }
      }
    );
    console.log(`Cleaned up ${result.modifiedCount} expired payments`);
  } catch (error) {
    console.error('Error cleaning up expired payments:', error);
  }
};

// --- جدولة المهام ---
const scheduleBookingCleanup = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running booking cleanup job...');
    await cleanupExpiredBookings();
  });

  cron.schedule('*/30 * * * *', async () => {
    console.log('Running payment cleanup job...');
    await cleanupExpiredPayments();
  });
};

module.exports = { scheduleBookingCleanup };