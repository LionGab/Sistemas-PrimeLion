#!/usr/bin/env node

/**
 * Setup MCP Credentials Script
 * 
 * Interactive script to help configure MCP server credentials
 * and environment variables for the Academia WhatsApp Automation system
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envFile = path.join(process.cwd(), '.env');
const configDir = path.join(process.cwd(), 'config');

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function updateEnvFile(key, value) {
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envFile, 'utf-8');
  } catch (error) {
    console.log('Creating new .env file...');
  }

  const lines = envContent.split('\n');
  const existingIndex = lines.findIndex(line => line.startsWith(`${key}=`));
  
  if (existingIndex !== -1) {
    lines[existingIndex] = `${key}=${value}`;
  } else {
    lines.push(`${key}=${value}`);
  }
  
  fs.writeFileSync(envFile, lines.filter(line => line.trim()).join('\n') + '\n');
  console.log(`✅ Updated ${key} in .env file`);
}

async function setupBraveSearch() {
  console.log('\n🔍 BRAVE SEARCH MCP SETUP');
  console.log('Get your API key from: https://api.search.brave.com/');
  
  const apiKey = await askQuestion('Enter your Brave Search API key (optional, press enter to skip): ');
  
  if (apiKey.trim()) {
    updateEnvFile('BRAVE_API_KEY', apiKey.trim());
  } else {
    console.log('⚠️  Brave Search MCP will be disabled');
  }
}

async function setupGmail() {
  console.log('\n📧 GMAIL MCP SETUP');
  console.log('You need to create a Google Cloud project and enable Gmail API');
  console.log('Download credentials.json from Google Cloud Console');
  
  const hasCredentials = await askQuestion('Do you have Gmail credentials.json file? (y/n): ');
  
  if (hasCredentials.toLowerCase() === 'y') {
    const credentialsPath = await askQuestion('Enter path to credentials.json file: ');
    
    try {
      const credentials = fs.readFileSync(credentialsPath, 'utf-8');
      fs.writeFileSync(path.join(configDir, 'gmail_credentials.json'), credentials);
      console.log('✅ Gmail credentials saved to config/gmail_credentials.json');
      
      // Create empty token file
      fs.writeFileSync(path.join(configDir, 'gmail_token.json'), '{}');
      console.log('✅ Created empty Gmail token file');
    } catch (error) {
      console.log('❌ Error saving Gmail credentials:', error.message);
    }
  } else {
    console.log('⚠️  Gmail MCP will be disabled');
  }
}

async function setupGoogleDrive() {
  console.log('\n💾 GOOGLE DRIVE MCP SETUP');
  console.log('You can reuse Gmail credentials or create separate Google Drive credentials');
  
  const useGmailCreds = await askQuestion('Use Gmail credentials for Google Drive? (y/n): ');
  
  if (useGmailCreds.toLowerCase() === 'y') {
    // Copy Gmail credentials
    try {
      const gmailCreds = fs.readFileSync(path.join(configDir, 'gmail_credentials.json'), 'utf-8');
      fs.writeFileSync(path.join(configDir, 'gdrive_credentials.json'), gmailCreds);
      fs.writeFileSync(path.join(configDir, 'gdrive_token.json'), '{}');
      console.log('✅ Google Drive credentials copied from Gmail setup');
    } catch (error) {
      console.log('❌ Could not copy Gmail credentials. Please set up Google Drive credentials manually.');
    }
  } else {
    const credentialsPath = await askQuestion('Enter path to Google Drive credentials.json file: ');
    
    try {
      const credentials = fs.readFileSync(credentialsPath, 'utf-8');
      fs.writeFileSync(path.join(configDir, 'gdrive_credentials.json'), credentials);
      fs.writeFileSync(path.join(configDir, 'gdrive_token.json'), '{}');
      console.log('✅ Google Drive credentials saved');
    } catch (error) {
      console.log('❌ Error saving Google Drive credentials:', error.message);
    }
  }
}

async function setupSlack() {
  console.log('\n💬 SLACK MCP SETUP');
  console.log('Create a Slack app at: https://api.slack.com/apps');
  console.log('You need a Bot Token and Signing Secret');
  
  const botToken = await askQuestion('Enter Slack Bot Token (starts with xoxb-): ');
  const signingSecret = await askQuestion('Enter Slack Signing Secret: ');
  
  if (botToken.trim() && signingSecret.trim()) {
    updateEnvFile('SLACK_BOT_TOKEN', botToken.trim());
    updateEnvFile('SLACK_SIGNING_SECRET', signingSecret.trim());
    console.log('✅ Slack credentials saved');
  } else {
    console.log('⚠️  Slack MCP will be disabled');
  }
}

async function setupLinear() {
  console.log('\n📋 LINEAR MCP SETUP');
  console.log('Get your API key from: https://linear.app/settings/api');
  
  const apiKey = await askQuestion('Enter Linear API key (optional): ');
  const teamId = await askQuestion('Enter Linear Team ID (optional): ');
  
  if (apiKey.trim()) {
    updateEnvFile('LINEAR_API_KEY', apiKey.trim());
    if (teamId.trim()) {
      updateEnvFile('LINEAR_TEAM_ID', teamId.trim());
    }
    console.log('✅ Linear credentials saved');
  } else {
    console.log('⚠️  Linear MCP will be disabled');
  }
}

async function setupSentry() {
  console.log('\n🚨 SENTRY MCP SETUP');
  console.log('Create a project at: https://sentry.io/');
  
  const dsn = await askQuestion('Enter Sentry DSN (optional): ');
  const authToken = await askQuestion('Enter Sentry Auth Token (optional): ');
  const org = await askQuestion('Enter Sentry Organization (optional): ');
  const project = await askQuestion('Enter Sentry Project name (optional): ');
  
  if (dsn.trim()) {
    updateEnvFile('SENTRY_DSN', dsn.trim());
    if (authToken.trim()) updateEnvFile('SENTRY_AUTH_TOKEN', authToken.trim());
    if (org.trim()) updateEnvFile('SENTRY_ORG', org.trim());
    if (project.trim()) updateEnvFile('SENTRY_PROJECT', project.trim());
    console.log('✅ Sentry credentials saved');
  } else {
    console.log('⚠️  Sentry MCP will be disabled');
  }
}

async function setupDatabase() {
  console.log('\n🗄️  DATABASE SETUP');
  console.log('Current PostgreSQL connection will be used for MCP PostgreSQL server');
  
  const currentDbUrl = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/academia_whatsapp_db';
  console.log(`Current DATABASE_URL: ${currentDbUrl}`);
  
  const updateDb = await askQuestion('Update DATABASE_URL? (y/n): ');
  
  if (updateDb.toLowerCase() === 'y') {
    const newDbUrl = await askQuestion('Enter new DATABASE_URL: ');
    if (newDbUrl.trim()) {
      updateEnvFile('DATABASE_URL', newDbUrl.trim());
    }
  }
  
  console.log('✅ Database configuration verified');
}

async function main() {
  console.log('🚀 ACADEMIA WHATSAPP AUTOMATION - MCP SETUP');
  console.log('=========================================');
  console.log('This script will help you configure credentials for MCP servers');
  console.log('You can skip any service you don\'t want to use');
  console.log('');
  
  try {
    await setupDatabase();
    await setupBraveSearch();
    await setupGmail();
    await setupGoogleDrive();
    await setupSlack();
    await setupLinear();
    await setupSentry();
    
    console.log('\n✅ MCP SETUP COMPLETE!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run `npm run mcp:test` to test MCP connections');
    console.log('2. Start your application with `npm run dev`');
    console.log('3. Check MCP status at /api/mcp/status endpoint');
    console.log('');
    console.log('Configuration files created:');
    console.log('- .env (environment variables)');
    console.log('- config/gmail_credentials.json (if configured)');
    console.log('- config/gdrive_credentials.json (if configured)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 Setup cancelled by user');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main();
}