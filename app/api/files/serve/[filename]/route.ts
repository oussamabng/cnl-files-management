import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export const runtime = "nodejs"; // important if you ever deploy to an env that might default to edge

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ filename: string }> } // <-- params is a Promise
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_VIEW);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { filename: rawFilename } = await ctx.params; // <-- FIX
    const filename = decodeURIComponent(rawFilename || "").trim();

    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // (optional but recommended) avoid path traversal like ../../etc/passwd
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Verify file exists in database
    const file = await prisma.file.findFirst({
      where: { name: filename },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found in database" },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), "data", "uploads", filename);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found on filesystem: ${filePath}`);
      return NextResponse.json(
        { error: "File not found on filesystem" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

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
      ".md": "text/markdown",
      ".rtf": "application/rtf",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

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
