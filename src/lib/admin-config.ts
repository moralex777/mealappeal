/**
 * Admin Configuration
 * Manages admin access and permissions
 */

export const ADMIN_CONFIG = {
  // List of admin email addresses
  // These users have full access to the admin dashboard
  adminEmails: [
    'alex@propertytalents.com',
    'marina.morari03@gmail.com'
  ],
  
  // Feature flags for admin capabilities
  features: {
    viewMetrics: true,
    createBackups: true,
    viewUserData: true,
    modifySettings: false, // Reserved for future use
  }
};

/**
 * Check if a user email is an admin
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_CONFIG.adminEmails.includes(email.toLowerCase());
}

/**
 * Get admin emails (for notifications, etc.)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_CONFIG.adminEmails];
}