# Baileys API — Sancar

> Serviço HTTP para WhatsApp via protocolo Web, mantido pela [Sancar](https://sancar.space).

Este repositório contém o **Baileys API**: um microserviço que expõe uma API REST para enviar e receber mensagens WhatsApp, usando a biblioteca [Baileys](https://github.com/WhiskeySockets/Baileys) (protocolo WhatsApp Web). É um componente interno do stack de atendimento Sancar, projetado para rodar junto ao Chatwoot.

---

## Posição no ecossistema Sancar

```
[WhatsApp]  ←→  [Baileys API]  ←→  [Chatwoot]  ←→  [n8n + IA]
```

| Repositório | Função |
|---|---|
| **[sancar-space/baileys-api](https://github.com/sancar-space/baileys-api)** | Este repo — gateway WhatsApp |
| [sancar-space/chatwoot](https://github.com/sancar-space/chatwoot) | Plataforma de atendimento (fork com integração Baileys) |
| [sancar-space/n8n-automatizando-chatwoot](https://github.com/sancar-space/n8n-automatizando-chatwoot) | Workflows de automação e agente de IA |

---

## O que é o Baileys API

O Baileys API é um servidor HTTP que:

- Mantém uma conexão ativa com o WhatsApp via protocolo Web (sem API oficial Meta)
- Expõe endpoints REST para enviar mensagens, mídia, áudio e documentos
- Recebe mensagens do WhatsApp e as encaminha ao Chatwoot via webhook
- Persiste o estado de sessão no Redis (reconecta automaticamente após restart)
- Autentica requisições via API Key no header

---

## Requisitos

- **Docker** e **Docker Compose** (recomendado)
- **Redis** (para persistência de sessão)
- Ou: **Bun** v1.x para execução local

---

## Início rápido (Docker)

### 1. Clone o repositório

```bash
git clone https://github.com/sancar-space/baileys-api
cd baileys-api
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# edite .env com suas configurações
```

### 3. Suba o serviço

```bash
docker compose up -d
```

O serviço estará disponível em `http://localhost:3025`.

---

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do servidor HTTP | `3025` |
| `API_KEY` | Chave de autenticação (obrigatório) | — |
| `REDIS_URL` | URL de conexão com o Redis | `redis://localhost:6379` |
| `WEBHOOK_URL` | URL para encaminhar mensagens recebidas (ex: Chatwoot) | — |
| `LOG_LEVEL` | Nível de log (`debug`, `info`, `warn`, `error`) | `info` |
| `SESSION_NAME` | Nome da sessão WhatsApp | `default` |

---

## Endpoints da API

Todas as requisições exigem o header:
```
Authorization: Bearer <API_KEY>
```

### Sessão

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/session/status` | Status da conexão WhatsApp |
| `GET` | `/session/qr` | QR code para autenticação (PNG) |
| `DELETE` | `/session` | Desconectar e limpar sessão |

### Mensagens

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/messages/text` | Enviar mensagem de texto |
| `POST` | `/messages/media` | Enviar imagem, vídeo ou documento |
| `POST` | `/messages/audio` | Enviar áudio (OGG/MP3) |
| `POST` | `/messages/template` | Enviar mensagem de template |

### Exemplos

**Enviar mensagem de texto:**
```bash
curl -X POST http://localhost:3025/messages/text \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "text": "Olá! Como posso ajudar?"}'
```

**Verificar status da conexão:**
```bash
curl http://localhost:3025/session/status \
  -H "Authorization: Bearer SUA_API_KEY"
```

---

## Integração com o Chatwoot

O Chatwoot do fork [sancar-space/chatwoot](https://github.com/sancar-space/chatwoot) se comunica com esta API via variáveis de ambiente:

```env
BAILEYS_PROVIDER_DEFAULT_URL=http://baileys-api:3025
BAILEYS_PROVIDER_DEFAULT_API_KEY=<sua API key>
BAILEYS_PROVIDER_DEFAULT_CLIENT_NAME=<nome da instância>
BAILEYS_PROVIDER_USE_INTERNAL_HOST_URL=true
INTERNAL_HOST_URL=http://rails:3000
```

Quando configurado, o Chatwoot usa esta API para:
1. Enviar mensagens de saída ao WhatsApp
2. Receber mensagens de entrada via webhook
3. Exibir o QR code no painel do Chatwoot para autenticação

---

## Deploy no stack completo

O `docker-compose.yml` deste repositório sobe apenas o Baileys API + Redis para testes isolados.

Para o stack completo de produção (Chatwoot + Baileys API + n8n + PostgreSQL + Redis), use o compose em [`sancar-space/chatwoot`](https://github.com/sancar-space/chatwoot) — pasta `deploy/`.

---

## Desenvolvimento local

```bash
# Instalar dependências (requer Bun)
bun install

# Copiar e editar variáveis
cp .env.example .env

# Subir Redis localmente (ou usar Docker)
docker run -d -p 6379:6379 redis:alpine

# Iniciar em modo dev
bun dev
```

---

## Sobre o protocolo WhatsApp Web

Este serviço usa o protocolo WhatsApp Web (não-oficial). Pontos de atenção:

- **Não é a API Oficial Meta (Cloud API)** — para uso empresarial de alto volume, considere a API Oficial
- Requer um número de WhatsApp ativo e autenticação via QR code
- A sessão persiste no Redis; após autenticação, reconecta automaticamente
- Respeite os Termos de Serviço do WhatsApp ao usar este serviço

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de contribuição.

---

## Sobre a Sancar

[Sancar](https://sancar.space) é uma consultoria especializada em CRM e automação de atendimento. Ajudamos empresas a implementar soluções de atendimento com IA, integrações e processos que escalam.

---

## Licença

MIT — veja [LICENSE](LICENSE).
