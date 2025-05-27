import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Both admin and utilisateur can access files
    const { filename } = params;

    // Verify file exists in database
    const file = await prisma.file.findFirst({
      where: {
        name: filename,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found in database" },
        { status: 404 }
      );
    }

    // Get file from data directory
    const filePath = path.join(process.cwd(), "data", "uploads", filename);

    // Check if file exists on filesystem
    if (!fs.existsSync(filePath)) {
      console.error(`File not found on filesystem: ${filePath}`);
      return NextResponse.json(
        { error: "File not found on filesystem" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".ico": "image/x-icon",
      ".mp4": "video/mp4",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".wmv": "video/x-ms-wmv",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".zip": "application/zip",
      ".rar": "application/vnd.rar",
      ".7z": "application/x-7z-compressed",
      ".tar": "application/x-tar",
      ".gz": "application/gzip",
      ".json": "application/json",
      ".xml": "application/xml",
      ".csv": "text/csv",
      ".html": "text/html",
      ".htm": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".ts": "application/typescript",
      ".py": "text/x-python",
      ".java": "text/x-java-source",
      ".cpp": "text/x-c++src",
      ".c": "text/x-csrc",
      ".php": "application/x-httpd-php",
      ".rb": "application/x-ruby",
      ".go": "text/x-go",
      ".rs": "text/x-rust",
      ".sql": "application/sql",
      ".md": "text/markdown",
      ".rtf": "application/rtf",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    // Update the inline types to only include truly previewable files
    const inlineTypes = [
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
      "image/bmp",
      "video/mp4",
      "audio/mpeg",
      "audio/wav",
      "application/json",
      "text/html",
      "text/markdown",
    ];

    const disposition = inlineTypes.includes(contentType)
      ? "inline"
      : "attachment";

    // Set headers for file serving
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": stats.size.toString(),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "public, max-age=31536000",
      "Last-Modified": stats.mtime.toUTCString(),
    });

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
