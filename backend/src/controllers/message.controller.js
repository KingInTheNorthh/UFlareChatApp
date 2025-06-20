import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";


export const getUsersForSidebar = async (req, res) => {

try{

    const loggedInUserId = req.user._id;
    const filteredUsers = await  User.find({_id: {$ne: loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);
}

catch(error){

    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({error: "Internal Server Error"});


}










};

export const getMessages  = async (req, res) => {

    try{
        const {  id: userToChatId  } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId,  receiverId:userToChatId},
                {senderId: userToChatId, receiverId:myId}
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    }

    catch(error){
        console.log("Error in getMessages controller:", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }

};

export const sendMessage = async (req, res) => {
    try{
        const { text, image} = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
            console.log("Processing chat image...");
            
            // Validate base64 format
            if (!image.startsWith('data:image/')) {
                return res.status(400).json({ 
                    error: "Invalid image format", 
                    details: "Image must be in base64 format starting with 'data:image/'"
                });
            }
            
            // Check image size
            const base64Size = image.length * (3/4);
            const fileSizeInMB = base64Size / (1024 * 1024);
            console.log("Chat image size (MB):", fileSizeInMB.toFixed(2));
            
            if (fileSizeInMB > 9.5) {
                return res.status(400).json({ error: "Image size exceeds the 10MB limit" });
            }
            
            try {
                // Upload to cloudinary with optimization options
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    allowed_formats: ["jpg", "png", "jpeg", "gif"],
                    transformation: [
                        { width: 1200, height: 1200, crop: "limit" },
                        { quality: "auto" }
                    ]
                });
                
                imageUrl = uploadResponse.secure_url;
                console.log("Chat image uploaded successfully");
            } catch (cloudinaryError) {
                console.error("Cloudinary upload failed:", cloudinaryError.message);
                return res.status(400).json({ error: "Failed to upload image: " + cloudinaryError.message });
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();
        console.log("Message with image saved successfully");

        //todo: real-time functionality goes here => socket.io

        res.status(201).json(newMessage);
    }
    catch(error){
        console.log("Error in sendMessage controller:", error.message);
        console.error("Full error:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
};