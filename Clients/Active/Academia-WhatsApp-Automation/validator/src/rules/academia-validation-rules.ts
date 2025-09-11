/**
 * Full Force Academia - Advanced Workflow Validation Rules
 * Comprehensive validation for gym member reactivation workflows
 */

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'performance' | 'security' | 'logic' | 'compliance' | 'business';
  validate: (workflow: any) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
}

// Academia-specific validation rules
export const ACADEMIA_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'rate_limit_compliance',
    name: 'WhatsApp Rate Limit Compliance',
    description: 'Ensure WhatsApp messaging respects rate limits to avoid blocking',
    severity: 'error',
    category: 'compliance',
    validate: (workflow) => {
      const whatsappNodes = workflow.nodes?.filter((node: any) => 
        node.type?.includes('whatsapp') || node.type?.includes('httpRequest')
      ) || [];
      
      for (const node of whatsappNodes) {
        const delay = node.parameters?.delay || 0;
        if (delay < 3000) {
          return {
            valid: false,
            message: 'WhatsApp node missing proper rate limiting',
            details: { nodeId: node.id, currentDelay: delay },
            suggestions: [
              'Add minimum 3 second delay between messages',
              'Consider implementing exponential backoff',
              'Add daily message limit check'
            ]
          };
        }
      }
      
      return { valid: true, message: 'WhatsApp rate limits properly configured' };
    }
  },
  
  {
    id: 'lgpd_data_protection',
    name: 'LGPD Data Protection Compliance',
    description: 'Ensure personal data is handled according to Brazilian LGPD requirements',
    severity: 'error',
    category: 'compliance',
    validate: (workflow) => {
      const dataNodes = workflow.nodes?.filter((node: any) => 
        node.type?.includes('googleSheets') || 
        node.type?.includes('database') ||
        node.type?.includes('webhook')
      ) || [];
      
      const violations = [];
      
      for (const node of dataNodes) {
        // Check for unencrypted personal data storage
        if (node.parameters?.includePersonalData && !node.parameters?.encryption) {
          violations.push({
            nodeId: node.id,
            issue: 'Personal data stored without encryption'
          });
        }
        
        // Check for proper data retention settings
        if (!node.parameters?.dataRetentionDays) {
          violations.push({
            nodeId: node.id,
            issue: 'Missing data retention configuration'
          });
        }
      }
      
      if (violations.length > 0) {
        return {
          valid: false,
          message: 'LGPD compliance violations detected',
          details: violations,
          suggestions: [
            'Enable encryption for personal data fields',
            'Configure data retention periods (max 7 years)',
            'Add consent validation before data processing',
            'Implement data deletion mechanisms'
          ]
        };
      }
      
      return { valid: true, message: 'LGPD compliance verified' };
    }
  },
  
  {
    id: 'academia_business_logic',
    name: 'Academia Business Logic Validation',
    description: 'Validate gym-specific business rules and logic',
    severity: 'warning',
    category: 'business',
    validate: (workflow) => {
      const issues = [];
      
      // Check for proper student categorization
      const categoryNodes = workflow.nodes?.filter((node: any) => 
        node.parameters?.categoria || node.parameters?.category
      ) || [];
      
      for (const node of categoryNodes) {
        const validCategories = ['QUENTE', 'MORNO', 'FRIO'];
        const nodeCategories = node.parameters?.categoria || node.parameters?.category;
        
        if (nodeCategories && !validCategories.includes(nodeCategories)) {
          issues.push({
            nodeId: node.id,
            issue: `Invalid category: ${nodeCategories}`,
            expected: validCategories
          });
        }
      }
      
      // Check for proper ROI calculation
      const roiNodes = workflow.nodes?.filter((node: any) => 
        node.name?.toLowerCase().includes('roi') || 
        node.parameters?.calculateROI
      ) || [];
      
      if (roiNodes.length === 0) {
        issues.push({
          issue: 'Missing ROI calculation in reactivation workflow',
          recommendation: 'Add ROI tracking for business metrics'
        });
      }
      
      // Check for proper message personalization
      const messageNodes = workflow.nodes?.filter((node: any) => 
        node.type?.includes('message') || node.type?.includes('whatsapp')
      ) || [];
      
      for (const node of messageNodes) {
        const message = node.parameters?.text || node.parameters?.message || '';
        if (!message.includes('{{nome}}') && !message.includes('{{name}}')) {
          issues.push({
            nodeId: node.id,
            issue: 'Message not personalized with student name',
            recommendation: 'Add {{nome}} placeholder for personalization'
          });
        }
      }
      
      if (issues.length > 0) {
        return {
          valid: false,
          message: 'Academia business logic issues detected',
          details: issues,
          suggestions: [
            'Use standard categories: QUENTE, MORNO, FRIO',
            'Include ROI calculation in all reactivation workflows',
            'Personalize all messages with student names',
            'Add gym location (Matupá-MT) in messages'
          ]
        };
      }
      
      return { valid: true, message: 'Academia business logic validated' };
    }
  },
  
  {
    id: 'performance_optimization',
    name: 'Performance Optimization Check',
    description: 'Ensure workflows are optimized for high-volume processing',
    severity: 'warning',
    category: 'performance',
    validate: (workflow) => {
      const issues = [];
      
      // Check for batch processing
      const dataProcessingNodes = workflow.nodes?.filter((node: any) => 
        node.type?.includes('googleSheets') || 
        node.type?.includes('itemLists') ||
        node.type?.includes('split')
      ) || [];
      
      for (const node of dataProcessingNodes) {
        if (!node.parameters?.batchSize && !node.parameters?.limit) {
          issues.push({
            nodeId: node.id,
            issue: 'Missing batch size configuration',
            impact: 'May cause memory issues with large datasets'
          });
        }
      }
      
      // Check for proper error handling
      const httpNodes = workflow.nodes?.filter((node: any) => 
        node.type?.includes('httpRequest') || node.type?.includes('webhook')
      ) || [];
      
      for (const node of httpNodes) {
        if (!node.parameters?.timeout) {
          issues.push({
            nodeId: node.id,
            issue: 'Missing timeout configuration',
            impact: 'May cause workflow to hang indefinitely'
          });
        }
        
        if (!node.parameters?.retry) {
          issues.push({
            nodeId: node.id,
            issue: 'Missing retry configuration',
            impact: 'Temporary failures may cause data loss'
          });
        }
      }
      
      // Check for parallel processing opportunities
      const sequentialNodes = workflow.connections || {};
      const nodeCount = workflow.nodes?.length || 0;
      
      if (nodeCount > 5 && Object.keys(sequentialNodes).length < nodeCount - 1) {
        issues.push({
          issue: 'Workflow may benefit from parallel processing',
          recommendation: 'Consider running independent operations in parallel'
        });
      }
      
      if (issues.length > 0) {
        return {
          valid: false,
          message: 'Performance optimization opportunities found',
          details: issues,
          suggestions: [
            'Add batch processing for large datasets (500 items max)',
            'Configure timeouts (30s for API calls)',
            'Add retry mechanisms (3 attempts with exponential backoff)',
            'Use parallel execution where possible',
            'Cache frequently accessed data'
          ]
        };
      }
      
      return { valid: true, message: 'Performance optimizations verified' };
    }
  },
  
  {
    id: 'error_handling_coverage',
    name: 'Comprehensive Error Handling',
    description: 'Ensure all critical paths have proper error handling',
    severity: 'error',
    category: 'logic',
    validate: (workflow) => {
      const criticalNodes = workflow.nodes?.filter((node: any) => 
        node.type?.includes('httpRequest') || 
        node.type?.includes('googleSheets') ||
        node.type?.includes('webhook') ||
        node.type?.includes('database')
      ) || [];
      
      const missingErrorHandling = [];
      
      for (const node of criticalNodes) {
        const hasErrorHandling = workflow.nodes?.some((errorNode: any) => 
          errorNode.type?.includes('if') && 
          errorNode.parameters?.conditions?.some((condition: any) => 
            condition.leftValue?.includes('error') || 
            condition.leftValue?.includes('status')
          )
        );
        
        if (!hasErrorHandling) {
          missingErrorHandling.push({
            nodeId: node.id,
            nodeType: node.type,
            riskLevel: 'high'
          });
        }
      }
      
      if (missingErrorHandling.length > 0) {
        return {
          valid: false,
          message: 'Critical nodes missing error handling',
          details: missingErrorHandling,
          suggestions: [
            'Add IF nodes to check for HTTP status codes',
            'Implement fallback mechanisms for failed operations',
            'Add logging for all error conditions',
            'Configure email alerts for critical failures',
            'Add circuit breaker pattern for external APIs'
          ]
        };
      }
      
      return { valid: true, message: 'Error handling coverage adequate' };
    }
  },
  
  {
    id: 'security_credentials',
    name: 'Credential Security Check',
    description: 'Ensure all credentials are properly secured',
    severity: 'error',
    category: 'security',
    validate: (workflow) => {
      const securityIssues = [];
      
      // Check for hardcoded credentials
      const allNodes = workflow.nodes || [];
      for (const node of allNodes) {
        const parametersStr = JSON.stringify(node.parameters || {});
        
        // Check for common credential patterns
        const credentialPatterns = [
          /password["\s]*:["\s]*[^{][^"]+/i,
          /api[_-]?key["\s]*:["\s]*[^{][^"]+/i,
          /secret["\s]*:["\s]*[^{][^"]+/i,
          /token["\s]*:["\s]*[^{][^"]+/i
        ];
        
        for (const pattern of credentialPatterns) {
          if (pattern.test(parametersStr)) {
            securityIssues.push({
              nodeId: node.id,
              issue: 'Potential hardcoded credential detected',
              severity: 'critical'
            });
          }
        }
        
        // Check for proper credential references
        if (node.parameters?.authentication && !node.parameters?.authentication?.includes('{{')) {
          securityIssues.push({
            nodeId: node.id,
            issue: 'Authentication not using environment variables',
            severity: 'high'
          });
        }
      }
      
      if (securityIssues.length > 0) {
        return {
          valid: false,
          message: 'Security vulnerabilities detected',
          details: securityIssues,
          suggestions: [
            'Use environment variables for all credentials',
            'Implement credential encryption at rest',
            'Rotate API keys regularly',
            'Use OAuth2 where possible',
            'Audit credential access logs'
          ]
        };
      }
      
      return { valid: true, message: 'Credential security verified' };
    }
  }
];

// Validation severity levels
export const VALIDATION_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// Academia-specific thresholds
export const ACADEMIA_THRESHOLDS = {
  MAX_DAILY_MESSAGES: 20,
  MIN_MESSAGE_DELAY: 3000,
  MAX_BATCH_SIZE: 500,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  ROI_TARGET_MONTHLY: 12600,
  CONVERSION_RATE_TARGET: 0.15,
  RESPONSE_RATE_TARGET: 0.25
};

export default ACADEMIA_VALIDATION_RULES;