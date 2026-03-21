"use server";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECERET_ACCESS_KEY,
  },
});

async function uploadFileToS3(file, fileName) {
  const fileBuffer = await sharp(file)
    .jpeg({ quality: 50 })
    .toBuffer();

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: "image/jpeg",
    ACL:'public-read',
  };

  const command = new PutObjectCommand(params);
  try {
    const response = await s3Client.send(command);
    console.log("File uploaded successfully:", response);
    return fileName;
  } catch (error) {
    throw error;
  }
}

export const POST = async (req) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const uploadedFiles = [];
    const links=[];
    console.log("Files:", files); // Log files for debugging

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const uploadedFileName = await uploadFileToS3(buffer, fileName);
      uploadedFiles.push(uploadedFileName);
      const link=`https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${uploadedFileName}`;
      links.push(link);
    }

    revalidatePath("/");

    return NextResponse.json({
      status: "success",
      message: "Files have been uploaded successfully.",
      uploadedFiles: uploadedFiles,
      pImageLink:links
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to upload files.",
    });
  }
};
