import munkres from 'munkres-js';
import geolib from 'geolib';

/**
 * Solves the Bipartite Matching Problem using the Hungarian Algorithm (Munkres).
 * We aim to minimize the overall cost (ETA or Distance) for a batch of riders and a pool of drivers.
 * 
 * @param {Array} riders - Array of rider objects (must have pickup location)
 * @param {Array} drivers - Array of driver objects (must have current location)
 * @returns {Array} List of matches: { riderId, driverId, cost }
 */
export const matchRidersAndDrivers = (riders, drivers) => {
    if (!riders || riders.length === 0 || !drivers || drivers.length === 0) {
        return [];
    }

    // Cost matrix: rows are riders, columns are drivers
    const costMatrix = [];
    const MAX_COST = 999999; // Penalty for unmatchable distances or wrong vehicle types
    const MAX_SEARCH_RADIUS = 10000; // 10 km maximum pickup radius

    riders.forEach((rider) => {
        const row = [];
        drivers.forEach((driver) => {
            // If explicit vehicle boundaries exist, limit matching
            if (rider.vehicle && driver.profile?.vehicle?.type && rider.vehicle !== driver.profile.vehicle.type) {
                 row.push(MAX_COST);
                 return;
            }

            const { latitude: rLat, longitude: rLon } = rider.pickup;
            const { latitude: dLat, longitude: dLon } = driver.coords;

            // In a real-time production app, we would use our OSRM function here.
            // Since OSRM API is rate-limited for bulk calculations natively, 
            // geolib's Haversine works great as a real-time distance proxy proxy.
            const distanceMeters = geolib.getDistance(
                { latitude: dLat, longitude: dLon },
                { latitude: rLat, longitude: rLon }
            );

            // Assign standard distance; restrict to max pickup bounds
            if (distanceMeters > MAX_SEARCH_RADIUS) {
                row.push(MAX_COST);
            } else {
                row.push(distanceMeters);
            }
        });
        costMatrix.push(row);
    });

    // Run the matching algorithm on the cost matrix
    const munkresResult = munkres(costMatrix);

    const matches = [];
    munkresResult.forEach(([riderIndex, driverIndex]) => {
        const cost = costMatrix[riderIndex][driverIndex];
        
        // If cost is equal to MAX_COST, the algorithm matched them because 
        // matrices must be square/complete, but it's an invalid match.
        if (cost < MAX_COST) {
            matches.push({
                riderId: riders[riderIndex].rideId, // Identifier needed back in sockets
                driverId: drivers[driverIndex].riderId, // driver id (in code driver is 'rider' in some contexts)
                driverSocket: drivers[driverIndex].socketId,
                distanceMeters: cost
            });
        }
    });

    return matches;
};
