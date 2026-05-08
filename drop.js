const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/RideBookingDB').then(() => {
    return mongoose.connection.db.collection('users').dropIndex('phone_1');
}).then(() => {
    console.log('done');
}).catch(console.error).finally(() => process.exit(0));
