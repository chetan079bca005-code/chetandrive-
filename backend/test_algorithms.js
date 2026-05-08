import { matchRidersAndDrivers } from './utils/matcher.js';
import { calculateRouteOSRM } from './utils/mapUtils.js';

async function runTests() {
    console.log("=== Testing OSRM Routing ===");
    // Test points: e.g., two points in Delhi or New York
    const lat1 = 28.7041, lon1 = 77.1025;
    const lat2 = 28.5355, lon2 = 77.3910;
    
    try {
        const route = await calculateRouteOSRM(lat1, lon1, lat2, lon2);
        console.log("OSRM Route Result:", route);
    } catch (e) {
        console.error("OSRM Test Failed:", e.message);
    }

    console.log("\n=== Testing Hungarian Matching Algorithm ===");
    const mockRiders = [
        { rideId: 'ride_1', pickup: { latitude: 28.7041, longitude: 77.1025 } },
        { rideId: 'ride_2', pickup: { latitude: 28.5355, longitude: 77.3910 } }
    ];
    
    const mockDrivers = [
        { riderId: 'driver_1', socketId: 'sock_1', coords: { latitude: 28.7050, longitude: 77.1000 } }, // close to ride_1
        { riderId: 'driver_2', socketId: 'sock_2', coords: { latitude: 28.5360, longitude: 77.3900 } }  // close to ride_2
    ];

    const matches = matchRidersAndDrivers(mockRiders, mockDrivers);
    console.log("Matches:", matches);
    
    console.log("\nTests completed.");
}

runTests();