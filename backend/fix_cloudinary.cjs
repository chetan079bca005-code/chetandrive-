const fs = require('fs');
const file = './controllers/auth.js';
let content = fs.readFileSync(file, 'utf8');

// Ensure import is added
if (!content.includes('from "../utils/cloudinary.js"')) {
  content = content.replace('import User from "../models/User.js";', 'import User from "../models/User.js";\nimport { uploadImage } from "../utils/cloudinary.js";');
}

const oldCode = `  user.name = name || user.name;
  user.dob = dob;
  user.driverPhoto = driverPhoto;
  
  user.license = {
    number: licenseNumber,
    photo: licensePhoto,
    expDate: licenseExpDate,
  };

  user.vehicle = {
    ...user.vehicle,
    make,
    model,
    color,
    licensePlate,
    year,
    capacity,
    type: vehicleType,
  };

  user.registration = {
    photo: registrationPhoto,
  };`;

const newCode = `  // Upload images to Cloudinary
  let driverPhotoUrl = driverPhoto;
  let licensePhotoUrl = licensePhoto;
  let registrationPhotoUrl = registrationPhoto;

  try {
    if (driverPhoto) driverPhotoUrl = await uploadImage(driverPhoto);
    if (licensePhoto) licensePhotoUrl = await uploadImage(licensePhoto);
    if (registrationPhoto) registrationPhotoUrl = await uploadImage(registrationPhoto);
  } catch (error) {
    throw new BadRequestError("Failed to upload images. Please try again.");
  }

  user.name = name || user.name;
  user.dob = dob;
  user.driverPhoto = driverPhotoUrl;
  
  user.license = {
    number: licenseNumber,
    photo: licensePhotoUrl,
    expDate: licenseExpDate,
  };

  user.vehicle = {
    ...user.vehicle,
    make,
    model,
    color,
    licensePlate,
    year,
    capacity,
    type: vehicleType,
  };

  user.registration = {
    photo: registrationPhotoUrl,
  };`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(file, content);
  console.log('Updated auth.js with Cloudinary image upload');
} else {
  console.log('Could not find the block to replace.');
}