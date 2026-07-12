import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { randomUUID } from "crypto";
import path from "path";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECERET_ACCESS_KEY,
  },
});

async function uploadFileToS3(fileBuffer, fileName) {
  const fileBuffer_compressed = await sharp(fileBuffer).jpeg({ quality: 50 }).toBuffer();

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer_compressed,
    ContentType: "image/jpeg",
    ACL: "public-read",
  };

  await s3Client.send(new PutObjectCommand(params));
  return fileName;
}

export const POST = withAuth(async (req) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No files provided." }, { status: 400 });
    }

    const links = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Sanitize filename: use a UUID + original extension to avoid S3 key issues
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const safeFileName = `${randomUUID()}${ext}`;

      await uploadFileToS3(buffer, safeFileName);
      const link = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${safeFileName}`;
      links.push(link);
    }

    revalidatePath("/");

    return NextResponse.json({
      status: "success",
      message: "Files uploaded successfully.",
      pImageLink: links,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to upload files." },
      { status: 500 }
    );
  }
});
