import { UserRole } from '../enums/user-role.enum';

export function ownerScope(userId: string, userRole?: UserRole) {
  return userRole === UserRole.ADMIN ? {} : { userId };
}
