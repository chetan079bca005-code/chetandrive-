const fs = require('fs');
let content = fs.readFileSync('D:/Ride_Booking_App/frontend/src/screens/auth/SplashScreen.tsx', 'utf-8');

content = content.replace(
  /if \(user\?\.role === 'rider' && user\?\.driverStatus !== 'verified'\) \{[\s\S]*?\} else \{/,
  "if (user?.driverStatus === 'pending') {\n          navigation.replace('DriverRegistration');\n        } else {"
);

fs.writeFileSync('D:/Ride_Booking_App/frontend/src/screens/auth/SplashScreen.tsx', content);
console.log('Splash updated');
