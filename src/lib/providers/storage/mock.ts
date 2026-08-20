export type UploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export interface StorageProvider {
  upload(input: UploadInput): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export class MockStorageProvider implements StorageProvider {
  async upload(input: UploadInput) {
    return {
      key: input.key,
      url: `/uploads/${input.key}`,
    };
  }

  async delete(key: string) {
    void key;
  }

  getPublicUrl(key: string) {
    return `/uploads/${key}`;
  }
}
