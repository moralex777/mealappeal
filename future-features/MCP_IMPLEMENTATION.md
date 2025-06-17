# MealAppeal MCP Implementation Guide

## Overview

This document details the Model Context Protocol (MCP) server implementation for MealAppeal, designed to support scaling from 20+ users to 1000+ users with production-grade infrastructure.

## Implementation Status

### ✅ Phase 1: Critical Infrastructure (Completed)

1. **Security & Compliance MCP** - Operational
   - GDPR compliance automation
   - Security vulnerability scanning
   - Audit logging with tamper-proof hashing
   - API key rotation system
   - PII detection and encryption verification

2. **Database & Backup MCP** - Operational
   - Automated daily backups with compression
   - Point-in-time recovery capabilities
   - Migration versioning and rollback
   - Query performance monitoring
   - Storage growth alerts

3. **Production Monitoring & Alerting MCP** - Operational
   - Real-time uptime monitoring (60s intervals)
   - Core Web Vitals tracking
   - API health checks (OpenAI, Stripe, Supabase, Upstash)
   - Error rate tracking and alerting
   - Performance bottleneck detection

### 🚧 Phase 2: Revenue Protection (Pending)

4. **API Cost Management MCP** - Not implemented
5. **Revenue & Subscription Management MCP** - Not implemented

### 📋 Phase 3: Growth Enablement (Pending)

6. **User Analytics & Behavior MCP** - Not implemented
7. **Customer Support & Communication MCP** - Not implemented
8. **Content Delivery & Optimization MCP** - Not implemented

## Quick Start

### 1. Database Setup

First, apply the MCP database migrations:

```bash
# Run in Supabase SQL editor
-- Copy contents of: supabase/migrations/20250617_create_mcp_tables.sql
```

### 2. Start MCP Servers

```bash
# Start all MCP servers
npm run mcp:start

# This will:
# - Start Security & Compliance MCP on port 3100
# - Start Database & Backup MCP on port 3101
# - Start Production Monitoring MCP on port 3102
# - Launch dashboard at http://localhost:3099
```

### 3. Verify Status

```bash
# Check server status
npm run mcp:status

# Or visit the dashboard
open http://localhost:3099
```

## Architecture Details

### MCP Configuration

The main configuration is in `/mcp.json`:
- Defines all 8 MCP servers
- Sets priorities (critical, high, medium, low)
- Configures features and integrations
- Establishes global settings

### Server Implementation

Each MCP server follows this pattern:
```javascript
class [Name]MCP {
  constructor() {
    // Initialize Supabase client
    // Set up data structures
  }
  
  // Core functionality methods
  
  startServer(port) {
    // HTTP server for MCP communication
    // Scheduled tasks
  }
}
```

### Communication Protocol

MCPs communicate via HTTP POST requests:
```javascript
POST http://localhost:[PORT]
Content-Type: application/json

{
  "action": "action_name",
  "param1": "value1",
  "param2": "value2"
}
```

## Integration with MealAppeal

### 1. Security Integration

The Security & Compliance MCP integrates with:
- User authentication system for GDPR requests
- Audit logging for all critical operations
- Dependency scanning in CI/CD pipeline

Example usage in your app:
```javascript
// Log security event
await fetch('http://localhost:3100', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'audit_log',
    userId: user.id,
    details: {
      action: 'premium_upgrade',
      ip: request.ip,
      userAgent: request.headers['user-agent']
    }
  })
});
```

### 2. Backup Integration

The Database & Backup MCP provides:
- Automated daily backups at midnight
- On-demand backup creation
- Disaster recovery testing

Example backup trigger:
```javascript
// Create manual backup before major update
await fetch('http://localhost:3101', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_backup',
    type: 'pre_deployment'
  })
});
```

### 3. Monitoring Integration

The Production Monitoring MCP tracks:
- All API endpoints automatically
- Performance metrics
- Error rates and incidents

No code changes needed - it monitors externally.

## Operational Procedures

### Daily Operations

1. **Morning Check** (9 AM)
   - Review dashboard for overnight incidents
   - Check backup completion status
   - Review error rates

2. **Performance Review** (2 PM)
   - Check Core Web Vitals
   - Review slow query reports
   - Monitor API costs

3. **End of Day** (6 PM)
   - Verify all systems operational
   - Review security scan results
   - Check storage growth

### Incident Response

When an incident occurs:

1. **Critical Incidents** (e.g., site down)
   - Alerts sent via email/Slack/SMS
   - Check dashboard for details
   - Follow runbook for resolution

2. **Performance Degradation**
   - Review bottleneck detection report
   - Check API health status
   - Scale resources if needed

3. **Security Issues**
   - Review audit logs
   - Check vulnerability scan results
   - Rotate affected API keys

### Backup & Recovery

1. **Regular Backups**
   - Daily automated at midnight
   - 30-day retention
   - Compressed and encrypted

2. **Recovery Process**
   ```bash
   # List available backups
   curl -X POST http://localhost:3101 \
     -H "Content-Type: application/json" \
     -d '{"action": "list_backups"}'
   
   # Restore specific backup
   curl -X POST http://localhost:3101 \
     -H "Content-Type: application/json" \
     -d '{
       "action": "restore_backup",
       "backupId": "backup-scheduled-2025-06-17",
       "options": {"dryRun": true}
     }'
   ```

## Security Considerations

### Authentication

Currently, MCPs run locally without authentication. For production:

1. Add API key authentication
2. Use mutual TLS for MCP communication
3. Implement rate limiting
4. Restrict access by IP whitelist

### Data Protection

- All backups are compressed and should be encrypted
- Audit logs use SHA-256 hashing for tamper detection
- PII detection runs on all text data
- API keys rotate every 90 days

### Compliance

The Security & Compliance MCP provides:
- GDPR data export in JSON format
- Right to be forgotten implementation
- Audit trail for all operations
- Automated compliance reporting

## Troubleshooting

### Common Issues

1. **MCP Won't Start**
   ```bash
   # Check if port is in use
   lsof -i :3100
   
   # Check environment variables
   npm run validate:env
   ```

2. **Database Connection Failed**
   ```bash
   # Verify Supabase credentials
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. **High Memory Usage**
   ```bash
   # Restart specific MCP
   npm run mcp:stop
   npm run mcp:start
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=mcp:* npm run mcp:start
```

### Health Checks

Each MCP exposes a health endpoint:
```bash
# Security & Compliance
curl http://localhost:3100

# Database & Backup
curl http://localhost:3101

# Production Monitoring
curl http://localhost:3102
```

## Future Enhancements

### Phase 2 Implementation Plan

1. **API Cost Management MCP**
   - Track OpenAI token usage per user
   - Implement smart caching layer
   - Cost allocation by subscription tier
   - Automatic throttling at limits

2. **Revenue & Subscription Management MCP**
   - Stripe webhook processing
   - MRR calculation and forecasting
   - Churn prediction
   - Dunning management

### Phase 3 Implementation Plan

1. **User Analytics & Behavior MCP**
   - PostHog integration
   - Custom event tracking
   - Funnel analysis
   - Cohort retention

2. **Customer Support & Communication MCP**
   - Resend email integration
   - In-app messaging
   - Feedback collection
   - Support ticket routing

3. **Content Delivery & Optimization MCP**
   - Image optimization pipeline
   - CDN configuration
   - Bandwidth monitoring
   - Storage lifecycle management

## Monitoring Best Practices

1. **Set Up Alerts**
   - Uptime < 99.9%
   - Error rate > 1%
   - Response time > 3s
   - Storage > 80% capacity

2. **Regular Reviews**
   - Weekly performance reports
   - Monthly cost analysis
   - Quarterly security audits
   - Annual disaster recovery tests

3. **Documentation**
   - Keep runbooks updated
   - Document all incidents
   - Track resolution times
   - Share learnings

## Cost Optimization

1. **API Costs**
   - Monitor OpenAI usage daily
   - Implement aggressive caching
   - Use lower-cost models when possible
   - Batch requests efficiently

2. **Infrastructure**
   - Right-size server resources
   - Use spot instances for non-critical MCPs
   - Implement auto-scaling
   - Optimize backup retention

3. **Monitoring**
   - Adjust check frequencies based on criticality
   - Archive old metrics
   - Use sampling for high-volume data
   - Consolidate alerting channels

## Conclusion

The MCP implementation provides MealAppeal with production-grade infrastructure for:
- 99.9% uptime guarantee
- Comprehensive security and compliance
- Automated backup and recovery
- Real-time performance monitoring
- Scalable architecture for growth

With Phase 1 complete, the critical infrastructure is in place. Phases 2 and 3 will add revenue optimization and growth features as the user base expands.