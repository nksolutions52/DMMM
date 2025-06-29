const cron = require('node-cron');
const checkRenewalDues = require('./check-renewal-dues');

// Schedule renewal dues check to run daily at 6:00 AM
const scheduleRenewalCheck = () => {
  console.log('🕕 Scheduling daily renewal dues check at 6:00 AM...');
  
  // Run every day at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ Running scheduled renewal dues check...');
    try {
      const result = await checkRenewalDues();
      console.log('✅ Scheduled renewal dues check completed:', result);
    } catch (error) {
      console.error('❌ Scheduled renewal dues check failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });

  // Also run every Monday at 9:00 AM for weekly check
  cron.schedule('0 9 * * 1', async () => {
    console.log('📅 Running weekly renewal dues check...');
    try {
      const result = await checkRenewalDues();
      console.log('✅ Weekly renewal dues check completed:', result);
    } catch (error) {
      console.error('❌ Weekly renewal dues check failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('✅ Renewal dues check scheduler initialized');
};

// Run if called directly
if (require.main === module) {
  scheduleRenewalCheck();
  console.log('🚀 Cron scheduler started. Press Ctrl+C to stop.');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping cron scheduler...');
    process.exit(0);
  });
}

module.exports = scheduleRenewalCheck;