# MealAppeal MCP Servers

Model Context Protocol (MCP) servers for production SaaS management and business growth.

## Overview

These MCP servers provide critical infrastructure for scaling MealAppeal from 20+ users to 1000+ users while maintaining operational excellence, security, and revenue growth.

## Architecture

```
mcp-servers/
├── security-compliance/     # GDPR, security scanning, audit logging
├── database-backup/        # Automated backups, disaster recovery
├── production-monitoring/  # Uptime, performance, incident response
├── api-cost-management/   # OpenAI cost tracking and optimization
├── revenue-subscription/  # Stripe integration, MRR tracking
├── user-analytics/       # Behavior tracking, conversion funnels
├── customer-support/     # Feedback, onboarding, communication
└── content-delivery/     # Image optimization, CDN management
```

## Quick Start

### 1. Install Dependencies

```bash
cd mcp-servers
npm install
```

### 2. Start All Servers

```bash
node index.js start
```

This will:
- Start all MCP servers in priority order (critical → high → medium → low)
- Launch the monitoring dashboard at http://localhost:3099
- Auto-restart critical servers if they crash

### 3. Check Status

```bash
node index.js status
```

Or visit the dashboard: http://localhost:3099

### 4. Stop All Servers

```bash
node index.js stop
```

## Server Details

### 🔴 Critical Priority (Phase 1)

#### Security & Compliance MCP (Port 3100)
- **Purpose**: Protect the business from legal and security risks
- **Features**:
  - GDPR compliance (data export, right to be forgotten)
  - Security vulnerability scanning
  - API key rotation
  - Audit logging with tamper-proof hashing
  - PII detection and encryption verification
- **Endpoints**:
  - `POST /` with action: `gdpr_export`, `gdpr_delete`, `scan_dependencies`, etc.

#### Database & Backup MCP (Port 3101)
- **Purpose**: Ensure data integrity and disaster recovery
- **Features**:
  - Automated daily backups with compression
  - Point-in-time recovery
  - Migration versioning and rollback
  - Query performance monitoring
  - Storage growth alerts
- **Schedule**:
  - Daily backups at midnight
  - Hourly performance monitoring

#### Production Monitoring & Alerting MCP (Port 3102)
- **Purpose**: Maintain 99.9% uptime
- **Features**:
  - Real-time uptime monitoring (every minute)
  - Core Web Vitals tracking
  - API health checks (OpenAI, Stripe, Supabase, Upstash)
  - Error rate tracking and alerting
  - Performance bottleneck detection
- **Alerts**: Email, Slack, SMS for critical incidents

### 🟡 High Priority (Phase 2)

#### API Cost Management MCP (Port 3103)
- **Status**: Not implemented yet
- **Purpose**: Prevent OpenAI cost overruns
- **Planned Features**:
  - Real-time cost tracking per user
  - Smart caching for duplicate analyses
  - Automatic throttling at limits
  - ROI tracking per API call

#### Revenue & Subscription Management MCP (Port 3104)
- **Status**: Not implemented yet
- **Purpose**: Activate and optimize revenue
- **Planned Features**:
  - Stripe production activation
  - MRR tracking and forecasting
  - Dunning management
  - Conversion optimization

### 🟢 Medium Priority (Phase 3)

#### User Analytics & Behavior MCP (Port 3105)
- **Status**: Not implemented yet
- **Purpose**: Understand and optimize user behavior
- **Planned Features**:
  - DAU/MAU tracking
  - Feature usage analytics
  - Conversion funnel analysis
  - Retention cohort tracking

#### Customer Support & Communication MCP (Port 3106)
- **Status**: Not implemented yet
- **Purpose**: Scale user satisfaction
- **Planned Features**:
  - Feedback collection
  - Email automation
  - Onboarding optimization
  - Support ticket management

### ⚪ Low Priority

#### Content Delivery & Optimization MCP (Port 3107)
- **Status**: Not implemented yet
- **Purpose**: Manage growing storage costs
- **Planned Features**:
  - Automatic image optimization
  - CDN configuration
  - Bandwidth monitoring

## API Usage Examples

### Security & Compliance

```javascript
// Export user data (GDPR)
fetch('http://localhost:3100', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'gdpr_export',
    userId: 'user-123'
  })
});

// Scan for vulnerabilities
fetch('http://localhost:3100', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'scan_dependencies'
  })
});
```

### Database Backup

```javascript
// Create manual backup
fetch('http://localhost:3101', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_backup',
    type: 'manual'
  })
});

// Test disaster recovery
fetch('http://localhost:3101', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'test_disaster_recovery'
  })
});
```

### Production Monitoring

```javascript
// Check uptime
fetch('http://localhost:3102', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'check_uptime'
  })
});

// Get open incidents
fetch('http://localhost:3102', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get_incidents'
  })
});
```

## Environment Variables

Required environment variables (set in `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Alerts (optional)
ALERT_EMAIL=
SLACK_WEBHOOK=
TWILIO_PHONE=
```

## Monitoring Dashboard

The dashboard at http://localhost:3099 provides:
- Real-time server status
- Health checks for each MCP
- Priority-based color coding
- Auto-refresh every 5 seconds

## Production Deployment

For production deployment:

1. Use PM2 or systemd for process management
2. Configure proper logging and log rotation
3. Set up external monitoring (e.g., UptimeRobot)
4. Enable SSL/TLS for MCP endpoints
5. Implement authentication for MCP access

## Troubleshooting

### Server won't start
- Check if port is already in use
- Verify environment variables are set
- Check logs for specific errors

### Health check failing
- Ensure Supabase/API keys are valid
- Check network connectivity
- Review server logs

### High memory usage
- Implement log rotation
- Clear old metrics periodically
- Consider using external storage for backups

## Future Enhancements

1. **WebSocket Support**: Real-time updates for monitoring
2. **GraphQL API**: Unified query interface
3. **Machine Learning**: Predictive alerts and anomaly detection
4. **Multi-region**: Distributed MCP servers for global coverage
5. **Integration Hub**: Connect with more external services

## Security Considerations

- MCP servers should run in isolated environments
- Use service accounts with minimal permissions
- Encrypt all data in transit and at rest
- Implement rate limiting on MCP endpoints
- Regular security audits and updates

## Contributing

When adding new MCP servers:
1. Follow the existing structure
2. Implement health check endpoint
3. Add to the manager configuration
4. Update this README
5. Test thoroughly before deployment