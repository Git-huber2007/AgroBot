import { supabaseAdmin } from '../db/adminClient.js';
import { UnauthorizedError } from '../utils/errors.js';
import { StorageService } from './storage.service.js';

export class AccountService {
  /**
   * Completely purges the user account, associated storage files, and database records.
   */
  public static async deleteAccount(userId: string, userEmail: string, passwordConfirm: string): Promise<void> {
    // 1. Verify user password
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password: passwordConfirm,
    });

    if (signInError) {
      throw new UnauthorizedError('Invalid password confirmation. Account deletion aborted.');
    }

    // 2. Cascade delete all user storage files in private bucket
    await StorageService.deleteUserFolder(userId);

    // 3. Delete auth.users row with service role (PostgreSQL ON DELETE CASCADE deletes all user data)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      throw new Error(`Failed to delete user account: ${deleteUserError.message}`);
    }
  }
}
