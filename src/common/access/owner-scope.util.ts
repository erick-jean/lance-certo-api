export function ownerScope(userId: string, userRole?: string) {
  return userRole === 'admin' ? {} : { userId };
}
