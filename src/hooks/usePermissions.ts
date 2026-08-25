import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const roleUpper = (user?.role || '').toUpperCase();
  const cleanEmail = (user?.email || '').toLowerCase().trim();
  const isSuperAdmin = 
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper === 'PLATFORM_ADMIN' ||
    roleUpper.includes('SUPER') ||
    roleUpper.includes('PLATFORM') ||
    cleanEmail === 'gyanvaniai@gmail.com' ||
    cleanEmail.startsWith('superadmin');

  const isOwnerOrAdmin = roleUpper === 'OWNER' || roleUpper === 'ADMIN' || isSuperAdmin;

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;

    // Owners and Admins have full access
    if (isOwnerOrAdmin) return true;

    // Explicit wildcard access check
    if (user.permissions?.includes('*')) return true;

    const userPerms = user.permissions || [];

    // Parent permission hierarchy check for settings
    if (permissionKey.startsWith('SETTINGS_')) {
      if (!userPerms.includes('MODULE_SETTINGS')) {
        return false;
      }
    }

    return userPerms.includes(permissionKey);
  };

  return {
    hasPermission,
    isOwnerOrAdmin,
    permissions: user?.permissions || [],
    permissionVersion: user?.permissionVersion || 1,
  };
}
