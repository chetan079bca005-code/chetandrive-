import axios from 'axios';

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// OSRM routing implementation for real road distances and ETAs
export const calculateRouteOSRM = async (lat1, lon1, lat2, lon2) => {
  try {
    // OSRM coordinates are in longitude,latitude order
    const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await axios.get(url);
    if (response.data.code === 'Ok' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distanceInfo: route.distance / 1000, // convert meters to km
        durationInfo: route.duration / 60, // convert seconds to minutes
      };
    }
  } catch (error) {
    console.error("OSRM Error, falling back to Haversine:", error.message);
  }
  
  // Fallback to bird's-eye distance (Haversine)
  const fallbackDistance = calculateDistance(lat1, lon1, lat2, lon2);
  // Estimate duration assuming 40 km/h average city speed
  const fallbackDuration = (fallbackDistance / 40) * 60; 
  return { distanceInfo: fallbackDistance, durationInfo: fallbackDuration };
};

export const calculateFare = (distance) => {
  const rateStructure = {
    bike: { baseFare: 10, perKmRate: 5, minimumFare: 25 },
    auto: { baseFare: 15, perKmRate: 7, minimumFare: 30 },
    cabEconomy: { baseFare: 20, perKmRate: 10, minimumFare: 50 },
    cabPremium: { baseFare: 30, perKmRate: 15, minimumFare: 70 },
    pickupTruck: { baseFare: 200, perKmRate: 30, minimumFare: 400 },
    miniTruck: { baseFare: 350, perKmRate: 45, minimumFare: 700 },
    largeTruck: { baseFare: 600, perKmRate: 70, minimumFare: 1200 },
    containerTruck: { baseFare: 1000, perKmRate: 110, minimumFare: 2000 },
  };

  const fareCalculation = (baseFare, perKmRate, minimumFare) => {
    const calculatedFare = baseFare + distance * perKmRate;
    return Math.max(calculatedFare, minimumFare);
  };

  return {
    bike: fareCalculation(
      rateStructure.bike.baseFare,
      rateStructure.bike.perKmRate,
      rateStructure.bike.minimumFare
    ),
    auto: fareCalculation(
      rateStructure.auto.baseFare,
      rateStructure.auto.perKmRate,
      rateStructure.auto.minimumFare
    ),
    cabEconomy: fareCalculation(
      rateStructure.cabEconomy.baseFare,
      rateStructure.cabEconomy.perKmRate,
      rateStructure.cabEconomy.minimumFare
    ),
    cabPremium: fareCalculation(
      rateStructure.cabPremium.baseFare,
      rateStructure.cabPremium.perKmRate,
      rateStructure.cabPremium.minimumFare
    ),
    pickupTruck: fareCalculation(
      rateStructure.pickupTruck.baseFare,
      rateStructure.pickupTruck.perKmRate,
      rateStructure.pickupTruck.minimumFare
    ),
    miniTruck: fareCalculation(
      rateStructure.miniTruck.baseFare,
      rateStructure.miniTruck.perKmRate,
      rateStructure.miniTruck.minimumFare
    ),
    largeTruck: fareCalculation(
      rateStructure.largeTruck.baseFare,
      rateStructure.largeTruck.perKmRate,
      rateStructure.largeTruck.minimumFare
    ),
    containerTruck: fareCalculation(
      rateStructure.containerTruck.baseFare,
      rateStructure.containerTruck.perKmRate,
      rateStructure.containerTruck.minimumFare
    ),
  };
};

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
