const fs = require('fs');
const file = './src/screens/home/LocationSearchScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldLoc = `    } catch (error) {
      console.error('Error getting current location:', error);
    }`;

const newLoc = `    } catch (error) {
      console.warn('Error getting current location:', error);
      try {
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation) {
          const coords = { latitude: lastLocation.coords.latitude, longitude: lastLocation.coords.longitude };
          if (isPickup) {
            setPickupLocation(coords, 'Current Location');
          } else {
            setDropLocation(coords, 'Current Location');
          }
          navigation.goBack();
        }
      } catch (err) {}
    }`;

if (content.includes(oldLoc)) {
  content = content.replace(oldLoc, newLoc);
  fs.writeFileSync(file, content);
  console.log('Fixed Location error in LocationSearchScreen.tsx');
}
