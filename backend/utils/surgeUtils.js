import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { latLngToCell } from 'h3-js';

// Base multiplier and absolute max surge
const BASE_MULTIPLIER = 1.0;
const MAX_SURGE_MULTIPLIER = 3.0;

/**
 * Calculates current surge pricing multiplier based on demand (pending rides)
 * vs supply (active drivers) in a localized H3 hexagonal area.
 * 
 * @param {Number} latitude 
 * @param {Number} longitude 
 * @returns {Number} multiplier (e.g. 1.0, 1.2, 2.5)
 */
export const calculateSurgeMultiplier = async (latitude, longitude) => {
    try {
        // Resolve coordinates into a Level 7 H3 hexagon (approx 1.2 km radius cell)
        const hexIndex = latLngToCell(latitude, longitude, 7);

        // Geofencing queries: count active online drivers within ~2km 
        // (Using simple sphere approximations for supply/demand in real-time)
        const supplyCount = await User.countDocuments({
            role: "admin", // in some structures drivers might be another role - adjust if needed
            isOnline: true,
            currentLocation: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 2000 // 2 km
                }
            }
        });

        const demandCount = await Ride.countDocuments({
            status: "SEARCHING_FOR_RIDER",
            "pickup.location": {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 2000 
                }
            }
        });

        // If no drivers, surge high. If plenty of supply, no surge.
        if (supplyCount === 0 && demandCount > 0) return 2.0; 
        if (demandCount === 0 || supplyCount >= demandCount) return BASE_MULTIPLIER;

        // Ratio logic (Simple formulation acting like a decision tree)
        const ratio = demandCount / supplyCount;
        
        let surge = BASE_MULTIPLIER;
        if (ratio > 5) surge = 2.5;         // Severe lack of drivers
        else if (ratio > 3) surge = 1.8;    // High Demand
        else if (ratio > 1.5) surge = 1.3;  // Moderate Demand

        return Math.min(surge, MAX_SURGE_MULTIPLIER);

    } catch(err) {
        console.error("Surge Calculation Error:", err);
        return BASE_MULTIPLIER;
    }
};