const fs = require('fs');
const path = 'd:/Ride_Booking_App/backend/controllers/sockets.js';
let content = fs.readFileSync(path, 'utf8');

// Add driverStatus to socket.user
content = content.replace(/role: user\.role,/, 'role: user.role,\n        driverStatus: user.driverStatus,');

// Remove strict role if blocks
content = content.replace(/    if \(user\.role === "rider"\) \{/g, '');
content = content.replace(/    if \(user\.role === "customer"\) \{/g, '');
content = content.replace(/\n    \}\n\n    socket\.on\("subscribeToriderLocation"/, '\n\n    socket.on("subscribeToriderLocation"'); 
// The above might be tricky with regex due to spacing, instead I'll use a string replacement or carefully crafted regex.
