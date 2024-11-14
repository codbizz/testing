var MONGODB_URL = process.env.MONGODB_URL
var mongoose = require('mongoose')
const {
  refreshPendingTransationStatus,
  removeExpiredPurchase
} = require('../controllers/cron_job/cron')
var cron = require('node-cron')
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  replicaSet: 'rs', // Specify the replica set name
};

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    //don't show the log when it is test
    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to %s', MONGODB_URL)
      console.log('App is running ... \n')
      console.log('Press CTRL + C to stop the process \n')
    }

    // cron.schedule('* * * * *', async () => {
    //   console.log('cron job is running every min for testing')
      // removeExpiredPurchase()
    //   refreshPendingTransationStatus()
    // })
    // cron.schedule('* 4 * * *', async () => {
    //   console.log('cron job is running every day at 4 AM')
    //   removeExpiredPurchase()
    // })
    // cron.schedule('* 6 * * *', async () => {
    //   console.log('cron job is running every day at 6 AM')
    //   refreshPendingTransationStatus()
    // })
  })
  .catch(err => {
    console.error('App starting error:', err.message)
    process.exit(1)
  })
