const cron = require('node-cron');
const Booking = require('../models/Booking');

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

const scheduleBookingCleanup = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running booking cleanup job...');
    await cleanupExpiredBookings();
  });
};

module.exports = { scheduleBookingCleanup };
