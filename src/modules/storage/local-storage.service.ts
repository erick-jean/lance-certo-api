import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { StorageService, UploadFileParams } from './storage.service';

const LOCAL_STORAGE_ROOT = resolve(process.cwd(), 'uploads');
const LOCAL_STORAGE_PUBLIC_PREFIX = '/uploads';

@Injectable()
export class LocalStorageService extends StorageService {
  async uploadFile(params: UploadFileParams): Promise<void> {
    const filePath = this.resolveStoragePath(params.key);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, params.buffer, { flag: 'wx' });
  }

  async deleteFile(key: string): Promise<void> {
    await unlink(this.resolveStoragePath(key));
  }

  getPublicUrl(key: string): string {
    return `${LOCAL_STORAGE_PUBLIC_PREFIX}/${this.normalizeKey(key)}`;
  }

  private resolveStoragePath(key: string): string {
    const filePath = resolve(LOCAL_STORAGE_ROOT, this.normalizeKey(key));

    if (!filePath.startsWith(`${LOCAL_STORAGE_ROOT}${this.pathSeparator()}`)) {
      throw new Error('Storage key invalida.');
    }

    return filePath;
  }

  private normalizeKey(key: string): string {
    return key.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  private pathSeparator(): string {
    return process.platform === 'win32' ? '\\' : '/';
  }
}
