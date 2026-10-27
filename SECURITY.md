# Política de Segurança

A Sancar valoriza o trabalho de pesquisadores de segurança que ajudam a manter este projeto seguro.

## Reportando uma Vulnerabilidade

Divulgue responsavelmente via:

**[GitHub Security Advisories](https://github.com/sancar-space/baileys-api/security/advisories/new)**

Para dúvidas sobre o processo: **contato@sancar.space**

> Não abra issues públicas antes de entrar em contato conosco.

## Atenção: API Key

A API Key é o único mecanismo de autenticação deste serviço. Garanta que:

- A API Key seja gerada com alta entropia: `openssl rand -hex 32`
- O serviço **nunca** seja exposto publicamente sem autenticação
- A chave seja rotacionada se houver suspeita de comprometimento
- O Redis não seja exposto externamente (use rede interna Docker)

## Versões Suportadas

| Versão | Suportada |
|--------|----------|
| latest | ✅ |
| anteriores | ❌ |

## Licença

MIT — veja [LICENSE](LICENSE).
