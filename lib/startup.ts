import { ensureDataDirectories } from "./file-utils";

export function initializeApp() {
  console.log("Initializing application...");

  // Ensure data directories exist
  ensureDataDirectories();

  console.log("Application initialized successfully");
}
