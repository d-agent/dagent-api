<p align="center">
<img width="210" height="210" alt="De_Agent_logo(2)" src="https://github.com/user-attachments/assets/8a3599fe-79e0-4dc6-930a-db3e7b859804" />

  <h1 align="center">DAgent</h1>
  <p align="center">
    <strong>Use any AI agent instantly — no selection, no setup.</strong>
  </p>
  <p align="center">
    DAgent picks, routes, and pays the best agent for you.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Cardano-Blockchain-blue?style=flat-square" alt="Cardano" />
  <img src="https://img.shields.io/badge/Bun-Runtime-black?style=flat-square" alt="Bun" />
  <img src="https://img.shields.io/badge/Hono-Framework-orange?style=flat-square" alt="Hono" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square" alt="PostgreSQL" />
</p>

---

## What is DAgent?

DAgent is a unified AI agent routing and monetization platform that makes it easy for developers to use the right AI agent without the hassle of finding, hosting, or paying them manually.

### The Problem

- AI agent ecosystems are fragmented — too many agents, no way to know which one is best
- Developers waste time choosing, comparing, integrating, and maintaining agents
- Agent creators struggle to reach users and monetize consistently
- No unified on-chain mechanism for usage tracking, payment, and reliability

### How DAgent Solves It

When a developer sends a request, DAgent automatically finds the best agent that matches their needs — things like cost, skills, or provider. That agent gets assigned, and from then on, all requests go straight through it. Usage is tracked and costs are deducted from their credit balance.

For developers, it feels like using any other API: no marketplaces to browse, no payment headaches — just call the endpoint and get results. For agent creators, it's a way to deploy agents publicly and get paid automatically whenever they're matched.

---

## Key Features

- **Automatic Agent Selection** — Semantic search + requirement-based filtering finds the best agent for your task
- **Unified API** — Single endpoint to access all registered agents
- **Credit-Based Pay-Per-Use** — Simple billing with credit balance system
- **Cardano Wallet Authentication** — Secure sign-in using MeshSDK
- **On-Chain Agent Registration** — Transparent agent registry on blockchain
- **Multi-Framework Support** — Google ADK, Crew AI, LangGraph, OpenAI, AutoGen, and more
- **Session Management** — Automatic session handling and agent persistence
- **Fallback & Reliability** — If an agent fails, the system can rematch to another

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DAgent API                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │   Agents    │  │       API Keys          │  │
│  │  (Cardano)  │  │  (Routing)  │  │     (Management)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Semantic Matching Engine                    │    │
│  │         (Cloudflare AI BGE Embeddings)                   │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL  │  │   Prisma     │  │  Smart Contracts     │   │
│  │   Database   │  │     ORM      │  │  (External Repos)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) |
| Database | PostgreSQL |
| ORM | [Prisma](https://prisma.io) |
| Blockchain Auth | Cardano ([MeshSDK](https://meshjs.dev)) |
| Embeddings | [Cloudflare AI](https://developers.cloudflare.com/workers-ai/) (BGE-base-en-v1.5) |
| Validation | [Zod](https://zod.dev) |

### Smart Contracts

Smart contracts are maintained in separate repositories:

| Chain | Language | Repository |
|-------|----------|------------|
| Cardano | Aiken | [dagent-cardano-contracts](#) |
| Ethereum | Solidity | [dagent-eth-contracts](#) |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.38
- [Node.js](https://nodejs.org) >= 22 (required by Prisma)
- PostgreSQL database
- Cloudflare account (for AI embeddings)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-org/dagent-api.git
cd dagent-api
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables)).

4. **Run database migrations**

```bash
bun run db:deploy
```

5. **Start the development server**

```bash
bun run dev
```

The API will be available at `http://localhost:3000`

### Docker Deployment

```bash
docker-compose up -d
```

This will:
- Build the application container
- Generate Prisma client
- Run database migrations
- Start the API on port 3002

---

## API Reference

### Authentication

#### Get Nonce

Request a nonce for wallet signature authentication.

```http
POST /auth/nonce
Content-Type: application/json

{
  "address": "addr1qx..."
}
```

**Response:**

```json
{
  "nonce": "Sign this message to authenticate: abc123..."
}
```

#### Verify Signature

Verify wallet signature and receive JWT token.

```http
POST /auth/verify
Content-Type: application/json

{
  "address": "addr1qx...",
  "signature": {
    "key": "...",
    "signature": "..."
  }
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Agents

> All agent routes require JWT authentication via `Authorization: Bearer <token>` header.

#### Call Agent (Primary Endpoint)

Automatically match and call the best agent for your requirements.

```http
POST /dagent
Authorization: Bearer <token>
x-api-key: <api_key>
Content-Type: application/json

{
  "requirement_json": {
    "description": "I need an agent that can help with code review",
    "preferred_llm_provider": "OpenAI",
    "max_agent_cost": 0.01,
    "max_total_agent_cost": 1.0,
    "skills": ["code-review", "typescript"],
    "streaming": false,
    "is_multi_agent_system": false
  },
  "message": "Please review this TypeScript function..."
}
```

**Response:**

```json
{
  "message": "Agent response",
  "data": "Here's my code review..."
}
```

#### Run Specific Agent

Call a specific agent by ID.

```http
POST /dagent/:id/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Your prompt here"
}
```

**Response:**

```json
{
  "message": "Agent response",
  "data": {
    "response": "Agent's response content",
    "creditBalance": 95.5
  }
}
```

#### Create Agent

Register a new agent on the platform.

```http
POST /dagent/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Code Review Agent",
  "description": "An AI agent specialized in reviewing TypeScript and JavaScript code",
  "agentCost": "0.001",
  "deployedUrl": "https://my-agent.example.com",
  "llmProvider": "OpenAI",
  "skills": ["code-review", "typescript", "javascript"],
  "is_multiAgentSystem": false,
  "default_agent_name": "code_reviewer",
  "framework_used": "google_adk",
  "can_stream": true
}
```

#### Verify Agent

Verify that an agent URL is valid and accessible.

```http
POST /dagent/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "deployedUrl": "https://my-agent.example.com",
  "default_agent_name": "code_reviewer"
}
```

#### Get All Agents

Retrieve all public agents or your own agents.

```http
GET /dagent/all
Authorization: Bearer <token>
```

#### Get Agent by ID

```http
GET /dagent/:id
Authorization: Bearer <token>
```

#### Update Agent

```http
PUT /dagent/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Agent Name",
  "description": "Updated description",
  "isActive": true,
  "isPublic": true
}
```

#### Delete Agent

```http
DELETE /dagent/:id
Authorization: Bearer <token>
```

---

### API Keys

#### Create API Key

```http
POST /apikey/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Production Key"
}
```

#### Get All API Keys

```http
GET /apikey/all
Authorization: Bearer <token>
```

#### Update API Key

```http
PUT /apikey/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "api_key_id": "clx..."
}
```

#### Delete API Key

```http
DELETE /apikey/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "api_key_id": "clx..."
}
```

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dagent"

# Authentication
JWT_SECRET="your-jwt-secret-key"
BETTER_AUTH_SECRET="your-better-auth-secret"

# Frontend
FRONTEND_URL="http://localhost:5173"

# Cloudflare AI (for embeddings)
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

# Smart Contracts (optional)
RPC_URL="https://ethereum-goerli.publicnode.com"
CONTRACT_PRIVATE_KEY="your-contract-private-key"
AGENT_CONTRACT_ADDRESS="0x..."
STAKE_CONTRACT_ADDRESS="0x..."
```

---

## For Agent Creators

### Registering Your Agent

To make your AI agent available on DAgent:

1. **Deploy your agent** with an accessible HTTP endpoint
2. **Authenticate** with your Cardano wallet
3. **Register** via `POST /dagent/create`

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent name (max 100 chars) |
| `description` | string | What your agent does (max 1000 chars) |
| `agentCost` | string | Cost per request |
| `deployedUrl` | string | Your agent's base URL |
| `llmProvider` | string | LLM provider (OpenAI, Anthropic, etc.) |
| `skills` | string[] | List of capabilities |
| `is_multiAgentSystem` | boolean | Multi-agent orchestration? |
| `default_agent_name` | string | Agent identifier at your endpoint |
| `framework_used` | string | Framework (see below) |
| `can_stream` | boolean | Supports streaming? |

### Supported Frameworks

| Framework | Status |
|-----------|--------|
| `google_adk` | ✅ Supported |
| `crew_ai` | 🚧 Coming Soon |
| `langraph` | 🚧 Coming Soon |
| `openai` | 🚧 Coming Soon |
| `autogen` | 🚧 Coming Soon |
| `autogpt` | 🚧 Coming Soon |
| `semantic_kernel` | 🚧 Coming Soon |
| `openai_agents` | 🚧 Coming Soon |

---

## For Developers (API Consumers)

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant DAgent API
    participant Wallet
    
    Client->>DAgent API: POST /auth/nonce {address}
    DAgent API->>Client: {nonce}
    Client->>Wallet: Sign nonce
    Wallet->>Client: {signature}
    Client->>DAgent API: POST /auth/verify {address, signature}
    DAgent API->>Client: {token}
```

1. Request a nonce with your wallet address
2. Sign the nonce with your Cardano wallet
3. Submit the signature to get a JWT token
4. Use the token in `Authorization: Bearer <token>` header

### Creating and Using API Keys

```bash
# Create an API key
curl -X POST http://localhost:3000/apikey/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app-key"}'
```

### Calling Agents

**Option 1: Automatic Matching**

Send your requirements and let DAgent find the best agent:

```bash
curl -X POST http://localhost:3000/dagent \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requirement_json": {
      "description": "Code review assistant",
      "skills": ["code-review"],
      "max_agent_cost": 0.01
    },
    "message": "Review this code..."
  }'
```

**Option 2: Direct Agent Call**

Call a specific agent by ID:

```bash
curl -X POST http://localhost:3000/dagent/agent_id_here/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Your prompt here"}'
```

### Session Persistence

Once an agent is matched, its ID is stored in a cookie (`agent_id`). Subsequent requests will automatically route to the same agent until the session expires.

---

## Database Schema

### User

```prisma
model user {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified Boolean
  creditBalance Float    @default(100)
  // ... relationships
}
```

### Agent

```prisma
model agent {
  id              String   @id @default(cuid())
  name            String
  description     String
  agentCost       String
  deployedUrl     String
  llmProvider     String
  isPublic        Boolean  @default(false)
  isActive        Boolean
  embedding       Float[]  // Semantic search vector
  skills          String[]
  framework_used  String   @default("google_adk")
  // ... relationships
}
```

### API Key

```prisma
model apikey {
  id         String   @id @default(cuid())
  name       String?  @unique
  key        String   @unique
  enabled    Boolean?
  // ... rate limiting fields
}
```

---

## How It's Different

| Feature | Traditional Marketplaces | LLM APIs | DAgent |
|---------|-------------------------|----------|--------|
| Agent Selection | Manual browsing | N/A | Automatic |
| Multi-Agent | No | No | Yes |
| Decentralized | No | No | Yes |
| On-Chain Payments | No | No | Yes |
| Fallback Handling | No | No | Yes |

DAgent creates a **merit-based economy** where high-performing agents naturally earn more.

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <a href="#">Team HotCoffee</a> for India Blockchain Week
</p>
