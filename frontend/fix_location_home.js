const fs = require('fs');
const file = './src/screens/home/HomeScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldLoc = `      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(coords);`;

const newLoc = `      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
  
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);
      } catch (err) {
        console.warn('Error getting location:', err);
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation) {
          const coords = { latitude: lastLocation.coords.latitude, longitude: lastLocation.coords.longitude };
          setCurrentLocation(coords);
        } else {
             // Let it be, or handle gracefully without crashing
        }
      }`;

if (content.includes('Location.getCurrentPositionAsync({')) {
  content = content.replace(oldLoc, newLoc);
  fs.writeFileSync(file, content);
  console.log('Fixed Location error in HomeScreen.tsx');
}
