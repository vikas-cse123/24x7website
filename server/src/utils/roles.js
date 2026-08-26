// Central role definitions. Extend later for granular permissions without
// changing every call site.
export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  ADMIN: 'admin',
}

// Roles allowed into the admin panel. `staff` is represented in the
// architecture; granular permissions are added in a later milestone.
export const ADMIN_ROLES = [ROLES.ADMIN]