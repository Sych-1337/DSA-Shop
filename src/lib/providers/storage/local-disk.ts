import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import type { StorageProvider, UploadInput } from "./mock";

/** Writes to public/uploads — swap for S3 on hosting via STORAGE_PROVIDER. */
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly root = path.join(process.cwd(), "public", "uploads");

  async upload(input: UploadInput) {
    const safeKey = input.key.replace(/\.\./g, "").replace(/^\/+/, "");
    const filePath = path.join(this.root, safeKey);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(this.root))) {
      throw new Error("Invalid upload path");
    }
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, input.body);
    return {
      key: safeKey,
      url: this.getPublicUrl(safeKey),
    };
  }

  async delete(key: string) {
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    const filePath = path.join(this.root, safeKey);
    try {
      await unlink(filePath);
    } catch {
      // ignore missing
    }
  }

  getPublicUrl(key: string) {
    return `/uploads/${key.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  }
}
