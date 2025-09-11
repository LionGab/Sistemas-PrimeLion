#!/usr/bin/env python3
"""
Script de Teste - Claude Code Setup para ERPs Agronegócio
Valida configuração e funcionalidades básicas
Versão: 1.0.0
"""

import os
import sys
import json
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, List, Any
import tempfile

class ClaudeCodeAgroTester:
    """Tester para setup Claude Code Agro"""
    
    def __init__(self):
        self.base_path = Path.home() / '.claude' / 'agro-erp'
        self.results = []
        
    def log_result(self, test_name: str, success: bool, message: str = "", details: Any = None):
        """Registra resultado de teste"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        if details and not success:
            print(f"   Detalhes: {details}")
    
    def test_directory_structure(self) -> bool:
        """Testa estrutura de diretórios"""
        required_dirs = [
            'settings', 'agents', 'hooks', 'mcps', 
            'schemas', 'scripts', 'templates', 'docs'
        ]
        
        missing_dirs = []
        for dir_name in required_dirs:
            dir_path = self.base_path / dir_name
            if not dir_path.exists():
                missing_dirs.append(str(dir_path))
        
        success = len(missing_dirs) == 0
        message = "Estrutura completa" if success else f"Diretórios ausentes: {len(missing_dirs)}"
        
        self.log_result("Estrutura de Diretórios", success, message, missing_dirs)
        return success
    
    def test_settings_files(self) -> bool:
        """Testa arquivos de configuração"""
        settings_file = self.base_path / 'settings' / 'base.json'
        
        if not settings_file.exists():
            self.log_result("Arquivos Settings", False, "base.json não encontrado")
            return False
        
        try:
            with open(settings_file, 'r') as f:
                settings = json.load(f)
            
            # Validar estrutura básica
            required_keys = ['permissions', 'hooks', 'mcps']
            missing_keys = [key for key in required_keys if key not in settings]
            
            if missing_keys:
                self.log_result("Arquivos Settings", False, f"Chaves ausentes: {missing_keys}")
                return False
            
            # Validar hooks
            hooks = settings.get('hooks', {})
            expected_hooks = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'SessionStart']
            configured_hooks = list(hooks.keys())
            
            success = all(hook in configured_hooks for hook in expected_hooks)
            message = f"Hooks configurados: {len(configured_hooks)}/{len(expected_hooks)}"
            
            self.log_result("Arquivos Settings", success, message, {
                'configured': configured_hooks,
                'expected': expected_hooks
            })
            return success
            
        except json.JSONDecodeError as e:
            self.log_result("Arquivos Settings", False, f"JSON inválido: {str(e)}")
            return False
        except Exception as e:
            self.log_result("Arquivos Settings", False, f"Erro leitura: {str(e)}")
            return False
    
    def test_subagents(self) -> bool:
        """Testa subagentes especializados"""
        agents_dir = self.base_path / 'agents'
        
        if not agents_dir.exists():
            self.log_result("Subagentes", False, "Diretório agents não existe")
            return False
        
        # Verificar subagentes esperados
        expected_agents = [
            'agro-fiscal-compliance.yaml',
            'agro-api-integrator.yaml', 
            'agro-legacy-modernizer.yaml'
        ]
        
        existing_agents = []
        for agent_file in expected_agents:
            agent_path = agents_dir / agent_file
            if agent_path.exists():
                existing_agents.append(agent_file)
        
        success = len(existing_agents) == len(expected_agents)
        message = f"Subagentes encontrados: {len(existing_agents)}/{len(expected_agents)}"
        
        self.log_result("Subagentes", success, message, {
            'existing': existing_agents,
            'expected': expected_agents
        })
        return success
    
    def test_validation_scripts(self) -> bool:
        """Testa scripts de validação"""
        scripts_dir = self.base_path / 'scripts'
        
        expected_scripts = [
            'validate-fiscal-data.py',
            'audit-database-changes.py'
        ]
        
        results = {}
        for script_name in expected_scripts:
            script_path = scripts_dir / script_name
            
            if not script_path.exists():
                results[script_name] = {'exists': False, 'executable': False}
                continue
            
            # Verificar se é executável
            is_executable = os.access(script_path, os.X_OK)
            results[script_name] = {'exists': True, 'executable': is_executable}
        
        # Testar execução básica
        test_data = {
            'nfe': {
                'cnpj_emitente': '14200166000187',
                'cnpj_destinatario': '11222333000144',
                'valor_total': 1000.00,
                'cfop': '5101',
                'natureza_operacao': 'Venda de produtos rurais',
                'items': [
                    {
                        'ncm': '12019000',
                        'valor_unitario': 50.00,
                        'quantidade': 20
                    }
                ]
            }
        }
        
        # Testar script validação fiscal
        fiscal_script = scripts_dir / 'validate-fiscal-data.py'
        if fiscal_script.exists():
            try:
                process = subprocess.run(
                    [sys.executable, str(fiscal_script)],
                    input=json.dumps(test_data),
                    text=True,
                    capture_output=True,
                    timeout=10
                )
                
                if process.returncode == 0:
                    validation_result = json.loads(process.stdout)
                    results['validate-fiscal-data.py']['test_result'] = validation_result
                else:
                    results['validate-fiscal-data.py']['test_error'] = process.stderr
                    
            except Exception as e:
                results['validate-fiscal-data.py']['test_error'] = str(e)
        
        success = all(
            result['exists'] and result['executable'] 
            for result in results.values()
        )
        
        message = f"Scripts válidos: {sum(1 for r in results.values() if r.get('exists') and r.get('executable'))}/{len(expected_scripts)}"
        
        self.log_result("Scripts de Validação", success, message, results)
        return success
    
    def test_mcp_schemas(self) -> bool:
        """Testa schemas MCP"""
        schemas_dir = self.base_path / 'schemas'
        
        expected_schemas = [
            'sefaz-mt-mcp.json',
            'banking-br-mcp.json'
        ]
        
        results = {}
        for schema_name in expected_schemas:
            schema_path = schemas_dir / schema_name
            
            if not schema_path.exists():
                results[schema_name] = {'exists': False, 'valid': False}
                continue
            
            try:
                with open(schema_path, 'r') as f:
                    schema = json.load(f)
                
                # Validar estrutura básica MCP
                required_fields = ['name', 'version', 'description', 'tools']
                has_required = all(field in schema for field in required_fields)
                
                # Validar tools
                tools = schema.get('tools', [])
                valid_tools = all(
                    'name' in tool and 'description' in tool and 'inputSchema' in tool
                    for tool in tools
                )
                
                results[schema_name] = {
                    'exists': True,
                    'valid': has_required and valid_tools,
                    'tools_count': len(tools)
                }
                
            except json.JSONDecodeError:
                results[schema_name] = {'exists': True, 'valid': False, 'error': 'JSON inválido'}
            except Exception as e:
                results[schema_name] = {'exists': True, 'valid': False, 'error': str(e)}
        
        success = all(
            result.get('exists') and result.get('valid')
            for result in results.values()
        )
        
        valid_count = sum(1 for r in results.values() if r.get('valid'))
        message = f"Schemas válidos: {valid_count}/{len(expected_schemas)}"
        
        self.log_result("Schemas MCP", success, message, results)
        return success
    
    def test_templates(self) -> bool:
        """Testa templates de projeto"""
        templates_dir = self.base_path / 'templates'
        
        expected_templates = [
            'modulo-erp-basico.md',
            'integracao-api.md'
        ]
        
        results = {}
        for template_name in expected_templates:
            template_path = templates_dir / template_name
            
            if not template_path.exists():
                results[template_name] = {'exists': False}
                continue
            
            # Verificar conteúdo básico
            try:
                with open(template_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar se contém seções esperadas
                expected_sections = ['# Template:', '## Prompt Inicial', '## Estrutura', '## Checklist']
                has_sections = all(section in content for section in expected_sections)
                
                results[template_name] = {
                    'exists': True,
                    'valid': has_sections,
                    'size': len(content)
                }
                
            except Exception as e:
                results[template_name] = {'exists': True, 'valid': False, 'error': str(e)}
        
        success = all(
            result.get('exists') and result.get('valid', True)
            for result in results.values()
        )
        
        message = f"Templates válidos: {len([r for r in results.values() if r.get('valid')])}/{len(expected_templates)}"
        
        self.log_result("Templates", success, message, results)
        return success
    
    def test_claude_code_integration(self) -> bool:
        """Testa integração com Claude Code"""
        try:
            # Verificar se Claude Code está instalado
            result = subprocess.run(['claude', '--version'], capture_output=True, text=True)
            
            if result.returncode != 0:
                self.log_result("Claude Code Integration", False, "Claude Code não instalado")
                return False
            
            version = result.stdout.strip()
            
            # Testar comando básico
            test_result = subprocess.run(
                ['claude', '--help'], 
                capture_output=True, 
                text=True,
                timeout=10
            )
            
            success = test_result.returncode == 0
            message = f"Claude Code {version}" if success else "Erro execução"
            
            self.log_result("Claude Code Integration", success, message, {
                'version': version,
                'help_available': success
            })
            return success
            
        except subprocess.TimeoutExpired:
            self.log_result("Claude Code Integration", False, "Timeout comando")
            return False
        except FileNotFoundError:
            self.log_result("Claude Code Integration", False, "Claude Code não encontrado no PATH")
            return False
        except Exception as e:
            self.log_result("Claude Code Integration", False, f"Erro: {str(e)}")
            return False
    
    def generate_report(self) -> Dict[str, Any]:
        """Gera relatório final dos testes"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        
        report = {
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': total_tests - passed_tests,
                'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
            },
            'results': self.results,
            'recommendations': []
        }
        
        # Gerar recomendações baseadas nos resultados
        if passed_tests < total_tests:
            report['recommendations'].append("Execute novamente o script setup-claude-code-agro.sh")
        
        if report['summary']['success_rate'] < 80:
            report['recommendations'].append("Verifique instalação do Claude Code")
            report['recommendations'].append("Confirme permissões de escrita em ~/.claude/")
        
        if report['summary']['success_rate'] >= 90:
            report['recommendations'].append("Setup concluído com sucesso!")
            report['recommendations'].append("Próximo passo: testar subagentes com claude --agent agro-fiscal-compliance")
        
        return report
    
    def run_all_tests(self) -> bool:
        """Executa todos os testes"""
        print("🧪 Iniciando testes do setup Claude Code Agro...")
        print("=" * 60)
        
        # Lista de testes
        tests = [
            self.test_directory_structure,
            self.test_settings_files,
            self.test_subagents,
            self.test_validation_scripts,
            self.test_mcp_schemas,
            self.test_templates,
            self.test_claude_code_integration
        ]
        
        # Executar testes
        for test_func in tests:
            try:
                test_func()
            except Exception as e:
                test_name = test_func.__name__.replace('test_', '').replace('_', ' ').title()
                self.log_result(test_name, False, f"Erro execução: {str(e)}")
        
        print("\n" + "=" * 60)
        
        # Gerar relatório
        report = self.generate_report()
        
        print(f"📊 RELATÓRIO FINAL")
        print(f"Total de testes: {report['summary']['total_tests']}")
        print(f"Sucessos: {report['summary']['passed']}")
        print(f"Falhas: {report['summary']['failed']}")
        print(f"Taxa de sucesso: {report['summary']['success_rate']:.1f}%")
        
        if report['recommendations']:
            print(f"\n💡 RECOMENDAÇÕES:")
            for rec in report['recommendations']:
                print(f"   • {rec}")
        
        # Salvar relatório detalhado
        report_path = self.base_path / 'test-report.json'
        try:
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Relatório detalhado salvo em: {report_path}")
        except Exception as e:
            print(f"\n⚠️  Erro salvando relatório: {str(e)}")
        
        return report['summary']['success_rate'] >= 80

def main():
    """Função principal"""
    print("🌾 Claude Code Agro - Test Suite")
    print("Validando configuração para ERPs Agronegócio")
    print()
    
    tester = ClaudeCodeAgroTester()
    success = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Setup validado com sucesso!")
        print("Ambiente pronto para desenvolvimento de ERPs agronegócio.")
    else:
        print("❌ Setup incompleto ou com problemas.")
        print("Verifique os erros acima e execute correções necessárias.")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

