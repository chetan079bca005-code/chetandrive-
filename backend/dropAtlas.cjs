const mongoose = require('mongoose');
const uri = 'mongodb+srv://chetankoirala64_db_user:zIRDIr8WIfTsx3FL@cluster0.ihqmvgc.mongodb.net/ride_booking?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(async () => {
    const coll = mongoose.connection.db.collection('users');
    try {
        await coll.dropIndex('phone_1');
        console.log('phone_1 index dropped.');
    } catch (e) {
        console.log('phone_1 index not found or already dropped.', e.message);
    }
    
    // Also, if there are existing users with 'phone' as null or empty string, let's fix them:
    const result = await coll.updateMany({ phone: { $in: ['', null] } }, { $set: { phone: undefined } });
    console.log('Updated users:', result.modifiedCount);

}).catch(console.error).finally(() => process.exit(0));
