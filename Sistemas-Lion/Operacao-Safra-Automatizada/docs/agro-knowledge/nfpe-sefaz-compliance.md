---
title: NFP-e SEFAZ-MT Compliance 
created: 2025-09-02
updated: 2025-09-02
tags: [nfpe, sefaz, compliance, fiscal, automation]
type: compliance-guide
status: active
---

# NFP-e SEFAZ-MT Compliance

## Overview
Nota Fiscal do Produtor Eletrônica (NFP-e) is the electronic invoice system for agricultural producers in Mato Grosso, managed by SEFAZ-MT (State Treasury Department).

## Schema Requirements
- **Version**: MT v4.00 (current standard)
- **Format**: XML with digital signature
- **Size Limit**: 500KB per NFP-e
- **Encoding**: UTF-8

## Mandatory Fields
### Producer Information
- CPF/CNPJ and state registration
- Complete address with CEP
- Economic activity code (CNAE)

### Product Details  
- NCM classification code
- Product description and unit
- Quantity, unit value, and total value
- Tax information (ICMS, PIS, COFINS)

### Operational Data
- Issue date and time
- Operation nature (sale, transfer, etc.)
- Destination state and buyer information

## Validation Process
1. **Schema Validation**: XML structure compliance
2. **Business Rules**: SEFAZ-MT specific validations
3. **Tax Calculations**: Automatic tax computation verification
4. **Digital Signature**: Certificate-based signing

## Transmission Protocol
- **Method**: SOAP Web Services
- **Endpoint**: https://nfpemt.sefaz.mt.gov.br/nfpews/
- **Timeout**: 30 seconds per operation
- **Retry Logic**: 3 attempts with 5s interval

## Response Handling
- **Success**: NFP-e number and authorization key
- **Rejection**: Error code and description
- **Processing**: Queue status and estimated time

## Integration with TOTVS
- **Trigger**: Stock movement events
- **Data Source**: ERP transaction data
- **Validation**: Pre-generation data checks
- **Storage**: 7-year retention requirement

## Relationships
- **validates**: Farm Tax Data
- **transmits_to**: SEFAZ-MT Portal  
- **requires**: TOTVS Integration
- **generates**: Tax Compliance Reports

## Error Handling
- **Code 539**: Invalid product classification
- **Code 542**: Missing buyer information
- **Code 785**: Tax calculation errors
- **Code 890**: Certificate validation issues

## Performance Targets
- **Generation Time**: <30 seconds per NFP-e
- **Success Rate**: >99.5% transmission
- **Response Time**: <5 seconds validation
- **Availability**: 24/7 except maintenance windows

## Fazenda Brasil Implementation
- **Volume**: 50+ NFP-e per day average
- **Peak**: 200+ during harvest season
- **Automation**: 100% automatic generation
- **Error Rate**: <0.1% manual intervention required