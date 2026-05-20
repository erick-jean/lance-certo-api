export interface UploadFileParams {
  key: string;
  buffer: Buffer;
  contentType?: string;
}

export abstract class StorageService {
  abstract uploadFile(params: UploadFileParams): Promise<void>;

  abstract deleteFile(key: string): Promise<void>;

  abstract getPublicUrl(key: string): string;
}
