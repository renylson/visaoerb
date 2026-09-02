# Contribuindo

Projeto pessoal de portfólio, mas aberto a sugestões via issue/PR.

## Rodando os testes

```bash
docker compose -f docker-compose.test.yml up -d   # Postgres de teste
npm test                                           # backend
cd frontend && npm test                            # frontend
```

## Lint

```bash
npm run lint             # backend
cd frontend && npm run lint
```

O lint do frontend ainda tem ~11 achados pré-existentes (regras
`react-hooks/set-state-in-effect` e `react-hooks/static-components`) que não
foram corrigidos por exigirem restruturar o fluxo de efeitos de alguns
componentes — o CI roda o lint do frontend em modo não-bloqueante por isso.

## Estilo de commit

Commits atômicos, prefixados por tipo (`feat`, `fix`, `refactor`, `test`,
`docs`, `chore`, `ci`), seguindo o histórico do repositório.
