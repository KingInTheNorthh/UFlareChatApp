import { v2 as cloudinary } from "cloudinary";
import { config } from 'dotenv';

config();

// Check if Cloudinary environment variables are set
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
    console.error("CLOUDINARY CONFIGURATION ERROR: Missing environment variables!");
    console.log("Available env variables:", Object.keys(process.env).filter(key => key.includes('CLOUD')));
}

console.log("Configuring Cloudinary with cloud name:", process.env.CLOUDINARY_CLOUD_NAME ? "Found" : "Missing");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test the configuration
try {
    cloudinary.api.ping((error, result) => {
        if (error) {
            console.error("Cloudinary configuration test failed:", error.message);
        } else {
            console.log("Cloudinary configuration valid:", result.status === "ok" ? "OK" : "Not OK");
        }
    });
} catch (e) {
    console.error("Cloudinary ping test threw an exception:", e.message);
}

export default cloudinary;