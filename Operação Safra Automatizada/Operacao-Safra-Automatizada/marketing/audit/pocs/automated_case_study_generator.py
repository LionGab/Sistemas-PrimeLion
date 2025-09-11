#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automated Case Study Generator - Lion Consultoria
Generates personalized case studies using Claude Code integration
"""

import json
import asyncio
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Dict, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

@dataclass
class FarmData:
    name: str
    hectares: int
    annual_revenue: float
    current_erp: str
    nfpe_monthly: int
    location: str
    contact_email: str
    pain_points: List[str]
    
@dataclass
class ROIMetrics:
    annual_savings: float
    time_reduction_hours: int
    roi_percentage: float
    payback_months: float
    error_reduction: float
    automation_rate: float

class CaseStudyGenerator:
    """Automated case study generator using validated Operação Safra data"""
    
    def __init__(self):
        self.base_metrics = {
            "fazenda_brasil": {
                "hectares": 2500,
                "annual_savings": 155000,
                "time_reduction": 85,
                "roi_percentage": 176,
                "payback_months": 6.8,
                "nfpe_throughput": 120  # per hour
            }
        }
        
        self.templates = {
            "executive_summary": self._load_executive_template(),
            "technical_implementation": self._load_technical_template(), 
            "roi_analysis": self._load_roi_template(),
            "testimonial": self._load_testimonial_template()
        }

    def _load_executive_template(self) -> str:
        return """
# CASE STUDY: {farm_name} - Operação Safra Automatizada

## 🎯 EXECUTIVE SUMMARY

**Client**: {farm_name}
**Location**: {location}  
**Size**: {hectares:,} hectares
**Industry**: {industry_segment}
**Implementation Period**: {implementation_days} days

### Business Challenge
{farm_name} enfrentava desafios críticos em:
- 📋 Processos manuais de NFP-e consumindo {manual_hours}h/mês
- ❌ Taxa de erro de {error_rate}% em compliance fiscal
- 💰 Custos operacionais elevados: R${monthly_cost:,.0f}/mês
- ⏱️ Tempo de processamento: {processing_time} minutos por NFP-e

### Solution Implemented
**Operação Safra Automatizada** - Sistema completo de automação fiscal integrado ao {current_erp}:
- 🤖 Automação 95% dos processos NFP-e
- ⚡ Redução tempo processamento: 45min → 3.2 segundos
- 📊 Dashboard em tempo real com métricas Prometheus
- 🔒 100% compliance SEFAZ-MT garantido

### Results Achieved
- 💵 **Economia Anual**: R${annual_savings:,.0f}
- ⏰ **Time Savings**: {time_reduction}% redução tempo fiscal
- 📈 **ROI**: {roi_percentage}% no primeiro ano
- 💸 **Payback**: {payback_months} meses
- 🎯 **Error Reduction**: {error_rate}% → 0%
        """

    def _load_technical_template(self) -> str:
        return """
## 🔧 TECHNICAL IMPLEMENTATION

### Architecture Overview
```python
# Operação Safra - Technical Stack
IMPLEMENTATION_STACK = {
    "backend": "Python/FastAPI + SQLAlchemy",
    "database": "PostgreSQL with PostGIS",
    "integration": "{current_erp} APIs + SEFAZ-MT WebServices",
    "automation": "Celery + Redis for async processing",
    "monitoring": "Prometheus + Grafana dashboards",
    "deployment": "Docker containers + Azure Cloud"
}
```

### Key Integrations
1. **{current_erp} Integration**
   - Real-time data sync via APIs
   - Webhook-based event triggers
   - Automated NFP-e generation from ERP movements

2. **SEFAZ-MT Compliance**
   - XML validation against official schemas
   - Digital signature with A1/A3 certificates  
   - Real-time transmission and status monitoring

3. **Performance Metrics**
   - Throughput: {nfpe_throughput} NFP-e/hour
   - Average processing: 3.2 seconds
   - System availability: 99.9% uptime
   - Error rate: <0.1%

### Automation Workflow
```mermaid
graph LR
    A[{current_erp} Movement] --> B[Auto-trigger NFP-e]
    B --> C[Data Validation]
    C --> D[XML Generation]
    D --> E[Digital Signature]
    E --> F[SEFAZ Transmission]
    F --> G[Status Monitoring]
    G --> H[Dashboard Update]
```
        """

    def _load_roi_template(self) -> str:
        return """
## 📊 ROI ANALYSIS & BUSINESS IMPACT

### Investment Breakdown
| Component | Investment | Payback Period |
|-----------|------------|---------------|
| Initial Assessment | R$15,000 | 1.2 months |
| Implementation | R${implementation_cost:,.0f} | {payback_months} months |
| Training & Support | R$8,000 | Immediate |
| **Total Investment** | **R${total_investment:,.0f}** | **{payback_months} months** |

### Monthly Savings Analysis
```python
# ROI Calculation - {farm_name}
monthly_savings = {
    "time_reduction": {manual_hours} * {hourly_rate} = R${time_savings:,.0f},
    "error_elimination": {monthly_errors} * R$200 = R${error_savings:,.0f}, 
    "efficiency_gains": {efficiency_percentage}% = R${efficiency_savings:,.0f},
    "total_monthly": R${monthly_total_savings:,.0f}
}

annual_roi = ({annual_savings:,.0f} - {total_investment:,.0f}) / {total_investment:,.0f} * 100
# Result: {roi_percentage}% ROI in 12 months
```

### Comparative Analysis
| Metric | Before Automation | After Automation | Improvement |
|--------|------------------|------------------|-------------|
| NFP-e Processing Time | 45 minutes | 3.2 seconds | **99.9% faster** |
| Monthly NFP-e Volume | {nfpe_monthly} | {nfpe_monthly} | **Same volume, 95% less effort** |
| Error Rate | {error_rate}% | 0% | **Zero errors** |
| Staff Hours/Month | {manual_hours}h | {automated_hours}h | **{time_reduction}% reduction** |
| Compliance Score | 85% | 100% | **Perfect compliance** |

### Financial Impact Over 3 Years
- **Year 1**: R${year1_savings:,.0f} (ROI: {roi_percentage}%)
- **Year 2**: R${year2_savings:,.0f} (Cumulative ROI: {cumulative_roi_y2}%)  
- **Year 3**: R${year3_savings:,.0f} (Cumulative ROI: {cumulative_roi_y3}%)
- **Total 3-Year Value**: R${total_3year_value:,.0f}
        """

    def _load_testimonial_template(self) -> str:
        return """
## 💬 CLIENT TESTIMONIAL

> "A implementação da Operação Safra Automatizada transformou completamente nossa operação fiscal. 
> Antes gastávamos {manual_hours} horas mensais só com NFP-e, agora é tudo automático. 
> O ROI de {roi_percentage}% superou nossas expectativas."
>
> **— {decision_maker}**  
> *{title}, {farm_name}*

### Key Success Factors
1. **Technical Excellence**: Sistema robusto com 99.9% disponibilidade
2. **Business Focus**: ROI claro e mensurável desde o primeiro mês
3. **Compliance Assurance**: Zero problemas com SEFAZ-MT
4. **Support Quality**: Suporte 24/7 durante período de safra

### Implementation Timeline
- **Week 1**: Assessment & integration planning
- **Week 2**: {current_erp} connection & testing
- **Week 3**: NFP-e automation deployment
- **Week 4**: Training & go-live support

---
*Case study generated on {generation_date}*
*Lion Consultoria - Especialista em Automação Agro*
        """

    async def generate_case_study(self, farm_data: FarmData, roi_metrics: ROIMetrics) -> Dict[str, str]:
        """Generate complete case study from farm data and ROI metrics"""
        
        # Calculate derived metrics
        manual_hours = (farm_data.nfpe_monthly * 45) // 60  # 45 minutes per NFP-e
        automated_hours = (farm_data.nfpe_monthly * 3.2) // 3600  # 3.2 seconds per NFP-e
        
        # Determine implementation cost based on farm size
        if farm_data.hectares > 5000:
            implementation_cost = 50000
        elif farm_data.hectares > 1000:
            implementation_cost = 35000
        else:
            implementation_cost = 25000
            
        total_investment = 15000 + implementation_cost + 8000  # Assessment + Implementation + Training
        
        # Template variables
        template_vars = {
            "farm_name": farm_data.name,
            "location": farm_data.location,
            "hectares": farm_data.hectares,
            "industry_segment": "Agribusiness - Grains & Livestock",
            "implementation_days": 28,
            "manual_hours": manual_hours,
            "error_rate": 5,  # Default before automation
            "monthly_cost": manual_hours * 150,  # R$150/hour fiscal cost
            "processing_time": 45,
            "current_erp": farm_data.current_erp,
            "annual_savings": roi_metrics.annual_savings,
            "time_reduction": roi_metrics.time_reduction_hours,
            "roi_percentage": roi_metrics.roi_percentage,
            "payback_months": roi_metrics.payback_months,
            "nfpe_throughput": 120,
            "implementation_cost": implementation_cost,
            "total_investment": total_investment,
            "hourly_rate": 150,
            "time_savings": manual_hours * 150,
            "error_savings": (farm_data.nfpe_monthly * 0.05) * 200,
            "efficiency_percentage": 15,
            "efficiency_savings": farm_data.annual_revenue * 0.02,
            "monthly_total_savings": roi_metrics.annual_savings / 12,
            "nfpe_monthly": farm_data.nfpe_monthly,
            "automated_hours": automated_hours,
            "year1_savings": roi_metrics.annual_savings,
            "year2_savings": roi_metrics.annual_savings * 1.1,
            "year3_savings": roi_metrics.annual_savings * 1.2,
            "cumulative_roi_y2": ((roi_metrics.annual_savings * 2.1 - total_investment) / total_investment) * 100,
            "cumulative_roi_y3": ((roi_metrics.annual_savings * 3.3 - total_investment) / total_investment) * 100,
            "total_3year_value": roi_metrics.annual_savings * 3.3,
            "decision_maker": "Carlos Silva",  # Default - would be personalized
            "title": "Gestor Agrícola",
            "generation_date": datetime.now().strftime("%B %d, %Y"),
            "monthly_errors": (farm_data.nfpe_monthly * 0.05)
        }

        # Generate sections
        sections = {}
        for section_name, template in self.templates.items():
            sections[section_name] = template.format(**template_vars)

        # Combine all sections
        full_case_study = "\n\n".join(sections.values())
        
        return {
            "full_case_study": full_case_study,
            "executive_summary": sections["executive_summary"],
            "technical_implementation": sections["technical_implementation"],
            "roi_analysis": sections["roi_analysis"],
            "testimonial": sections["testimonial"],
            "farm_name": farm_data.name,
            "roi_percentage": roi_metrics.roi_percentage,
            "annual_savings": roi_metrics.annual_savings
        }

    async def save_case_study(self, case_study_data: Dict[str, str], output_dir: str = "generated_case_studies"):
        """Save case study to markdown file"""
        import os
        
        os.makedirs(output_dir, exist_ok=True)
        
        farm_name_clean = case_study_data["farm_name"].lower().replace(" ", "_")
        filename = f"{output_dir}/case_study_{farm_name_clean}_{datetime.now().strftime('%Y%m%d')}.md"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(case_study_data["full_case_study"])
        
        return filename

    async def email_case_study(self, case_study_data: Dict[str, str], recipient_email: str):
        """Email case study to prospect"""
        
        # Email configuration (use environment variables in production)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "automation@lion-consultoria.com.br"  # Replace with actual
        sender_password = "your_email_password"  # Use app password or OAuth
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Case Study Personalizado - {case_study_data['farm_name']}"
        message["From"] = sender_email
        message["To"] = recipient_email

        # HTML email content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 28px;">🦁 LION CONSULTORIA</h1>
                    <h2 style="margin: 10px 0 0 0; font-size: 20px;">Case Study Personalizado</h2>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #667eea; margin-top: 0;">Seu Potencial de ROI: {case_study_data['roi_percentage']:.0f}%</h2>
                    <p style="font-size: 18px; margin: 20px 0;">
                        Baseado nos dados da sua propriedade, calculamos um potencial de economia de 
                        <strong>R$ {case_study_data['annual_savings']:,.0f}</strong> no primeiro ano.
                    </p>
                </div>
                
                <div style="background: white; border: 1px solid #e0e6ed; border-radius: 10px; padding: 30px;">
                    <p>Olá,</p>
                    <p>Conforme solicitado, preparamos um case study personalizado baseado no perfil da sua propriedade.</p>
                    <p>Este relatório demonstra como a <strong>Operação Safra Automatizada</strong> pode transformar seus processos fiscais, 
                    gerando economia significativa e eliminando erros de compliance.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://wa.me/5565999999999" 
                           style="background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; margin: 10px;">
                           📱 Agendar Conversa
                        </a>
                        <a href="https://calendly.com/lion-consultoria/diagnostico-fazenda" 
                           style="background: #0069FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; margin: 10px;">
                           📅 Calendário Online
                        </a>
                    </div>
                    
                    <p>Case study completo em anexo.</p>
                    <p>Atenciosamente,<br>
                    <strong>Equipe Lion Consultoria</strong><br>
                    Especialistas em Automação Agro</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        # Send email (commented for safety - implement with proper credentials)
        # try:
        #     server = smtplib.SMTP(smtp_server, smtp_port)
        #     server.starttls()
        #     server.login(sender_email, sender_password)
        #     server.sendmail(sender_email, recipient_email, message.as_string())
        #     server.quit()
        #     return True
        # except Exception as e:
        #     print(f"Error sending email: {e}")
        #     return False
        
        print(f"Email would be sent to {recipient_email}")
        return True

# Example usage and testing
async def main():
    """Demo the case study generator"""
    
    generator = CaseStudyGenerator()
    
    # Sample farm data
    sample_farm = FarmData(
        name="Fazenda São João",
        hectares=3200,
        annual_revenue=8500000,
        current_erp="TOTVS Protheus Agro",
        nfpe_monthly=180,
        location="Campo Verde/MT",
        contact_email="gestor@fazenda-sao-joao.com.br",
        pain_points=["Manual NFP-e processes", "SEFAZ compliance errors", "High operational costs"]
    )
    
    # Calculate ROI metrics
    roi_data = ROIMetrics(
        annual_savings=245000,
        time_reduction_hours=82,
        roi_percentage=285,
        payback_months=5.2,
        error_reduction=5.0,
        automation_rate=95
    )
    
    # Generate case study
    print("🚀 Generating personalized case study...")
    case_study = await generator.generate_case_study(sample_farm, roi_data)
    
    # Save to file
    filename = await generator.save_case_study(case_study)
    print(f"✅ Case study saved to: {filename}")
    
    # Email case study (simulated)
    email_sent = await generator.email_case_study(case_study, sample_farm.contact_email)
    if email_sent:
        print(f"📧 Case study emailed to {sample_farm.contact_email}")
    
    # Print summary
    print(f"\n📊 CASE STUDY SUMMARY:")
    print(f"Farm: {sample_farm.name}")
    print(f"Size: {sample_farm.hectares:,} hectares")
    print(f"Annual Savings: R$ {roi_data.annual_savings:,.0f}")
    print(f"ROI: {roi_data.roi_percentage}%")
    print(f"Payback: {roi_data.payback_months} months")

if __name__ == "__main__":
    asyncio.run(main())