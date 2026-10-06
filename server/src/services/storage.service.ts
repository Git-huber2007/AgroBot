import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../db/adminClient.js';
import { logger } from '../utils/logger.js';

export class StorageService {
  /**
   * Uploads a WebP image buffer to the private `crop-images` bucket.
   * Path pattern: `{userId}/{diagnosisId}/{n}.webp`
   */
  public static async uploadDiagnosisImage(
    userClient: SupabaseClient,
    userId: string,
    diagnosisId: string,
    fileIndex: number,
    buffer: Buffer,
  ): Promise<string> {
    const storagePath = `${userId}/${diagnosisId}/${fileIndex}.webp`;

    const { error } = await userClient.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      logger.error({ error, storagePath }, 'Failed to upload image to Supabase Storage');
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return storagePath;
  }

  /**
   * Generates a short-lived signed URL (10-minute expiry per §12, §18.5)
   */
  public static async getSignedUrl(
    client: SupabaseClient,
    storagePath: string,
    expiresInSeconds = 600,
  ): Promise<string> {
    const { data, error } = await client.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      // Fallback to admin client if user client has signed URL policy edge case
      const { data: adminData, error: adminErr } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (adminErr || !adminData?.signedUrl) {
        logger.warn({ storagePath, adminErr }, 'Failed to create signed URL for image');
        return '';
      }
      return adminData.signedUrl;
    }

    return data.signedUrl;
  }

  /**
   * Deletes specific image objects from storage.
   */
  public static async deleteObjects(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    try {
      await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(paths);
    } catch (err) {
      logger.warn({ paths, err }, 'Failed to remove storage objects');
    }
  }

  /**
   * Removes all files under a user folder upon account deletion (§18.11).
   */
  public static async deleteUserFolder(userId: string): Promise<void> {
    try {
      const { data: items } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .list(userId);

      if (items && items.length > 0) {
        const fullPaths: string[] = [];
        for (const item of items) {
          if (item.id) {
            fullPaths.push(`${userId}/${item.name}`);
          } else {
            // Nested subfolder (e.g. diagnosisId)
            const { data: subFiles } = await supabaseAdmin.storage
              .from(env.SUPABASE_STORAGE_BUCKET)
              .list(`${userId}/${item.name}`);
            if (subFiles && subFiles.length > 0) {
              for (const sub of subFiles) {
                fullPaths.push(`${userId}/${item.name}/${sub.name}`);
              }
            }
          }
        }
        if (fullPaths.length > 0) {
          await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(fullPaths);
        }
      }
    } catch (err) {
      logger.warn({ userId, err }, 'Failed to delete user storage folder on account deletion');
    }
  }
}
