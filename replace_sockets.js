const fs = require('fs');
const path = 'd:/Ride_Booking_App/backend/controllers/sockets.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add driverStatus to socket.user
content = content.replace(/role: user\.role,/, 'role: user.role,\n        driverStatus: user.driverStatus,');

// 2. Remove role checks wrapping event listeners
// We can just remove `    if (user.role === "rider") {` and `    if (user.role === "customer") {`
// and their closing braces if we are careful, but it's nested deeply.
// Wait, the easiest way is to find the exact lines and remove them:
content = content.replace(/    if \(user\.role === "rider"\) \{\n/g, '');
// For the closing brace of rider:
content = content.replace(/      \}\);\n    \}\n\n    if \(user\.role === "customer"\) \{\n/g, '      });\n\n');
// For the closing brace of customer:
content = content.replace(/      \}\);\n    \}\n\n    socket\.on\("subscribeToriderLocation"/g, '      });\n\n    socket.on("subscribeToriderLocation"');

// 3. Update goOnDuty logic to check if they are a driver
content = content.replace(/socket\.on\("goOnDuty", \(coords\) => \{\n/g, 
  'socket.on("goOnDuty", (coords) => {\n        if (user.driverStatus !== "verified") return socket.emit("error", { message: "Only verified drivers can go on duty" });\n');

// 4. In updateNearbyriders(), we check if the user has coords (subscribed) rather than role
content = content.replace(/if \(socket\.user\?\.role === "customer"\) \{\n/g, 'if (socket.user?.coords) {\n');

// 5. In disconnect(), just remove the rider check since `delete` on Map is safe if missing
content = content.replace(/if \(user\.role === "rider"\) onDutyRiders\.delete\(user\.id\);\n/g, 'onDutyRiders.delete(user.id);\n');

// 6. Any other console logs with user.role:
content = content.replace(/console\.log\(`\$\{user\.role\} \$\{user\.id\} disconnected\.`\);/g, 'console.log(`User ${user.id} disconnected.`);');

fs.writeFileSync(path, content, 'utf8');
console.log('sockets.js updated');
