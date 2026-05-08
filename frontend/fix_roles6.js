const fs = require('fs');

// 1. Fix authStore.ts
let authStorePath = 'D:/Ride_Booking_App/frontend/src/store/authStore.ts';
let authStore = fs.readFileSync(authStorePath, 'utf-8');
authStore = authStore.replace(/activeRole: 'customer' \| 'rider'/g, "activeRole: 'rider' | 'driver'");
authStore = authStore.replace(/setActiveRole: \(role: 'customer' \| 'rider'\)/g, "setActiveRole: (role: 'rider' | 'driver')");
authStore = authStore.replace(/activeRole: 'customer',/g, "activeRole: 'rider',");
fs.writeFileSync(authStorePath, authStore);

// 2. Fix DrawerNavigator.tsx
let drawerPath = 'D:/Ride_Booking_App/frontend/src/navigation/DrawerNavigator.tsx';
let drawer = fs.readFileSync(drawerPath, 'utf-8');
drawer = drawer.replace(/activeRole === 'customer'/g, "activeRole === 'rider'");
drawer = drawer.replace(/'customer' \? 'rider' : 'customer'/g, "'rider' ? 'driver' : 'rider'");
drawer = drawer.replace(/'customer' \? 'Driver' : 'Rider'/g, "'rider' ? 'Driver' : 'Rider'");
fs.writeFileSync(drawerPath, drawer);
console.log('Fixed storage and drawer string constants');
