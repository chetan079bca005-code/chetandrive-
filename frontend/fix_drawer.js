const fs = require('fs');
let content = fs.readFileSync('D:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx', 'utf-8');
content = content.replace(/Alert\.alert\([^\]]+\\Your driver application is currently \\\\\);/g, "Alert.alert('Application Status', \Your driver application is currently \\);");
console.log(content.includes('Application Status'));
fs.writeFileSync('D:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx', content);
