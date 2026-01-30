# Ride Booking Server - Backend

A Node.js backend for the ride booking application with real-time WebSocket support.

## Tech Stack
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time communication
- **JWT** for authentication

## Features
- User authentication (Customer & Rider roles)
- Ride creation and management
- Real-time rider tracking
- Fare calculation for multiple vehicle types
- OTP verification for rides

## API Endpoints

### Authentication
- `POST /auth` - Login/Register user
- `POST /auth/refresh` - Refresh access token

### Rides
- `POST /ride/create` - Create a new ride
- `PATCH /ride/accept/:rideId` - Accept a ride (Rider only)
- `PATCH /ride/update-status/:rideId` - Update ride status
- `GET /ride/my-rides` - Get user's rides

## WebSocket Events

### Customer Events
- `subscribeToZone` - Subscribe to nearby riders updates
- `searchrider` - Start searching for a rider
- `cancelRide` - Cancel current ride

### Rider Events
- `goOnDuty` - Start accepting rides
- `goOffDuty` - Stop accepting rides
- `updateLocation` - Update current location

## Setup
1. Copy `.env.example` to `.env` and fill in the values
2. Install dependencies: `npm install`
3. Start the server: `npm start`
