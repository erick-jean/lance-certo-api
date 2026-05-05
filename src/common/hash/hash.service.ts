import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  private readonly rounds = 10;

  /**
   * Hashes a plain text secret with bcrypt.
   */
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  /**
   * Compares a plain text value against a bcrypt hash.
   */
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
