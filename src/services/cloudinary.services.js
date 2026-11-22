import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from "#consts";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (localFilePath, cloudinaryFolderPath) => {
    try{
        if(!localFilePath) throw new Error("ERROR: File path was not provided!");
        // uploads the file from our server to cloudinary
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: cloudinaryFolderPath,
        });
        // after the file is sucessfully uploaded
        fs.unlinkSync(localFilePath);
        return res;
    }
    catch(err){
        console.error("ERROR: could not upload file to cloudinary:", err);
        if(localFilePath && fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath); // removes the file from our server
        }
        return null;
    }
}