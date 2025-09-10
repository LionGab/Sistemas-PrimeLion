/**
 * Test server for audit functionality
 * Simplified server to test the audit endpoints
 */

import fastify from 'fastify';

const server = fastify({ logger: true });

// Mock audit responses
const mockAuditResponses = {
  whatsapp: {
    type: 'whatsapp_performance',
    academiaId: 'test-academia',
    timestamp: new Date(),
    results: {
      deliveryRate: 96.5,
      responseTime: 1.2,
      messagesPerHour: 87,
      connectionStability: 99.8,
      errorRate: 0.2,
      score: 95,
      status: 'excellent',
      recommendations: [
        'Continue monitoring delivery rates',
        'Consider scaling message queue for peak hours'
      ]
    }
  },
  compliance: {
    type: 'lgpd_compliance',
    academiaId: 'test-academia', 
    timestamp: new Date(),
    results: {
      consentManagement: 100,
      dataRetention: 100,
      auditTrails: 100,
      optOutProcessing: 100,
      dataEncryption: 100,
      score: 100,
      status: 'compliant',
      recommendations: [
        'All LGPD requirements met',
        'Continue regular compliance monitoring'
      ]
    }
  },
  performance: {
    type: 'system_performance',
    academiaId: 'test-academia',
    timestamp: new Date(),
    results: {
      systemUptime: 99.9,
      databasePerformance: 95.2,
      queueHealth: 98.1,
      memoryUsage: 72.3,
      responseTime: 156,
      score: 96,
      status: 'excellent',
      recommendations: [
        'Consider memory optimization for peak loads',
        'Database queries performing well'
      ]
    }
  },
  roi: {
    type: 'roi_analysis',
    academiaId: 'test-academia',
    timestamp: new Date(),
    results: {
      monthlyRevenue: 15640,
      reactivationROI: 340,
      conversionRate: 18.7,
      costPerAcquisition: 89,
      lifetimeValue: 2340,
      score: 92,
      status: 'excellent',
      recommendations: [
        'ROI exceeding targets by 40%',
        'Consider expanding successful automation flows'
      ]
    }
  },
  complete: {
    type: 'complete_audit',
    academiaId: 'test-academia',
    timestamp: new Date(),
    overallScore: 95.8,
    status: 'excellent',
    categories: {
      whatsapp: { score: 95, status: 'excellent' },
      compliance: { score: 100, status: 'compliant' },
      performance: { score: 96, status: 'excellent' },
      roi: { score: 92, status: 'excellent' }
    },
    keyMetrics: {
      totalRevenue: 15640,
      messagesDelivered: 3247,
      membersReactivated: 89,
      complianceScore: 100
    },
    recommendations: [
      'System performing exceptionally well',
      'Continue monitoring WhatsApp delivery rates',
      'Consider scaling automation for increased capacity',
      'Maintain current compliance standards'
    ]
  }
};

// Audit endpoints
server.post('/api/audit/complete', async (request, reply) => {
  return mockAuditResponses.complete;
});

server.post('/api/audit/whatsapp', async (request, reply) => {
  return mockAuditResponses.whatsapp;
});

server.post('/api/audit/compliance', async (request, reply) => {
  return mockAuditResponses.compliance;
});

server.post('/api/audit/performance', async (request, reply) => {
  return mockAuditResponses.performance;
});

server.post('/api/audit/roi', async (request, reply) => {
  return mockAuditResponses.roi;
});

server.get('/api/audit/dashboard', async (request, reply) => {
  return {
    overview: {
      overallScore: 95.8,
      status: 'excellent',
      lastAudit: new Date(),
      totalRevenue: 15640,
      activeAutomations: 3
    },
    categories: mockAuditResponses.complete.categories,
    recentActivity: [
      { time: new Date(), action: 'Audit completed', score: 95.8 },
      { time: new Date(Date.now() - 3600000), action: 'WhatsApp audit', score: 95 },
      { time: new Date(Date.now() - 7200000), action: 'ROI analysis', score: 92 }
    ]
  };
});

// Health check
server.get('/health', async (request, reply) => {
  return { status: 'healthy', service: 'Academia WhatsApp Audit System' };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Academia WhatsApp Audit Test Server running on http://localhost:3001');
    console.log('📊 Available audit endpoints:');
    console.log('  POST /api/audit/complete');
    console.log('  POST /api/audit/whatsapp');
    console.log('  POST /api/audit/compliance');
    console.log('  POST /api/audit/performance');
    console.log('  POST /api/audit/roi');
    console.log('  GET  /api/audit/dashboard');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();