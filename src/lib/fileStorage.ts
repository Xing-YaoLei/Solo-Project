import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), ".data");
const ANOMALIES_FILE = path.join(STORAGE_DIR, "anomalies.json");
const SYNC_TASKS_FILE = path.join(STORAGE_DIR, "sync-tasks.json");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  ensureStorageDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function readAnomaliesFromFile<T>(defaultValue: T): T {
  return readJsonFile(ANOMALIES_FILE, defaultValue);
}

export function writeAnomaliesToFile<T>(data: T): void {
  writeJsonFile(ANOMALIES_FILE, data);
}

export function readSyncTasksFromFile<T>(defaultValue: T): T {
  return readJsonFile(SYNC_TASKS_FILE, defaultValue);
}

export function writeSyncTasksToFile<T>(data: T): void {
  writeJsonFile(SYNC_TASKS_FILE, data);
}

export const storagePaths = {
  dir: STORAGE_DIR,
  anomalies: ANOMALIES_FILE,
  syncTasks: SYNC_TASKS_FILE,
};
