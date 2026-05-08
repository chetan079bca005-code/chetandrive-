const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf-8');
  
  // ensure activeRole is grabbed
  if (content.includes('useAuthStore()') && !content.includes('activeRole')) {
     content = content.replace(/const \{([^}]+?user[^}]+)\} = useAuthStore\(\);/, 'const {, activeRole} = useAuthStore();');
     if(!content.includes('activeRole')) {
         content = content.replace(/const \{([^}]+)\} = useAuthStore\(\);/g, 'const {, activeRole} = useAuthStore();');
     }
  }
  
  content = content.replace(/user\?\.role === 'rider'/g, "activeRole === 'rider'");
  content = content.replace(/user\?\.role !== 'rider'/g, "activeRole !== 'rider'");
  content = content.replace(/user\?\.role/g, "activeRole");

  fs.writeFileSync(path, content);
  console.log('Fixed', path);
}

const files = [
  'D:/Ride_Booking_App/frontend/src/screens/home/HomeScreen.tsx',
  'D:/Ride_Booking_App/frontend/src/screens/profile/ProfileScreen.tsx',
  'D:/Ride_Booking_App/frontend/src/screens/ride/RequestsScreen.tsx',
  'D:/Ride_Booking_App/frontend/src/screens/ride/RideCompletionScreen.tsx',
  'D:/Ride_Booking_App/frontend/src/screens/ride/RideTrackingScreen.tsx'
];

files.forEach(replaceFile);
