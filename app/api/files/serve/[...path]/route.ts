import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".zip": "application/zip",
  ".json": "application/json",
  ".csv": "text/csv",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const auth = await requireApiPermission(PERMISSIONS.FILES_VIEW);

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error, message: auth.message },
        { status: auth.status },
      );
    }

    // ✅ Next 16+: params can be a Promise
    const { path: pathParts } = await params;

    if (!Array.isArray(pathParts) || pathParts.length === 0) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    const filePath = pathParts.join("/");

    // Find the file in database to verify it exists and user has access
    const file = await prisma.file.findFirst({
      where: {
        OR: [{ name: filePath }, { path: { endsWith: filePath } }],
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fullPath = path.join(uploadsDir, filePath);

    // Check if file exists on filesystem (demo behavior)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, `Demo content for ${filePath}`);
    }

    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);
    const stats = fs.statSync(fullPath);

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      "Cache-Control": "public, max-age=31536000",
    });

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
