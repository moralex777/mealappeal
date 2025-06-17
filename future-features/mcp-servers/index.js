#!/usr/bin/env node

/**
 * MealAppeal MCP Server Manager
 * Manages all MCP servers for production SaaS operations
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class MCPManager {
  constructor() {
    this.servers = [
      { name: 'security-compliance', port: 3100, priority: 'critical' },
      { name: 'database-backup', port: 3101, priority: 'critical' },
      { name: 'production-monitoring', port: 3102, priority: 'critical' },
      { name: 'api-cost-management', port: 3103, priority: 'high' },
      { name: 'revenue-subscription', port: 3104, priority: 'high' },
      { name: 'user-analytics', port: 3105, priority: 'medium' },
      { name: 'customer-support', port: 3106, priority: 'medium' },
      { name: 'content-delivery', port: 3107, priority: 'low' }
    ];
    
    this.processes = new Map();
  }

  async startServer(server) {
    const serverPath = path.join(__dirname, server.name, 'index.js');
    
    // Check if server exists
    try {
      await fs.access(serverPath);
    } catch {
      console.warn(`⚠️  Server ${server.name} not implemented yet`);
      return;
    }

    const childProcess = spawn('node', [serverPath], {
      cwd: path.join(__dirname, server.name),
      env: { ...process.env, PORT: server.port },
      stdio: 'inherit'
    });

    childProcess.on('exit', (code) => {
      console.error(`❌ ${server.name} MCP exited with code ${code}`);
      this.processes.delete(server.name);
      
      // Restart critical servers
      if (server.priority === 'critical' && code !== 0) {
        console.log(`🔄 Restarting critical server ${server.name}...`);
        setTimeout(() => this.startServer(server), 5000);
      }
    });

    this.processes.set(server.name, childProcess);
    console.log(`✅ Started ${server.name} MCP on port ${server.port}`);
  }

  async startAll() {
    console.log('🚀 Starting MealAppeal MCP Servers...\n');
    
    // Start critical servers first
    const critical = this.servers.filter(s => s.priority === 'critical');
    for (const server of critical) {
      await this.startServer(server);
    }
    
    // Then high priority
    const high = this.servers.filter(s => s.priority === 'high');
    for (const server of high) {
      await this.startServer(server);
    }
    
    // Then the rest
    const others = this.servers.filter(s => s.priority === 'medium' || s.priority === 'low');
    for (const server of others) {
      await this.startServer(server);
    }
    
    console.log('\n✨ All MCP servers started!');
    console.log('\n📊 Server Status Dashboard: http://localhost:3099');
  }

  stopAll() {
    console.log('\n🛑 Stopping all MCP servers...');
    
    for (const [name, childProcess] of this.processes) {
      childProcess.kill('SIGTERM');
      console.log(`Stopped ${name}`);
    }
    
    this.processes.clear();
  }

  async getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      servers: []
    };

    for (const server of this.servers) {
      const running = this.processes.has(server.name);
      const health = running ? await this.checkHealth(server) : null;
      
      status.servers.push({
        name: server.name,
        port: server.port,
        priority: server.priority,
        status: running ? 'running' : 'stopped',
        health
      });
    }

    return status;
  }

  async checkHealth(server) {
    return new Promise((resolve) => {
      const http = require('http');
      const req = http.get(`http://localhost:${server.port}`, (res) => {
        resolve({
          status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
          statusCode: res.statusCode
        });
      });
      
      req.on('error', () => {
        resolve({ status: 'unreachable' });
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        resolve({ status: 'timeout' });
      });
    });
  }

  // Create status dashboard
  async startDashboard() {
    const http = require('http');
    
    const server = http.createServer(async (req, res) => {
      if (req.url === '/status') {
        const status = await this.getStatus();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(status, null, 2));
      } else {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>MealAppeal MCP Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .server { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .running { border-left: 4px solid #4CAF50; }
    .stopped { border-left: 4px solid #f44336; }
    .priority-critical { background: #fff3e0; }
    .priority-high { background: #f3e5f5; }
    .status { font-weight: bold; }
    .healthy { color: #4CAF50; }
    .unhealthy { color: #f44336; }
    .refresh { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>🚀 MealAppeal MCP Dashboard</h1>
  <button class="refresh" onclick="location.reload()">🔄 Refresh</button>
  <div id="servers"></div>
  <script>
    async function updateStatus() {
      const response = await fetch('/status');
      const data = await response.json();
      
      const container = document.getElementById('servers');
      container.innerHTML = data.servers.map(server => \`
        <div class="server \${server.status} priority-\${server.priority}">
          <h3>\${server.name.replace('-', ' ').toUpperCase()}</h3>
          <p>Port: \${server.port} | Priority: \${server.priority}</p>
          <p class="status \${server.health?.status || ''}">
            Status: \${server.status} 
            \${server.health ? \`| Health: \${server.health.status}\` : ''}
          </p>
        </div>
      \`).join('');
    }
    
    updateStatus();
    setInterval(updateStatus, 5000);
  </script>
</body>
</html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      }
    });
    
    server.listen(3099, () => {
      console.log('📊 MCP Dashboard running on http://localhost:3099');
    });
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\nReceived SIGINT, shutting down gracefully...');
  manager.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nReceived SIGTERM, shutting down gracefully...');
  manager.stopAll();
  process.exit(0);
});

// Main execution
const manager = new MCPManager();

if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      manager.startAll().then(() => {
        manager.startDashboard();
      });
      break;
    case 'stop':
      manager.stopAll();
      process.exit(0);
      break;
    case 'status':
      manager.getStatus().then(status => {
        console.log(JSON.stringify(status, null, 2));
        process.exit(0);
      });
      break;
    default:
      console.log(`
MealAppeal MCP Server Manager

Usage:
  node mcp-servers/index.js start   - Start all MCP servers
  node mcp-servers/index.js stop    - Stop all MCP servers
  node mcp-servers/index.js status  - Check server status
      `);
      process.exit(1);
  }
}

module.exports = MCPManager;