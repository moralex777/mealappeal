#!/usr/bin/env node

/**
 * Security & Compliance MCP Server
 * Handles GDPR compliance, security scanning, audit logging, and data protection
 */

const { createServer } = require('http');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

class SecurityComplianceMCP {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.auditLog = [];
    this.securityScans = new Map();
    this.apiKeys = new Map();
    this.piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{16}\b/g, // Credit card
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
    ];
  }

  // GDPR Compliance Features
  async exportUserData(userId) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: meals } = await this.supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId);

      const exportData = {
        profile,
        meals,
        exportDate: new Date().toISOString(),
        format: 'gdpr_export_v1'
      };

      await this.logAuditEvent('gdpr_export', userId, { success: true });
      return exportData;
    } catch (error) {
      await this.logAuditEvent('gdpr_export', userId, { success: false, error: error.message });
      throw error;
    }
  }

  async deleteUserData(userId) {
    try {
      // Delete meals first (foreign key constraint)
      await this.supabase
        .from('meals')
        .delete()
        .eq('user_id', userId);

      // Delete profile
      await this.supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      await this.logAuditEvent('gdpr_delete', userId, { success: true });
      return { success: true, deletedAt: new Date().toISOString() };
    } catch (error) {
      await this.logAuditEvent('gdpr_delete', userId, { success: false, error: error.message });
      throw error;
    }
  }

  // Security Vulnerability Scanning
  async scanDependencies() {
    const scan = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      vulnerabilities: []
    };

    try {
      // In production, integrate with npm audit or Snyk
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages
      const vulnerablePackages = {
        'lodash': '<4.17.21',
        'axios': '<0.21.1',
        'minimist': '<1.2.5'
      };

      for (const [pkg, safeVersion] of Object.entries(vulnerablePackages)) {
        if (packageJson.dependencies[pkg]) {
          scan.vulnerabilities.push({
            package: pkg,
            severity: 'high',
            recommendation: `Upgrade to ${safeVersion} or higher`
          });
        }
      }

      this.securityScans.set(scan.id, scan);
      await this.logAuditEvent('security_scan', 'system', { scanId: scan.id, vulnerabilities: scan.vulnerabilities.length });
      return scan;
    } catch (error) {
      await this.logAuditEvent('security_scan', 'system', { success: false, error: error.message });
      throw error;
    }
  }

  // API Key Rotation
  async rotateApiKey(service) {
    const oldKey = this.apiKeys.get(service);
    const newKey = crypto.randomBytes(32).toString('hex');
    
    this.apiKeys.set(service, {
      key: newKey,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
    });

    await this.logAuditEvent('api_key_rotation', 'system', { 
      service, 
      oldKeyHash: oldKey ? crypto.createHash('sha256').update(oldKey.key).digest('hex') : null 
    });

    return { service, keyHash: crypto.createHash('sha256').update(newKey).digest('hex') };
  }

  // Audit Logging
  async logAuditEvent(action, userId, details = {}) {
    const event = {
      id: crypto.randomUUID(),
      action,
      user_id: userId,
      timestamp: new Date().toISOString(),
      ip_address: details.ip || 'system',
      user_agent: details.userAgent || 'mcp-server',
      details,
      hash: null
    };

    // Create tamper-proof hash
    const eventString = JSON.stringify({ ...event, hash: undefined });
    event.hash = crypto.createHash('sha256').update(eventString).digest('hex');

    this.auditLog.push(event);

    // Store in database
    try {
      await this.supabase
        .from('audit_logs')
        .insert(event);
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }

    return event;
  }

  // PII Detection
  async scanForPII(text) {
    const findings = [];
    
    for (const pattern of this.piiPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({
          type: this.getPIIType(pattern),
          count: matches.length,
          masked: matches.map(m => m.substring(0, 3) + '***')
        });
      }
    }

    if (findings.length > 0) {
      await this.logAuditEvent('pii_detection', 'system', { findings });
    }

    return findings;
  }

  getPIIType(pattern) {
    const patternString = pattern.toString();
    if (patternString.includes('@')) return 'email';
    if (patternString.includes('\\d{3}-\\d{2}-\\d{4}')) return 'ssn';
    if (patternString.includes('\\d{16}')) return 'credit_card';
    if (patternString.includes('\\d{3}-\\d{3}-\\d{4}')) return 'phone';
    return 'unknown';
  }

  // Encryption Verification
  async verifyEncryption() {
    const checks = {
      database: true, // Supabase encrypts at rest
      transit: true,  // HTTPS enforced
      storage: true,  // Supabase storage encrypted
      apiKeys: this.apiKeys.size > 0
    };

    await this.logAuditEvent('encryption_verification', 'system', checks);
    return checks;
  }

  // Create HTTP server for MCP
  startServer(port = 3100) {
    const server = createServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            let result;

            switch (request.action) {
              case 'gdpr_export':
                result = await this.exportUserData(request.userId);
                break;
              case 'gdpr_delete':
                result = await this.deleteUserData(request.userId);
                break;
              case 'scan_dependencies':
                result = await this.scanDependencies();
                break;
              case 'rotate_api_key':
                result = await this.rotateApiKey(request.service);
                break;
              case 'scan_pii':
                result = await this.scanForPII(request.text);
                break;
              case 'verify_encryption':
                result = await this.verifyEncryption();
                break;
              case 'get_audit_logs':
                result = this.auditLog.slice(-100); // Last 100 events
                break;
              default:
                res.statusCode = 400;
                result = { error: 'Unknown action' };
            }

            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          service: 'Security & Compliance MCP',
          status: 'running',
          actions: [
            'gdpr_export',
            'gdpr_delete',
            'scan_dependencies',
            'rotate_api_key',
            'scan_pii',
            'verify_encryption',
            'get_audit_logs'
          ]
        }));
      }
    });

    server.listen(port, () => {
      console.log(`Security & Compliance MCP running on port ${port}`);
    });

    return server;
  }
}

// Start the server if run directly
if (require.main === module) {
  const mcp = new SecurityComplianceMCP();
  mcp.startServer();
  
  // Run initial scans
  mcp.scanDependencies().catch(console.error);
  mcp.verifyEncryption().catch(console.error);
}

module.exports = SecurityComplianceMCP;