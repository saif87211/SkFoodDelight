import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME || ""),
  api_key: String(process.env.CLOUDINARY_API_KEY || ""),
  api_secret: String(process.env.CLOUDINARY_API_SECRET || ""),
});

const uploadFileOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFileOnCloudinary = async (url: string) => {
  try {
    if (!url) return null;

    const urlParts = url.split("/");
    const imagePublicId = urlParts[urlParts.length - 1].slice(0, -4);

    const response = await cloudinary.uploader.destroy(imagePublicId);
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadFileOnCloudinary, deleteFileOnCloudinary };
