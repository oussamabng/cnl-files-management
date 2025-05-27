import fs from "fs";
import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export function ensureDataDirectories() {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("Created data directory:", DATA_DIR);
  }

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log("Created uploads directory:", UPLOADS_DIR);
  }
}

export function getFileStats(filename: string) {
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
  };
}

export function deleteFile(filename: string): boolean {
  try {
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted file:", filePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

export function listFiles(): string[] {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return [];
    }

    return fs.readdirSync(UPLOADS_DIR).filter((file) => {
      const filePath = path.join(UPLOADS_DIR, file);
      return fs.statSync(filePath).isFile();
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
}

export function getFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}
