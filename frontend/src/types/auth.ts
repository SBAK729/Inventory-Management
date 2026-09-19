export const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'STOREKEEPER'] as const;
export type Role = (typeof ROLES)[number];