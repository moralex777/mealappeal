#!/usr/bin/env node

/**
 * Database & Backup MCP Server
 * Handles automated backups, disaster recovery, and data integrity
 */

const { createServer } = require('http');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

class DatabaseBackupMCP {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.backupDir = path.join(__dirname, '../../backups/automated');
    this.backupHistory = [];
    this.performanceMetrics = new Map();
    this.migrations = new Map();
  }

  async initialize() {
    // Ensure backup directory exists
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  // Automated Daily Backups
  async createBackup(type = 'scheduled') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${type}-${timestamp}`;
    
    try {
      // Export all tables
      const tables = ['profiles', 'meals', 'audit_logs', 'notification_settings'];
      const backup = {
        id: backupId,
        timestamp,
        type,
        tables: {},
        metadata: {
          version: '1.0',
          app_version: require('../../package.json').version
        }
      };

      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .select('*');
        
        if (error) throw error;
        
        backup.tables[table] = {
          count: data.length,
          data: data
        };
      }

      // Save backup to file
      const backupPath = path.join(this.backupDir, `${backupId}.json`);
      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));

      // Compress backup
      await execAsync(`gzip ${backupPath}`);
      
      this.backupHistory.push({
        id: backupId,
        timestamp,
        type,
        size: (await fs.stat(`${backupPath}.gz`)).size,
        tables: Object.keys(backup.tables),
        recordCount: Object.values(backup.tables).reduce((sum, t) => sum + t.count, 0)
      });

      // Clean old backups (keep last 30 days)
      await this.cleanOldBackups();

      return { success: true, backupId, path: `${backupPath}.gz` };
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Point-in-Time Recovery
  async restoreBackup(backupId, options = {}) {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.json.gz`);
      
      // Decompress backup
      await execAsync(`gunzip -c ${backupPath} > ${backupPath.replace('.gz', '')}`);
      
      const backupData = JSON.parse(await fs.readFile(backupPath.replace('.gz', ''), 'utf8'));
      
      if (options.dryRun) {
        return {
          success: true,
          dryRun: true,
          backup: {
            id: backupData.id,
            timestamp: backupData.timestamp,
            tables: Object.keys(backupData.tables).map(table => ({
              name: table,
              records: backupData.tables[table].count
            }))
          }
        };
      }

      // Restore each table
      const results = {};
      for (const [table, tableData] of Object.entries(backupData.tables)) {
        if (options.tables && !options.tables.includes(table)) continue;
        
        if (options.mode === 'replace') {
          // Delete existing data
          await this.supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        
        // Insert backup data
        const { error } = await this.supabase
          .from(table)
          .insert(tableData.data);
        
        results[table] = { 
          success: !error, 
          recordsRestored: error ? 0 : tableData.data.length,
          error: error?.message 
        };
      }

      // Clean up decompressed file
      await fs.unlink(backupPath.replace('.gz', ''));

      return { success: true, results };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Migration Versioning
  async trackMigration(migration) {
    const migrationRecord = {
      id: migration.id,
      name: migration.name,
      appliedAt: new Date().toISOString(),
      checksum: migration.checksum,
      status: 'pending'
    };

    this.migrations.set(migration.id, migrationRecord);

    try {
      // Apply migration
      const { error } = await this.supabase.rpc('exec_sql', { 
        sql: migration.sql 
      });

      if (error) throw error;

      migrationRecord.status = 'applied';
      
      // Store in migrations table
      await this.supabase
        .from('schema_migrations')
        .insert(migrationRecord);

      return { success: true, migration: migrationRecord };
    } catch (error) {
      migrationRecord.status = 'failed';
      migrationRecord.error = error.message;
      return { success: false, error: error.message, migration: migrationRecord };
    }
  }

  async rollbackMigration(migrationId) {
    const migration = this.migrations.get(migrationId);
    if (!migration || !migration.rollback) {
      return { success: false, error: 'Migration not found or not rollbackable' };
    }

    try {
      const { error } = await this.supabase.rpc('exec_sql', { 
        sql: migration.rollback 
      });

      if (error) throw error;

      migration.status = 'rolled_back';
      migration.rolledBackAt = new Date().toISOString();

      return { success: true, migration };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Query Performance Monitoring
  async monitorQueryPerformance() {
    try {
      // Get slow queries from pg_stat_statements
      const { data: slowQueries } = await this.supabase.rpc('get_slow_queries', {
        threshold_ms: 1000
      });

      const metrics = {
        timestamp: new Date().toISOString(),
        slowQueries: slowQueries || [],
        tableStats: {}
      };

      // Get table statistics
      const tables = ['profiles', 'meals'];
      for (const table of tables) {
        const { data: stats } = await this.supabase.rpc('get_table_stats', { 
          table_name: table 
        });
        
        metrics.tableStats[table] = stats;
      }

      this.performanceMetrics.set(metrics.timestamp, metrics);

      // Alert if critical performance issues
      const criticalQueries = (slowQueries || []).filter(q => q.mean_time > 5000);
      if (criticalQueries.length > 0) {
        console.error('CRITICAL: Queries taking over 5 seconds detected');
      }

      return metrics;
    } catch (error) {
      console.error('Performance monitoring failed:', error);
      return { error: error.message };
    }
  }

  // Disaster Recovery Testing
  async testDisasterRecovery() {
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Backup creation
    const backupTest = await this.createBackup('test');
    testResults.tests.push({
      name: 'Backup Creation',
      success: backupTest.success,
      duration: Date.now() - new Date(testResults.timestamp).getTime()
    });

    if (backupTest.success) {
      // Test 2: Backup restoration (dry run)
      const restoreTest = await this.restoreBackup(backupTest.backupId, { dryRun: true });
      testResults.tests.push({
        name: 'Backup Restoration (Dry Run)',
        success: restoreTest.success,
        details: restoreTest
      });
    }

    // Test 3: Database connectivity
    const connectivityTest = await this.testDatabaseConnectivity();
    testResults.tests.push({
      name: 'Database Connectivity',
      ...connectivityTest
    });

    // Calculate overall health score
    testResults.score = testResults.tests.filter(t => t.success).length / testResults.tests.length;
    testResults.status = testResults.score === 1 ? 'healthy' : testResults.score > 0.5 ? 'degraded' : 'critical';

    return testResults;
  }

  async testDatabaseConnectivity() {
    try {
      const start = Date.now();
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const latency = Date.now() - start;
      
      return {
        success: !error,
        latency,
        status: latency < 100 ? 'excellent' : latency < 500 ? 'good' : 'slow'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Storage Growth Monitoring
  async monitorStorageGrowth() {
    try {
      const { data: dbSize } = await this.supabase.rpc('get_database_size');
      const { data: tablesSizes } = await this.supabase.rpc('get_tables_sizes');

      const metrics = {
        timestamp: new Date().toISOString(),
        totalSize: dbSize,
        tables: tablesSizes,
        growth: {}
      };

      // Calculate growth rate
      const lastMetrics = Array.from(this.performanceMetrics.values()).pop();
      if (lastMetrics && lastMetrics.totalSize) {
        metrics.growth = {
          bytes: dbSize - lastMetrics.totalSize,
          percentage: ((dbSize - lastMetrics.totalSize) / lastMetrics.totalSize) * 100
        };
      }

      // Alert if approaching limits
      const GB = 1024 * 1024 * 1024;
      if (dbSize > 0.8 * GB) { // 80% of 1GB
        console.warn('WARNING: Database size approaching limit');
      }

      return metrics;
    } catch (error) {
      console.error('Storage monitoring failed:', error);
      return { error: error.message };
    }
  }

  // Clean old backups
  async cleanOldBackups() {
    const files = await fs.readdir(this.backupDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtimeMs < thirtyDaysAgo) {
        await fs.unlink(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  }

  // Create HTTP server for MCP
  startServer(port = 3101) {
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
              case 'create_backup':
                result = await this.createBackup(request.type || 'manual');
                break;
              case 'restore_backup':
                result = await this.restoreBackup(request.backupId, request.options);
                break;
              case 'track_migration':
                result = await this.trackMigration(request.migration);
                break;
              case 'rollback_migration':
                result = await this.rollbackMigration(request.migrationId);
                break;
              case 'monitor_performance':
                result = await this.monitorQueryPerformance();
                break;
              case 'test_disaster_recovery':
                result = await this.testDisasterRecovery();
                break;
              case 'monitor_storage':
                result = await this.monitorStorageGrowth();
                break;
              case 'list_backups':
                result = this.backupHistory;
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
          service: 'Database & Backup MCP',
          status: 'running',
          actions: [
            'create_backup',
            'restore_backup',
            'track_migration',
            'rollback_migration',
            'monitor_performance',
            'test_disaster_recovery',
            'monitor_storage',
            'list_backups'
          ]
        }));
      }
    });

    server.listen(port, () => {
      console.log(`Database & Backup MCP running on port ${port}`);
    });

    // Schedule daily backups
    setInterval(() => {
      this.createBackup('scheduled').catch(console.error);
    }, 24 * 60 * 60 * 1000); // Daily

    // Schedule performance monitoring
    setInterval(() => {
      this.monitorQueryPerformance().catch(console.error);
      this.monitorStorageGrowth().catch(console.error);
    }, 60 * 60 * 1000); // Hourly

    return server;
  }
}

// Start the server if run directly
if (require.main === module) {
  const mcp = new DatabaseBackupMCP();
  mcp.initialize().then(() => {
    mcp.startServer();
    
    // Run initial tasks
    mcp.createBackup('startup').catch(console.error);
    mcp.testDisasterRecovery().catch(console.error);
  });
}

module.exports = DatabaseBackupMCP;