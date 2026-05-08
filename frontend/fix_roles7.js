const fs = require('fs');

let drawerPath = 'D:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx';
let drawer = fs.readFileSync(drawerPath, 'utf-8');
drawer = drawer.replace(/activeRole === 'rider' \? 'rider' : 'customer'/g, "activeRole === 'rider' ? 'driver' : 'rider'");
drawer = drawer.replace(/activeRole === 'rider' \? 'Driver' : 'Rider'/g, "activeRole === 'rider' ? 'Driver' : 'Rider'");
fs.writeFileSync(drawerPath, drawer);

let profilePath = 'D:/Ride_Booking_App/frontend/src/screens/profile/ProfileScreen.tsx';
let profile = fs.readFileSync(profilePath, 'utf-8');
profile = profile.replace(/user\?\.role === 'rider'/g, "activeRole === 'rider'");
profile = profile.replace(/user\?\.role/g, "activeRole");
fs.writeFileSync(profilePath, profile);

console.log('Fixed');
