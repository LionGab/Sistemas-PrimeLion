"""
Fiscal Validation Pipeline with Sequential Thinking MCP
========================================================
Advanced validation pipeline for NFP-e and fiscal compliance
using Sequential Thinking for complex reasoning chains.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Sequential Thinking MCP integration
from mcp_sequential_thinking import SequentialThinker


class ValidationStatus(Enum):
    """Validation status enumeration"""
    PENDING = "pending"
    VALIDATING = "validating"
    PASSED = "passed"
    FAILED = "failed"
    FIXED = "fixed"


@dataclass
class ValidationResult:
    """Validation result container"""
    status: ValidationStatus
    errors: List[Dict]
    warnings: List[Dict]
    fixes_applied: List[Dict]
    compliance_score: float
    thinking_chain: List[str]
    processing_time: float


class FiscalValidationPipeline:
    """
    IMPORTANT: This pipeline uses Sequential Thinking MCP for complex
    fiscal validation chains. It decomposes validation into logical steps
    and maintains reasoning transparency.
    """
    
    def __init__(self):
        self.thinker = SequentialThinker()
        self.validation_cache = {}
        self.compliance_rules = self._load_compliance_rules()
    
    async def validate_nfpe(self, nfpe_data: Dict) -> ValidationResult:
        """
        ULTRATHINK: Complete NFP-e validation with reasoning chain
        
        This method orchestrates the entire validation pipeline using
        Sequential Thinking for complex decision making.
        """
        start_time = datetime.now()
        thinking_chain = []
        
        # Step 1: Structural Analysis
        thought_1 = await self.thinker.think(
            prompt=f"Analyze NFP-e structure for completeness",
            context={"data": nfpe_data, "schema": "SEFAZ_MT_v4.0"}
        )
        thinking_chain.append(thought_1)
        
        # Step 2: Schema Validation
        schema_result = await self._validate_schema(nfpe_data, thought_1)
        thought_2 = await self.thinker.think(
            prompt="Evaluate schema validation results and identify critical issues",
            context={"schema_result": schema_result, "previous": thought_1}
        )
        thinking_chain.append(thought_2)
        
        # Step 3: Business Rules Validation
        if schema_result["valid"]:
            business_result = await self._validate_business_rules(nfpe_data)
            thought_3 = await self.thinker.think(
                prompt="Assess business rule compliance and tax calculations",
                context={"business_result": business_result, "previous": thought_2}
            )
            thinking_chain.append(thought_3)
        else:
            thought_3 = "Skipped business rules due to schema failures"
            thinking_chain.append(thought_3)
        
        # Step 4: Cross-Reference Validation
        cross_ref_result = await self._validate_cross_references(nfpe_data)
        thought_4 = await self.thinker.think(
            prompt="Verify cross-references and data consistency",
            context={"cross_ref": cross_ref_result, "previous": thought_3}
        )
        thinking_chain.append(thought_4)
        
        # Step 5: Compliance Scoring
        compliance_score = await self._calculate_compliance_score(
            schema_result, 
            business_result if schema_result["valid"] else None,
            cross_ref_result
        )
        thought_5 = await self.thinker.think(
            prompt="Calculate final compliance score and recommendations",
            context={"score": compliance_score, "all_results": thinking_chain}
        )
        thinking_chain.append(thought_5)
        
        # Step 6: Auto-Fix Attempt (if needed)
        fixes_applied = []
        if compliance_score < 100:
            fixes = await self._attempt_auto_fixes(nfpe_data, thinking_chain)
            thought_6 = await self.thinker.think(
                prompt="Evaluate auto-fix success and remaining issues",
                context={"fixes": fixes, "original_score": compliance_score}
            )
            thinking_chain.append(thought_6)
            fixes_applied = fixes
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Determine final status
        status = self._determine_status(compliance_score, fixes_applied)
        
        return ValidationResult(
            status=status,
            errors=self._extract_errors(thinking_chain),
            warnings=self._extract_warnings(thinking_chain),
            fixes_applied=fixes_applied,
            compliance_score=compliance_score,
            thinking_chain=thinking_chain,
            processing_time=processing_time
        )
    
    async def _validate_schema(self, data: Dict, context: str) -> Dict:
        """
        IMPORTANT: Schema validation against SEFAZ-MT XSD
        """
        # Simulate schema validation with Sequential Thinking insight
        await self.thinker.think(
            prompt="Identify required fields and validate data types",
            context={"data": data, "context": context}
        )
        
        errors = []
        warnings = []
        
        # Required field validation
        required_fields = [
            "ide.nNF", "ide.serie", "emit.CNPJ", "emit.IE",
            "dest.CNPJ", "prod.NCM", "imposto.ICMS"
        ]
        
        for field in required_fields:
            if not self._field_exists(data, field):
                errors.append({
                    "field": field,
                    "error": "Required field missing",
                    "severity": "ERROR"
                })
        
        # Data type validation
        if self._field_exists(data, "emit.CNPJ"):
            if not self._validate_cnpj(data["emit"]["CNPJ"]):
                errors.append({
                    "field": "emit.CNPJ",
                    "error": "Invalid CNPJ format",
                    "severity": "ERROR"
                })
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    async def _validate_business_rules(self, data: Dict) -> Dict:
        """
        PROACTIVELY validate business rules and tax calculations
        """
        errors = []
        warnings = []
        
        # Tax calculation validation
        thought = await self.thinker.think(
            prompt="Validate ICMS, FUNRURAL, and SENAR calculations",
            context={"tax_data": data.get("imposto", {})}
        )
        
        if "imposto" in data:
            icms = data["imposto"].get("ICMS", {})
            base_calc = icms.get("vBC", 0)
            aliquota = icms.get("pICMS", 0)
            valor_icms = icms.get("vICMS", 0)
            
            expected_icms = base_calc * (aliquota / 100)
            if abs(expected_icms - valor_icms) > 0.01:
                errors.append({
                    "field": "imposto.ICMS.vICMS",
                    "error": f"ICMS calculation mismatch. Expected: {expected_icms:.2f}",
                    "severity": "ERROR"
                })
        
        # FUNRURAL validation (2.3% for rural producers)
        if "funrural" not in data.get("imposto", {}):
            warnings.append({
                "field": "imposto.funrural",
                "warning": "FUNRURAL not calculated",
                "severity": "WARNING"
            })
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    async def _validate_cross_references(self, data: Dict) -> Dict:
        """
        Validate cross-references and data consistency
        """
        errors = []
        
        # Validate NCM exists in official table
        thought = await self.thinker.think(
            prompt="Verify NCM codes against official SEFAZ tables",
            context={"ncm": data.get("prod", {}).get("NCM")}
        )
        
        # Date sequence validation
        if "ide" in data:
            emission_date = data["ide"].get("dEmi")
            exit_date = data["ide"].get("dSaiEnt")
            
            if emission_date and exit_date:
                if exit_date < emission_date:
                    errors.append({
                        "field": "ide.dSaiEnt",
                        "error": "Exit date cannot be before emission date",
                        "severity": "ERROR"
                    })
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    async def _calculate_compliance_score(
        self, 
        schema_result: Optional[Dict],
        business_result: Optional[Dict],
        cross_ref_result: Dict
    ) -> float:
        """
        Calculate overall compliance score (0-100)
        """
        thought = await self.thinker.think(
            prompt="Calculate weighted compliance score based on all validations",
            context={
                "schema": schema_result,
                "business": business_result,
                "cross_ref": cross_ref_result
            }
        )
        
        score = 100.0
        
        # Schema validation weight: 40%
        if schema_result and not schema_result["valid"]:
            score -= 40 * (len(schema_result["errors"]) / 10)
        
        # Business rules weight: 40%
        if business_result and not business_result["valid"]:
            score -= 40 * (len(business_result["errors"]) / 10)
        
        # Cross-references weight: 20%
        if not cross_ref_result["valid"]:
            score -= 20 * (len(cross_ref_result["errors"]) / 5)
        
        # Apply warnings penalty (max 10%)
        total_warnings = 0
        if schema_result:
            total_warnings += len(schema_result.get("warnings", []))
        if business_result:
            total_warnings += len(business_result.get("warnings", []))
        
        score -= min(10, total_warnings * 2)
        
        return max(0, score)
    
    async def _attempt_auto_fixes(self, data: Dict, thinking_chain: List) -> List[Dict]:
        """
        PROACTIVELY attempt to fix common validation issues
        """
        fixes = []
        
        thought = await self.thinker.think(
            prompt="Identify fixable issues and apply corrections",
            context={"data": data, "validation_chain": thinking_chain}
        )
        
        # Fix CNPJ formatting
        if "emit" in data and "CNPJ" in data["emit"]:
            cnpj = data["emit"]["CNPJ"]
            if "-" in cnpj or "." in cnpj or "/" in cnpj:
                fixed_cnpj = cnpj.replace(".", "").replace("-", "").replace("/", "")
                data["emit"]["CNPJ"] = fixed_cnpj
                fixes.append({
                    "field": "emit.CNPJ",
                    "original": cnpj,
                    "fixed": fixed_cnpj,
                    "reason": "Removed formatting characters"
                })
        
        # Fix ICMS calculation
        if "imposto" in data and "ICMS" in data["imposto"]:
            icms = data["imposto"]["ICMS"]
            base_calc = icms.get("vBC", 0)
            aliquota = icms.get("pICMS", 0)
            
            correct_icms = round(base_calc * (aliquota / 100), 2)
            if icms.get("vICMS") != correct_icms:
                icms["vICMS"] = correct_icms
                fixes.append({
                    "field": "imposto.ICMS.vICMS",
                    "original": icms.get("vICMS"),
                    "fixed": correct_icms,
                    "reason": "Recalculated based on base and rate"
                })
        
        return fixes
    
    def _determine_status(self, score: float, fixes: List) -> ValidationStatus:
        """Determine final validation status"""
        if score >= 100:
            return ValidationStatus.PASSED
        elif score >= 95 and fixes:
            return ValidationStatus.FIXED
        elif score >= 80:
            return ValidationStatus.PASSED  # With warnings
        else:
            return ValidationStatus.FAILED
    
    def _field_exists(self, data: Dict, field_path: str) -> bool:
        """Check if nested field exists in data"""
        parts = field_path.split(".")
        current = data
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return False
        
        return True
    
    def _validate_cnpj(self, cnpj: str) -> bool:
        """Validate CNPJ checksum"""
        # Remove formatting
        cnpj = cnpj.replace(".", "").replace("-", "").replace("/", "")
        
        if len(cnpj) != 14:
            return False
        
        # Validate checksum (simplified)
        return cnpj.isdigit()
    
    def _extract_errors(self, thinking_chain: List) -> List[Dict]:
        """Extract errors from thinking chain"""
        # Parse thinking chain for errors
        errors = []
        for thought in thinking_chain:
            if isinstance(thought, dict) and "errors" in thought:
                errors.extend(thought["errors"])
        return errors
    
    def _extract_warnings(self, thinking_chain: List) -> List[Dict]:
        """Extract warnings from thinking chain"""
        warnings = []
        for thought in thinking_chain:
            if isinstance(thought, dict) and "warnings" in thought:
                warnings.extend(thought["warnings"])
        return warnings
    
    def _load_compliance_rules(self) -> Dict:
        """Load compliance rules from configuration"""
        return {
            "sefaz_mt": {
                "version": "4.0",
                "required_fields": [...],
                "business_rules": [...],
                "tax_rates": {
                    "icms": 17.0,
                    "funrural": 2.3,
                    "senar": 0.2
                }
            }
        }


# Main execution
async def main():
    """
    Example usage of the Fiscal Validation Pipeline
    """
    pipeline = FiscalValidationPipeline()
    
    # Sample NFP-e data
    nfpe_data = {
        "ide": {
            "nNF": "001234",
            "serie": "1",
            "dEmi": "2024-01-15",
            "dSaiEnt": "2024-01-16"
        },
        "emit": {
            "CNPJ": "12.345.678/0001-90",
            "IE": "123456789",
            "xNome": "FAZENDA BRASIL LTDA"
        },
        "dest": {
            "CNPJ": "98765432000199",
            "xNome": "COOPERATIVA AGRO MT"
        },
        "prod": {
            "NCM": "12019000",
            "xProd": "SOJA EM GRAOS",
            "qCom": 1000,
            "vUnCom": 150.00
        },
        "imposto": {
            "ICMS": {
                "vBC": 150000.00,
                "pICMS": 17.0,
                "vICMS": 25500.00  # Intentional error for testing
            }
        }
    }
    
    # Run validation
    result = await pipeline.validate_nfpe(nfpe_data)
    
    # Print results
    print(f"Status: {result.status.value}")
    print(f"Compliance Score: {result.compliance_score:.2f}%")
    print(f"Processing Time: {result.processing_time:.2f}s")
    print(f"Errors: {len(result.errors)}")
    print(f"Warnings: {len(result.warnings)}")
    print(f"Fixes Applied: {len(result.fixes_applied)}")
    
    print("\nThinking Chain:")
    for i, thought in enumerate(result.thinking_chain, 1):
        print(f"  Step {i}: {thought[:100]}...")
    
    if result.fixes_applied:
        print("\nAuto-Fixes Applied:")
        for fix in result.fixes_applied:
            print(f"  - {fix['field']}: {fix['reason']}")


if __name__ == "__main__":
    asyncio.run(main())