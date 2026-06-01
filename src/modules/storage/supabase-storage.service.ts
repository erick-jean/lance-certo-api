import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService, UploadFileParams } from './storage.service';

@Injectable()
export class SupabaseStorageService extends StorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.client = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket = configService.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
  }

  async uploadFile(params: UploadFileParams): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(params.key, params.buffer, {
        contentType: params.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase storage upload falhou: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      throw new Error(`Supabase storage delete falhou: ${error.message}`);
    }
  }

  getPublicUrl(key: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }
}
