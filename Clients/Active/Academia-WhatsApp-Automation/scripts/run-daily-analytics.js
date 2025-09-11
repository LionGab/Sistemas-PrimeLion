#!/usr/bin/env node

/**
 * Run Daily Analytics Script
 * 
 * Executes the daily analytics workflow using MCP integrations
 * Can be run manually or scheduled via cron
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Since we're running this as a standalone script, we'll use a simplified version
// In production, this would connect to the actual MCP system

async function generateDailyAnalytics() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 RUNNING DAILY ANALYTICS');
    console.log('==========================');
    console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
    console.log('');
    
    // Get all active academies
    const academies = await prisma.academia.findMany({
      where: { planoAtivo: true }
    });
    
    console.log(`Found ${academies.length} active academies`);
    
    const results = [];
    
    for (const academy of academies) {
      console.log(`\n🏋️ Processing ${academy.nome} (${academy.id})`);
      
      // Get today's metrics
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // Member counts
      const totalMembers = await prisma.aluno.count({
        where: { academiaId: academy.id }
      });
      
      const activeMembers = await prisma.aluno.count({
        where: { 
          academiaId: academy.id,
          status: 'ATIVO'
        }
      });
      
      const inactiveMembers = await prisma.aluno.count({
        where: { 
          academiaId: academy.id,
          status: 'INATIVO'
        }
      });
      
      // New members today
      const newMembers = await prisma.aluno.count({
        where: {
          academiaId: academy.id,
          createdAt: { gte: yesterday }
        }
      });
      
      // Members who trained today
      const membersTrainedToday = await prisma.aluno.count({
        where: {
          academiaId: academy.id,
          frequencia: {
            some: {
              dataVisita: { gte: yesterday }
            }
          }
        }
      });
      
      // Messages sent today
      const messagesSentToday = await prisma.mensagem.count({
        where: {
          academiaId: academy.id,
          tipo: 'SAIDA',
          createdAt: { gte: yesterday }
        }
      });
      
      // Responses received today
      const responsesToday = await prisma.mensagem.count({
        where: {
          academiaId: academy.id,
          tipo: 'ENTRADA',
          createdAt: { gte: yesterday }
        }
      });
      
      // Response rate
      const responseRate = messagesSentToday > 0 
        ? (responsesToday / messagesSentToday * 100).toFixed(1)
        : '0.0';
      
      // Estimated monthly revenue (assuming R$150 average)
      const estimatedRevenue = activeMembers * 150;
      
      const dayMetrics = {
        academy: academy.nome,
        academiaId: academy.id,
        date: today.toISOString().split('T')[0],
        members: {
          total: totalMembers,
          active: activeMembers,
          inactive: inactiveMembers,
          newToday: newMembers,
          trainedToday: membersTrainedToday
        },
        messaging: {
          sentToday: messagesSentToday,
          receivedToday: responsesToday,
          responseRate: `${responseRate}%`
        },
        revenue: {
          estimated: estimatedRevenue,
          formatted: `R$ ${estimatedRevenue.toLocaleString('pt-BR')}`
        }
      };
      
      results.push(dayMetrics);
      
      // Display metrics
      console.log(`  👥 Members: ${totalMembers} total (${activeMembers} active, ${inactiveMembers} inactive)`);
      console.log(`  📈 New today: ${newMembers}`);
      console.log(`  🏃 Trained today: ${membersTrainedToday}`);
      console.log(`  💬 Messages: ${messagesSentToday} sent, ${responsesToday} received (${responseRate}% response rate)`);
      console.log(`  💰 Estimated revenue: R$ ${estimatedRevenue.toLocaleString('pt-BR')}/month`);
    }
    
    // Generate summary
    const summary = {
      date: today.toISOString().split('T')[0],
      academies: results.length,
      totals: {
        members: results.reduce((sum, r) => sum + r.members.total, 0),
        activeMembers: results.reduce((sum, r) => sum + r.members.active, 0),
        newMembersToday: results.reduce((sum, r) => sum + r.members.newToday, 0),
        trainedToday: results.reduce((sum, r) => sum + r.members.trainedToday, 0),
        messagesSent: results.reduce((sum, r) => sum + r.messaging.sentToday, 0),
        responsesReceived: results.reduce((sum, r) => sum + r.messaging.receivedToday, 0),
        totalRevenue: results.reduce((sum, r) => sum + r.revenue.estimated, 0)
      }
    };
    
    console.log('\n📈 DAILY SUMMARY');
    console.log('================');
    console.log(`Total Members: ${summary.totals.members}`);
    console.log(`Active Members: ${summary.totals.activeMembers}`);
    console.log(`New Members Today: ${summary.totals.newMembersToday}`);
    console.log(`Trained Today: ${summary.totals.trainedToday}`);
    console.log(`Messages Sent: ${summary.totals.messagesSent}`);
    console.log(`Responses: ${summary.totals.responsesReceived}`);
    console.log(`Total Revenue: R$ ${summary.totals.totalRevenue.toLocaleString('pt-BR')}/month`);
    
    // In a full MCP implementation, this would:
    // 1. Generate HTML/PDF reports
    // 2. Send email notifications
    // 3. Post Slack updates
    // 4. Save reports to Google Drive
    // 5. Update dashboards
    
    console.log('\n📝 REPORT SAVED');
    console.log('===============');
    
    // Save JSON report
    const reportFile = `daily-report-${today.toISOString().split('T')[0]}.json`;
    const reportPath = `./reports/${reportFile}`;
    
    // Ensure reports directory exists
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(process.cwd(), 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(reportsDir, reportFile), JSON.stringify({
      summary,
      academies: results,
      generatedAt: new Date().toISOString()
    }, null, 2));
    
    console.log(`Report saved to: ${reportPath}`);
    console.log('\n✅ Daily analytics completed successfully!');
    
    // Placeholder for MCP integrations that would normally happen:
    console.log('\n🔗 MCP INTEGRATIONS (when configured):');
    console.log('- 📧 Email report sent to administrators');
    console.log('- 💬 Slack notification posted to #academia-reports');
    console.log('- 💾 Report backup saved to Google Drive');
    console.log('- 📊 Dashboard metrics updated');
    
  } catch (error) {
    console.error('❌ Daily analytics failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await generateDailyAnalytics();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Analytics cancelled by user');
  process.exit(0);
});

if (require.main === module) {
  main();
}