import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export const runtime = "nodejs";

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

function normalizeFilename(input: string) {
  return input
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUnsafePath(p: string) {
  return (
    p.includes("..") ||
    p.startsWith("/") ||
    p.startsWith("\\") ||
    p.includes("\0")
  );
}

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

    const { path: pathPartsRaw } = await params;

    if (!Array.isArray(pathPartsRaw) || pathPartsRaw.length === 0) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    // Decode each segment (important for spaces)
    const decodedParts = pathPartsRaw.map((p) =>
      normalizeFilename(decodeURIComponent(p || "")),
    );

    const fileRel = decodedParts.join("/");

    if (!fileRel || isUnsafePath(fileRel)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Your real storage folder
    const uploadsDir = path.join(process.cwd(), "data", "uploads");
    const fullPath = path.join(uploadsDir, fileRel);

    // If not on disk => 404 immediately
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: "File not found on filesystem" },
        { status: 404 },
      );
    }

    // Try DB lookup (by name OR by stored path)
    let file = await prisma.file.findFirst({
      where: {
        OR: [
          { name: { equals: path.basename(fileRel), mode: "insensitive" } },
          { path: { endsWith: `/api/files/serve/${fileRel}` } },
          { path: { endsWith: fileRel } },
        ],
      },
    });

    // Auto-heal: create DB record if missing
    // (Avoid upsert with folderId null because of TS type)
    if (!file) {
      const name = path.basename(fileRel);
      const apiPath = `/api/files/serve/${fileRel}`;

      // If another request created it concurrently, handle unique conflict
      try {
        file = await prisma.file.create({
          data: {
            name,
            path: apiPath,
            folderId: null,
          },
        });
      } catch {
        // fallback: try to find again (unique conflict or race)
        file = await prisma.file.findFirst({
          where: {
            OR: [
              { name: { equals: name, mode: "insensitive" } },
              { path: { endsWith: apiPath } },
              { path: { endsWith: fileRel } },
            ],
          },
        });
      }
    }

    const stats = fs.statSync(fullPath);
    const fileBuffer = fs.readFileSync(fullPath);

    const ext = path.extname(fileRel).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    const inlineTypes = new Set([
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
      "text/csv",
    ]);

    const disposition = inlineTypes.has(contentType) ? "inline" : "attachment";
    const base = path.basename(fileRel);

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      "Content-Disposition": `${disposition}; filename="${base}"; filename*=UTF-8''${encodeURIComponent(
        base,
      )}`,
      "Cache-Control": "public, max-age=31536000",
      "Last-Modified": stats.mtime.toUTCString(),
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
