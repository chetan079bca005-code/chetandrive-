import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary configured ✅");

export const uploadImage = async (base64String) => {
  if (!base64String || (!base64String.startsWith('data:image') && !base64String.startsWith('file://'))) {
    return base64String; // Return as is if it's already a URL or empty
  }
  
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'ride_booking_app',
    });
    console.log("Uploaded successfully:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed');
  }
};
