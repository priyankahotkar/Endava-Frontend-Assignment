export const LOTS = [
  { id: "central-plaza", name: "Central Plaza Garage", address: "0.8 km · Covered · EV charging", lat: 12.9716, lng: 77.5946, ratePerHour: 3.5, ratePerDay: 24, slug: "central-plaza", slotsByType: { Car: 18, Bike: 8, EV: 4 } },
  { id: "riverside", name: "Riverside Lot", address: "2.1 km · Outdoor · Accessible", lat: 12.9352, lng: 77.6245, ratePerHour: 2, ratePerDay: 12, slug: "riverside", slotsByType: { Car: 42, Bike: 15, EV: 0 } },
  { id: "old-town", name: "Old Town Street Parking", address: "1.6 km · Street · Metered", lat: 12.9654, lng: 77.6012, ratePerHour: 2, ratePerDay: null, slug: "old-town", slotsByType: { Car: 20, Bike: 10, EV: 0 } },
  { id: "airport", name: "Airport Long Stay", address: "7.4 km · Shuttle · 24/7", lat: 13.1989, lng: 77.7068, ratePerHour: 4, ratePerDay: 18, slug: "airport", slotsByType: { Car: 120, Bike: 30, EV: 12 } },
];

export function getSlotsForLot(lotId, vehicleType) {
  const lot = LOTS.find((l) => l.id === lotId);
  if (!lot || !lot.slotsByType[vehicleType]) return [];
  const count = lot.slotsByType[vehicleType];
  const prefix = vehicleType === "Car" ? "A" : vehicleType === "Bike" ? "B" : "E";
  return Array.from({ length: count }, (_, i) => ({
    id: `${lotId}-${prefix}-${String(i + 1).padStart(2, "0")}`,
    number: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    type: vehicleType,
  }));
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Map vehicle types from vehicles to slot types
export function getSlotTypeForVehicle(vehicleType) {
  const typeMap = {
    'Sedan': 'Car',
    'SUV': 'Car',
    'Hatchback': 'Car',
    'Motorcycle': 'Bike',
    'Truck': 'Car', // Assuming trucks use car slots
    'Van': 'Car'
  };
  return typeMap[vehicleType] || 'Car'; // Default to Car if unknown type
}
