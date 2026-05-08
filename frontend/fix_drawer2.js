const fs = require('fs');
let content = fs.readFileSync('D:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx', 'utf-8');
content = content.replace(/Alert\.alert\('Application Status', \\Your driver application is currently \\\\\);/g, "Alert.alert('Application Status', \Your driver application is currently \\);");
content = content.replace(/""/g, '"');
fs.writeFileSync('D:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx', content);
