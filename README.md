<!-- # 🚕 ChetanDrive - Full Stack Ride Booking App

![ChetanDrive](https://img.shields.io/badge/ChetanDrive-Ride%20Booking-yellow?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

A full-stack ride booking application for Nepal, built with modern technologies.

<div align="center">
  <img src="https://res.cloudinary.com/dve6uywal/image/upload/v1740041169/js62de3rwhasf8vi2vdv.jpg" alt="App Screenshot" width="600" />
  
  <br/>

  <a href="https://m.youtube.com/watch?v=u_8-jF01hW8">
    <img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube">
  </a>
</div>

## 🗿 Tech Stack

### Frontend (Mobile App)
- **Expo** (New Architecture enabled)
- **React Native** with TypeScript
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** for state management
- **React Navigation** for routing
- **React Native Maps** for maps integration
- **Socket.io Client** for real-time updates

### Backend (Server)
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for WebSocket communication
- **JWT** for authentication

## 📁 Project Structure

```
Ride_Booking_Server/
├── backend/                    # Node.js Backend
│   ├── config/                # Database configuration
│   ├── controllers/           # Route handlers
│   ├── errors/                # Custom error classes
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API routes
│   ├── utils/                 # Utility functions
│   └── app.js                 # Server entry point
│
├── frontend/                   # Expo React Native App
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── config/            # App configuration
│   │   ├── navigation/        # React Navigation setup
│   │   ├── screens/           # App screens
│   │   ├── services/          # API & Socket services
│   │   ├── store/             # Zustand state stores
│   │   └── types/             # TypeScript types
│   ├── assets/                # Images, fonts, etc.
│   └── App.tsx                # App entry point
│
└── README.md
```

## ✨ Features

### Customer App
- 📍 **Real-time location tracking**
- 🚗 **Multiple vehicle types** (Bike, Auto, Economy, Premium)
- 💰 **Fare estimation** before booking
- 🔍 **Smart destination search** with saved places
- 📱 **Real-time ride tracking**
- ⭐ **Driver ratings**
- 📜 **Ride history**

### Rider/Driver App
- 🟢 **Go online/offline** to accept rides
- 📍 **Real-time location updates**
- 📋 **Ride requests** with fare details
- 🗺️ **Navigation** to pickup and drop

### Backend Features
- 🔐 **JWT Authentication** with refresh tokens
- 🔄 **Real-time WebSocket** communication
- 📍 **Geolocation** for nearby drivers
- 💰 **Dynamic fare calculation**
- 🔢 **OTP verification** for rides

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Expo CLI
- Google Maps API Key

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update .env with your values:
# MONGO_URI=your_mongodb_uri
# ACCESS_TOKEN_SECRET=your_secret
# REFRESH_TOKEN_SECRET=your_secret

# Start the server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Update API URL in src/config/constants.ts
# API_URL = 'http://YOUR_IP:3000'

# Start Expo
npm start

# Run on device
npm run android  # or npm run ios
```

### OpenStreetMap Setup

This project uses free OpenStreetMap tiles with Nominatim (geocoding) and OSRM (routing). No paid API key is required.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth` | Login/Register |
| POST | `/auth/refresh` | Refresh token |
| POST | `/ride/create` | Create ride |
| PATCH | `/ride/accept/:id` | Accept ride |
| PATCH | `/ride/update-status/:id` | Update status |
| GET | `/ride/my-rides` | Get user rides |

## 🔌 WebSocket Events

### Customer Events
- `subscribeToZone` - Get nearby drivers
- `searchrider` - Search for a driver
- `cancelRide` - Cancel ride

### Driver Events
- `goOnDuty` - Start accepting rides
- `goOffDuty` - Stop accepting rides
- `updateLocation` - Update location

## 🎨 Design (ChetanDrive-inspired)

- **Primary Color:** Yellow `#FFDE00`
- **Secondary Color:** Black `#1A1A1A`
- **Success:** Green `#4CAF50`
- **Danger:** Red `#F44336`

## ⭐ Support & Stay Connected!  

If you found ChetanDrive helpful, consider giving it a **star** ⭐!  

📺 Don't forget to **like & subscribe** on [YouTube](https://m.youtube.com/watch?v=u_8-jF01hW8) for more awesome content.  

## 📄 License

This project is licensed under the ISC License.

---

Made with ❤️ for the ride-sharing community   -->



