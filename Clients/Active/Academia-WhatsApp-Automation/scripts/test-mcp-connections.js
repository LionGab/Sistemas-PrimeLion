#!/usr/bin/env node

/**
 * Test MCP Connections Script
 * 
 * Tests all configured MCP servers to ensure they're working correctly
 * before starting the main application
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const configFile = path.join(process.cwd(), 'mcp.config.json');

async function loadMCPConfig() {
  try {
    const configData = await fs.promises.readFile(configFile, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Failed to load MCP configuration:', error.message);
    console.log('Make sure mcp.config.json exists in the project root');
    process.exit(1);
  }
}

function expandEnvVars(envVars) {
  const expanded = {};
  for (const [key, value] of Object.entries(envVars)) {
    if (typeof value === 'string') {
      // Replace ${VAR_NAME} with actual environment variable
      expanded[key] = value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
        return process.env[envVar] || '';
      });
    } else {
      expanded[key] = value;
    }
  }
  return expanded;
}

async function testMCPServer(serverId, serverConfig) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing ${serverId}...`);
    
    const env = {
      ...process.env,
      ...expandEnvVars(serverConfig.env || {})
    };
    
    // Check if required environment variables are set
    const requiredVars = [];
    for (const [key, value] of Object.entries(serverConfig.env || {})) {
      if (value.includes('${') && !env[key.replace(/\$\{|\}/g, '')]) {
        requiredVars.push(key);
      }
    }
    
    if (requiredVars.length > 0 && serverConfig.priority === 'high') {
      console.log(`⚠️  ${serverId}: Missing required environment variables: ${requiredVars.join(', ')}`);
      resolve({ serverId, success: false, error: 'Missing environment variables', required: true });
      return;
    }
    
    if (requiredVars.length > 0) {
      console.log(`⏭️  ${serverId}: Skipping (missing optional environment variables)`);
      resolve({ serverId, success: true, skipped: true, required: false });
      return;
    }
    
    // Try to spawn the MCP server process
    const child = spawn(serverConfig.command, serverConfig.args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let hasResponded = false;
    
    const timeout = setTimeout(() => {
      if (!hasResponded) {
        child.kill('SIGTERM');
        console.log(`⚠️  ${serverId}: Timeout (server may be slow to start)`);
        resolve({ serverId, success: false, error: 'Timeout', required: serverConfig.priority === 'high' });
        hasResponded = true;
      }
    }, 10000); // 10 second timeout
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('error', (error) => {
      if (!hasResponded) {
        clearTimeout(timeout);
        console.log(`❌ ${serverId}: Failed to start - ${error.message}`);
        resolve({ serverId, success: false, error: error.message, required: serverConfig.priority === 'high' });
        hasResponded = true;
      }
    });
    
    child.on('exit', (code, signal) => {
      if (!hasResponded) {
        clearTimeout(timeout);
        if (code === 0 || signal === 'SIGTERM') {
          console.log(`✅ ${serverId}: OK`);
          resolve({ serverId, success: true, required: serverConfig.priority === 'high' });
        } else {
          console.log(`❌ ${serverId}: Exited with code ${code}`);
          if (stderr) {
            console.log(`   Error output: ${stderr.trim().substring(0, 100)}...`);
          }
          resolve({ serverId, success: false, error: `Exit code ${code}`, required: serverConfig.priority === 'high' });
        }
        hasResponded = true;
      }
    });
    
    // Send a test message to see if the server responds
    setTimeout(() => {
      try {
        child.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {}
        }) + '\n');
      } catch (error) {
        // Ignore write errors during testing
      }
    }, 1000);
  });
}

async function checkDependencies() {
  const checks = [];
  
  // Check if npx is available
  checks.push(new Promise((resolve) => {
    const child = spawn('npx', ['--version'], { stdio: 'pipe' });
    child.on('error', () => resolve({ name: 'npx', success: false }));
    child.on('exit', (code) => resolve({ name: 'npx', success: code === 0 }));
  }));
  
  // Check if required directories exist
  const configDir = path.join(process.cwd(), 'config');
  checks.push(Promise.resolve({
    name: 'config directory',
    success: fs.existsSync(configDir)
  }));
  
  const results = await Promise.all(checks);
  
  console.log('\n📋 DEPENDENCY CHECKS');
  console.log('===================');
  
  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  }
  
  const allDepsOk = results.every(r => r.success);
  if (!allDepsOk) {
    console.log('\n⚠️  Some dependencies are missing. The system may not work correctly.');
  }
  
  return allDepsOk;
}

async function main() {
  console.log('🧪 ACADEMIA WHATSAPP AUTOMATION - MCP CONNECTION TEST');
  console.log('===================================================');
  
  // Check dependencies first
  await checkDependencies();
  
  const config = await loadMCPConfig();
  const servers = config.mcp_servers;
  
  console.log('\n🔌 TESTING MCP SERVER CONNECTIONS');
  console.log('=================================');
  console.log(`Found ${Object.keys(servers).length} MCP servers to test\n`);
  
  const results = [];
  
  // Test servers in parallel, but limit concurrency
  const serverEntries = Object.entries(servers);
  const chunkSize = 3; // Test 3 servers at a time
  
  for (let i = 0; i < serverEntries.length; i += chunkSize) {
    const chunk = serverEntries.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(([serverId, serverConfig]) => 
      testMCPServer(serverId, serverConfig)
    );
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Small delay between chunks to avoid overwhelming the system
    if (i + chunkSize < serverEntries.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generate summary
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  
  const successful = results.filter(r => r.success && !r.skipped);
  const failed = results.filter(r => !r.success);
  const skipped = results.filter(r => r.skipped);
  const requiredFailed = failed.filter(r => r.required);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ WORKING SERVERS:');
    successful.forEach(r => console.log(`  - ${r.serverId}`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED SERVERS:');
    failed.forEach(r => {
      const priority = r.required ? '(HIGH PRIORITY)' : '(OPTIONAL)';
      console.log(`  - ${r.serverId} ${priority}: ${r.error}`);
    });
  }
  
  if (skipped.length > 0) {
    console.log('\n⏭️  SKIPPED SERVERS:');
    skipped.forEach(r => console.log(`  - ${r.serverId} (missing configuration)`));
  }
  
  console.log('\n📝 RECOMMENDATIONS');
  console.log('==================');
  
  if (requiredFailed.length > 0) {
    console.log('🚨 CRITICAL: Some high-priority MCP servers failed to start.');
    console.log('   The system may not function correctly.');
    console.log('   Please fix the following servers:');
    requiredFailed.forEach(r => console.log(`   - ${r.serverId}: ${r.error}`));
    console.log('   Run `npm run mcp:setup` to reconfigure credentials.');
    process.exit(1);
  } else if (failed.length > 0) {
    console.log('⚠️  Some optional MCP servers failed to start.');
    console.log('   The core system will work, but some features may be unavailable.');
    console.log('   Run `npm run mcp:setup` to configure missing services.');
  } else if (successful.length === 0) {
    console.log('⚠️  No MCP servers are configured.');
    console.log('   Run `npm run mcp:setup` to configure MCP integrations.');
  } else {
    console.log('🎉 All configured MCP servers are working correctly!');
    console.log('   You can now start the application with `npm run dev`');
  }
  
  console.log('\n🔗 USEFUL COMMANDS');
  console.log('=================');
  console.log('- npm run mcp:setup  : Configure MCP credentials');
  console.log('- npm run dev        : Start the application');
  console.log('- npm run mcp:test   : Re-run this test');
  console.log('');
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test cancelled by user');
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}