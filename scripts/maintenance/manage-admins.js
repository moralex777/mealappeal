#!/usr/bin/env node

/**
 * Admin Management Script
 * Add or remove admin emails from the configuration
 * 
 * Usage:
 *   node scripts/maintenance/manage-admins.js list
 *   node scripts/maintenance/manage-admins.js add email@example.com
 *   node scripts/maintenance/manage-admins.js remove email@example.com
 */

const fs = require('fs').promises;
const path = require('path');

const ADMIN_CONFIG_PATH = path.join(__dirname, '../../src/lib/admin-config.ts');

async function readAdminConfig() {
  const content = await fs.readFile(ADMIN_CONFIG_PATH, 'utf8');
  const match = content.match(/adminEmails:\s*\[([\s\S]*?)\]/);
  if (!match) {
    throw new Error('Could not find adminEmails array in config');
  }
  
  // Extract emails from the array
  const emailsSection = match[1];
  const emails = emailsSection
    .match(/'[^']+'/g)
    .map(e => e.replace(/'/g, ''))
    .filter(e => e.includes('@'));
  
  return emails;
}

async function writeAdminConfig(emails) {
  let content = await fs.readFile(ADMIN_CONFIG_PATH, 'utf8');
  
  // Format the emails array
  const emailsFormatted = emails
    .map(email => `    '${email}'`)
    .join(',\n');
  
  // Replace the adminEmails array
  content = content.replace(
    /adminEmails:\s*\[[^\]]*\]/,
    `adminEmails: [\n${emailsFormatted}\n  ]`
  );
  
  await fs.writeFile(ADMIN_CONFIG_PATH, content);
}

async function listAdmins() {
  const emails = await readAdminConfig();
  console.log('\n📋 Current Admin Emails:');
  emails.forEach((email, index) => {
    console.log(`   ${index + 1}. ${email}`);
  });
  console.log(`\n   Total: ${emails.length} admin(s)\n`);
}

async function addAdmin(email) {
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    return;
  }
  
  const emails = await readAdminConfig();
  const emailLower = email.toLowerCase();
  
  if (emails.some(e => e.toLowerCase() === emailLower)) {
    console.log(`⚠️  ${email} is already an admin`);
    return;
  }
  
  emails.push(emailLower);
  await writeAdminConfig(emails);
  console.log(`✅ Added ${emailLower} as admin`);
  await listAdmins();
}

async function removeAdmin(email) {
  if (!email) {
    console.error('❌ Email address required');
    return;
  }
  
  const emails = await readAdminConfig();
  const emailLower = email.toLowerCase();
  const filtered = emails.filter(e => e.toLowerCase() !== emailLower);
  
  if (filtered.length === emails.length) {
    console.log(`⚠️  ${email} is not an admin`);
    return;
  }
  
  if (filtered.length === 0) {
    console.error('❌ Cannot remove all admins - at least one admin required');
    return;
  }
  
  await writeAdminConfig(filtered);
  console.log(`✅ Removed ${emailLower} from admins`);
  await listAdmins();
}

async function main() {
  const [command, email] = process.argv.slice(2);
  
  try {
    switch (command) {
      case 'list':
        await listAdmins();
        break;
      case 'add':
        await addAdmin(email);
        break;
      case 'remove':
        await removeAdmin(email);
        break;
      default:
        console.log(`
MealAppeal Admin Management

Usage:
  node scripts/maintenance/manage-admins.js list
  node scripts/maintenance/manage-admins.js add email@example.com
  node scripts/maintenance/manage-admins.js remove email@example.com

Current admins:
        `);
        await listAdmins();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();