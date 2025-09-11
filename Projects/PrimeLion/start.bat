@echo off
REM Iniciar wrapper
start /B python claude-code-openai-wrapper\wrapper.py

REM Iniciar Neo4j
docker-compose up -d

REM Iniciar Graphiti
start /B python graphiti\server.py

echo Sistema iniciado! Use 'claude-code' no terminal