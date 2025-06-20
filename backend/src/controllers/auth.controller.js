import { generateToken } from "../lib/utils.js";

import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req, res) => {
    const {fullName, email,  password } = req.body

    try{
        //hash passwords
        if(!fullName || !email || !password ){
            return res.status(400).json({message: "All fields are required"});
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters"});
        }

        const user = await User.findOne({email})

        if(user) return res.status(400).json({message: "E-mail already exists"});

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword

        })

        if(newUser){
            // generate JWT token here
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,

            });
        }
        else{
            res.status(400).json({ message: "Invalid user data"});
        }

    }

    catch(error){
        console.log("Error in signup controller", error.message);
        res.status(500).json({message: "Internal Server Error"});

    }

};

export const login = async (req, res) => {
    const { email, password } = req.body

    try{
        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message: "Invalid credentials"});
        }
        
    const isPasswordCorrect =  await bcrypt.compare(password, user.password);
    if(!isPasswordCorrect){
        return res.status(400).json({message: "Invalid credentials"});
    }

    generateToken(user._id, res)

    res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic
    });

    }

    catch(error){
        console.log("Error in login controller", error.message);
        res.status(500).json({message: "Internal Server Error"});

    }
};

export const logout = (req, res) => {
    try{

        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({ message: "Successfully logged out"});

    }

    catch(error){

        console.log("Error in logout controller", error.message);
        res.status(500).json({message: "Internal Server Error"});

    }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile pic is required" });
        }

        // Validate base64 format
        if (!profilePic.startsWith('data:image/')) {
            return res.status(400).json({ 
                message: "Invalid image format", 
                details: "Image must be in base64 format starting with 'data:image/'"
            });
        }

        console.log("Starting profile update for user:", userId);
        console.log("Image data format:", profilePic.substring(0, 30) + "...");
        
        try {
            // Check image size
            const base64Size = profilePic.length * (3/4);
            const fileSizeInMB = base64Size / (1024 * 1024);
            console.log("Estimated image size:", fileSizeInMB.toFixed(2) + "MB");
            
            if (fileSizeInMB > 9.5) {
                return res.status(400).json({ message: "Image size exceeds the 10MB limit" });
            }

            console.log("Attempting Cloudinary upload...");
            
            // Prepare upload options
            const uploadOptions = {
                allowed_formats: ["jpg", "png", "jpeg", "gif"],
                transformation: [
                    { width: 500, height: 500, crop: "limit" },
                    { quality: "auto" }
                ]
            };
            
            // Try upload without preset first (in case preset doesn't exist)
            let uploadResponse;
            try {
                uploadResponse = await cloudinary.uploader.upload(profilePic, uploadOptions);
            } catch (cloudinaryError) {
                console.error("Cloudinary upload failed:", cloudinaryError.message);
                
                // If the error suggests adding upload_preset, return a clear error
                if (cloudinaryError.message && cloudinaryError.message.includes("preset")) {
                    return res.status(400).json({ 
                        message: "Cloudinary upload preset error",
                        details: "The specified upload preset 'profile_pictures' may not exist."
                    });
                }
                throw cloudinaryError;
            }

            console.log("Cloudinary upload successful, image public ID:", uploadResponse.public_id);

            // Update user in database
            console.log("Updating user in database...");
            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                { profilePic: uploadResponse.secure_url }, 
                { new: true }
            );
            console.log("User updated successfully");

            res.status(200).json(updatedUser);
        } catch (innerError) {
            console.error("Operation failed:", innerError.message);
            throw innerError;
        }
    } catch (error) {
        console.error("Error in update profile:", error.message);
        if (error.http_code) {
            console.error("Cloudinary HTTP code:", error.http_code);
        }
        
        res.status(500).json({ 
            message: "Image upload failed",
            error: error.message
        });
    }
};

export const checkAuth = (req, res) => {
    try{

        res.status(200).json(req.user);

    }

    catch(error){
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};

