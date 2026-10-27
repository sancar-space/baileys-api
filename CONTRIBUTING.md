# Contribuindo para o Baileys API Sancar

Este é o repositório do Baileys API, mantido pela [Sancar](https://sancar.space).

## Fluxo de trabalho

1. **Abra uma issue** descrevendo o que você quer mudar ou corrigir
2. **Crie um branch** a partir de `main`: `git checkout -b feat/minha-mudanca`
3. **Faça suas alterações** seguindo as convenções do projeto
4. **Abra um Pull Request** para `main` com uma descrição clara

## Convenções

- Mensagens de commit seguindo Conventional Commits: `feat(scope): descrição`
- TypeScript/Bun: rode `bun check` antes de abrir o PR
- Nenhuma credencial ou valor sensível no código ou nos testes

## Ecossistema relacionado

Este repositório é parte do stack Sancar:

- **[sancar-space/chatwoot](https://github.com/sancar-space/chatwoot)** — plataforma de atendimento
- **[sancar-space/n8n-automatizando-chatwoot](https://github.com/sancar-space/n8n-automatizando-chatwoot)** — automações n8n

Ao modificar contratos de API (endpoints, headers, payloads), verifique o impacto nos demais repositórios.
