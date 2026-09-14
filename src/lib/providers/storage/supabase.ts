import type { StorageProvider, UploadInput } from "./mock";

type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

function requireConfig(): SupabaseStorageConfig {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "").trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || "media").trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "STORAGE_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return { url, serviceRoleKey, bucket };
}

/**
 * Uploads to a public Supabase Storage bucket.
 * Create a public bucket named `media` (or SUPABASE_STORAGE_BUCKET) in the dashboard,
 * or the first upload will try to create it via Storage API.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private bucketReady: Promise<void> | null = null;

  private headers(contentType?: string) {
    const { serviceRoleKey } = requireConfig();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    };
    if (contentType) headers["Content-Type"] = contentType;
    return headers;
  }

  private async ensureBucket() {
    if (!this.bucketReady) {
      this.bucketReady = this.createBucketIfNeeded();
    }
    await this.bucketReady;
  }

  private async createBucketIfNeeded() {
    const { url, bucket } = requireConfig();
    const listRes = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
      headers: this.headers(),
    });
    if (listRes.ok) return;

    const createRes = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: this.headers("application/json"),
      body: JSON.stringify({
        id: bucket,
        name: bucket,
        public: true,
        file_size_limit: 5 * 1024 * 1024,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      }),
    });

    if (!createRes.ok && createRes.status !== 409) {
      const text = await createRes.text();
      throw new Error(`Supabase bucket create failed (${createRes.status}): ${text}`);
    }
  }

  async upload(input: UploadInput) {
    await this.ensureBucket();
    const { url, bucket } = requireConfig();
    const safeKey = input.key.replace(/\.\./g, "").replace(/^\/+/, "");

    const res = await fetch(`${url}/storage/v1/object/${bucket}/${safeKey}`, {
      method: "POST",
      headers: {
        ...this.headers(input.contentType),
        "x-upsert": "true",
      },
      body: new Uint8Array(input.body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase upload failed (${res.status}): ${text}`);
    }

    return {
      key: safeKey,
      url: this.getPublicUrl(safeKey),
    };
  }

  async delete(key: string) {
    const { url, bucket } = requireConfig();
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    await fetch(`${url}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: this.headers("application/json"),
      body: JSON.stringify({ prefixes: [safeKey] }),
    }).catch(() => undefined);
  }

  getPublicUrl(key: string) {
    const { url, bucket } = requireConfig();
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return `${url}/storage/v1/object/public/${bucket}/${safeKey}`;
  }
}
