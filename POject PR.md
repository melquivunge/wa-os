Fechado. Vou tratar isso como **produto real**, não como clone visual de vídeo.

Pelo que é publicamente verificável na documentação atual da [Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform?utm_source=chatgpt.com), a WhatsApp Business Platform usa Graph API para envio e webhooks para eventos. A documentação de webhooks descreve eventos de mensagens recebidas e mudanças de status de mensagens enviadas; templates são ativos da conta comercial usados nas APIs de mensagens. ([Facebook Developers][1])

# PRD — WA OS

**Nome provisório:** WA OS
**Produto:** WhatsApp Campaign & Messaging Operations Platform
**Versão:** MVP 1.0
**Tipo:** SaaS B2B multi-tenant

---

# 1. Visão do produto

WA OS será uma plataforma para empresas gerenciarem operações de comunicação via WhatsApp.

A plataforma permitirá:

* conectar contas oficiais do WhatsApp Business;
* sincronizar templates;
* importar contatos;
* criar listas e segmentos;
* criar campanhas;
* personalizar mensagens;
* enviar imediatamente;
* agendar campanhas;
* acompanhar envio;
* acompanhar entrega;
* acompanhar leitura;
* identificar falhas;
* calcular custo;
* consultar logs;
* reprocessar eventos;
* controlar usuários e permissões.

O produto **não será inicialmente um CRM**.

Essa decisão é importante.

Se começarmos tentando construir:

```text
WhatsApp
+
CRM
+
Chatbot
+
AI Agent
+
Help Desk
+
Marketing Automation
+
Sales Pipeline
```

vamos construir seis produtos ruins.

### MVP

```text
Campaign Operations
+
Message Delivery Infrastructure
+
Analytics
```

---

# 2. Problema

Empresas que enviam grandes volumes de comunicação pelo WhatsApp normalmente acabam com uma arquitetura parecida com:

```text
CRM
 ↓
Zapier / Make / n8n
 ↓
BSP / plataforma intermediária
 ↓
WhatsApp
```

Ou:

```text
Marketing Team
 ↓
Planilha
 ↓
Fornecedor
 ↓
API
 ↓
WhatsApp
```

Problemas:

* custo de intermediários;
* baixa visibilidade operacional;
* dificuldade para rastrear falhas;
* dados espalhados;
* dependência de fornecedor;
* relatórios limitados;
* dificuldade para integrar sistemas internos;
* pouca capacidade de debugging.

A proposta do WA OS:

```text
Internal Systems
       │
       ▼
     WA OS
       │
       ▼
WhatsApp Business Platform
```

A Cloud API oficialmente fornece os dois blocos fundamentais da integração: envio de mensagens e recebimento de webhooks. ([Facebook Developers][2])

---

# 3. Usuários

## Super Admin

Responsável pela plataforma.

Pode:

* visualizar organizações;
* bloquear organizações;
* consultar métricas globais;
* investigar erros;
* acessar logs técnicos;
* administrar planos.

---

## Organization Owner

Dono da conta.

Pode:

* gerenciar organização;
* conectar WhatsApp;
* adicionar usuários;
* administrar permissões;
* visualizar custos;
* criar campanhas.

---

## Admin

Pode:

* criar campanhas;
* gerenciar contatos;
* gerenciar listas;
* visualizar analytics;
* gerenciar templates.

---

## Marketing

Pode:

* criar campanha;
* selecionar público;
* agendar;
* visualizar resultados.

Não pode:

* alterar integração Meta;
* visualizar tokens;
* administrar organização.

---

## Analyst

Read-only.

Pode:

* dashboard;
* campanhas;
* analytics;
* exportações.

---

# 4. Fluxo principal

```text
LOGIN
  │
  ▼
ORGANIZATION
  │
  ▼
DASHBOARD
  │
  ├── CONTACTS
  │
  ├── AUDIENCES
  │
  ├── TEMPLATES
  │
  ├── CAMPAIGNS
  │
  ├── ANALYTICS
  │
  └── SETTINGS
```

Fluxo de campanha:

```text
Create Campaign
      │
      ▼
Select WhatsApp Account
      │
      ▼
Select Template
      │
      ▼
Select Audience
      │
      ▼
Map Variables
      │
      ▼
Validate
      │
      ▼
Preview
      │
      ▼
Schedule / Send
      │
      ▼
Queue
      │
      ▼
WhatsApp API
      │
      ▼
Webhook Events
      │
      ▼
Analytics
```

---

# 5. Sitemap

```text
/
├── login
├── forgot-password
│
├── app
│   ├── dashboard
│   │
│   └── overview
│   │
│   ├── campaigns
│   │   ├── index
│   │   ├── create
│   │   └── [campaign]
│   │       ├── overview
│   │       ├── recipients
│   │       ├── messages
│   │       └── events
│   │
│   ├── contacts
│   │   ├── index
│   │   ├── import
│   │   └── [contact]
│   │
│   ├── audiences
│   │   ├── index
│   │   ├── create
│   │   └── [audience]
│   │
│   ├── templates
│   │   ├── index
│   │   └── [template]
│   │
│   ├── analytics
│   │
│   ├── activity
│   │
│   └── settings
│       ├── organization
│       ├── whatsapp
│       ├── users
│       ├── roles
│       └── api
│
└── admin
    ├── organizations
    ├── infrastructure
    ├── queues
    └── webhook-events
```

---

# 6. Tela — Login

```text
┌─────────────────────────────────────────────┐
│                                             │
│                  WA OS                      │
│                                             │
│        WhatsApp Messaging Operations        │
│                                             │
│ Email                                       │
│ ┌───────────────────────────────────────┐   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Password                                    │
│ ┌───────────────────────────────────────┐   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
│                                             │
│             [ Sign in ]                     │
│                                             │
└─────────────────────────────────────────────┘
```

### MVP

* email/password;
* forgot password;
* remember session.

### Depois

* Google SSO;
* Microsoft SSO;
* SAML.

Eu usaria Laravel Sanctum para autenticação do frontend próprio.

---

# 7. Dashboard

```text
┌──────────────────────────────────────────────────────────┐
│ Dashboard                           Last 30 days ▼        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SENT          DELIVERED       READ          FAILED       │
│                                                          │
│  1.2M          1.18M           970K          20K          │
│  +12.5%        98.3%           82.2%         1.7%         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Message activity                                         │
│                                                          │
│        ╭─╮                                               │
│   ╭────╯ ╰────╮          ╭─────╮                         │
│ ──╯           ╰──────────╯     ╰────────                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Recent campaigns                                         │
│                                                          │
│ Campaign       Status      Sent       Read                │
│ Black Friday   Completed   120K       91%                 │
│ Webinar        Running     42K        73%                 │
│ Leads July     Scheduled   -          -                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Cards

### Messages sent

```text
COUNT(messages WHERE sent_at IS NOT NULL)
```

### Delivered

```text
delivered / sent * 100
```

### Read

```text
read / delivered * 100
```

Eu **não usaria `read / sent` como métrica principal**.

Porque isso mistura problema de entrega com comportamento do usuário.

Mostraríamos:

```text
Delivery Rate
delivered / sent

Read Rate
read / delivered

Failure Rate
failed / attempted
```

Isso dá uma leitura operacional muito melhor.

---

# 8. Contacts

```text
┌──────────────────────────────────────────────────────────┐
│ Contacts                                      + Import   │
├──────────────────────────────────────────────────────────┤
│ Search...         Audience ▼        Status ▼             │
├──────────────────────────────────────────────────────────┤
│ □  Name           Phone            Lists        Status   │
│                                                          │
│ □  João Silva     +5561...         Leads        Active   │
│ □  Maria Lima     +5511...         Customers    Active   │
│ □  Carlos         +5521...         Webinar      Invalid  │
└──────────────────────────────────────────────────────────┘
```

## Contact model

```text
contacts

id
organization_id
external_id
name
phone
phone_normalized
country_code
locale
status
metadata
created_at
updated_at
```

`metadata` será JSONB.

Exemplo:

```json
{
  "crm_id": "lead_92827",
  "city": "Brasilia",
  "plan": "enterprise",
  "sales_owner": "melqui",
  "lead_source": "google_ads"
}
```

Por quê?

Porque eu não quero uma migration sempre que uma empresa falar:

> precisamos adicionar o campo `turma`.

---

# 9. Importação CSV

Fluxo:

```text
UPLOAD
 ↓
PARSE
 ↓
COLUMN MAPPING
 ↓
VALIDATION
 ↓
PREVIEW
 ↓
IMPORT
```

Tela:

```text
CSV COLUMN             WA OS FIELD

nome                   [ Name ▼ ]
telefone               [ Phone ▼ ]
email                  [ Metadata: email ]
cidade                 [ Metadata: city ]
turma                   [ Metadata: class ]
```

Validações:

```text
phone required
phone normalization
duplicate detection
invalid country code
empty rows
encoding
CSV size
column count
```

Não processaria CSV grande no request HTTP.

Errado:

```php
public function store(Request $request)
{
    foreach ($csv as $row) {
        Contact::create($row);
    }
}
```

Correto:

```text
Upload
 ↓
S3
 ↓
Import created
 ↓
ProcessContactImportJob
 ↓
Chunks
 ↓
Database
```

Tabela:

```text
contact_imports

id
organization_id
file_path
status
total_rows
processed_rows
successful_rows
failed_rows
mapping
started_at
completed_at
```

---

# 10. Audiences

Eu chamaria de **Audiences**, não Lists.

Porque futuramente teremos:

```text
Static Audience
Dynamic Audience
External Audience
```

## Static

Usuário adiciona contatos.

```text
Customers July
12,520 contacts
```

## Dynamic

Baseado em filtros.

```text
city = Brasilia
AND
plan = enterprise
AND
lead_source = google_ads
```

A estrutura:

```text
audiences

id
organization_id
name
type
rules
contact_count
```

Exemplo de rules:

```json
{
  "operator": "and",
  "conditions": [
    {
      "field": "metadata.city",
      "operator": "equals",
      "value": "Brasilia"
    },
    {
      "field": "metadata.plan",
      "operator": "equals",
      "value": "enterprise"
    }
  ]
}
```

Mas atenção:

**Dynamic Audience não entra no primeiro sprint.**

MVP começa com audiência estática.

---

# 11. Templates

Templates são uma parte central da arquitetura. A documentação atual da Meta define templates como ativos da WhatsApp Business Account que podem ser enviados em template messages. ([Facebook Developers][3])

Tela:

```text
┌──────────────────────────────────────────────────────────┐
│ Templates                                  Sync Meta     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ webinar_confirmation                                     │
│ Utility · pt_BR                           APPROVED        │
│                                                          │
│ Olá {{1}}, sua inscrição no {{2}} foi confirmada.        │
│                                                          │
│ Last sync: 2 minutes ago                                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ payment_reminder                                         │
│ Utility · pt_BR                           APPROVED        │
└──────────────────────────────────────────────────────────┘
```

Tabela:

```text
message_templates

id
organization_id
whatsapp_account_id
provider_template_id
name
language
category
status
components
last_synced_at
```

Components:

```json
[
  {
    "type": "BODY",
    "text": "Olá {{1}}, sua inscrição no {{2}} foi confirmada."
  }
]
```

No MVP, eu faria **sync de templates da Meta**.

Não criaria o editor completo de templates inicialmente.

Motivo:

é uma feature separada com:

* categories;
* components;
* media;
* buttons;
* validation;
* approval lifecycle.

Primeiro:

```text
Meta = source of truth
WA OS = sync + use
```

---

# 12. Create Campaign

Essa é a tela mais importante.

Eu faria como wizard.

```text
STEP 1        STEP 2        STEP 3        STEP 4
Campaign  →   Audience  →   Message   →   Review
```

## Step 1 — Campaign

```text
Campaign name

[ Webinar July 2026 ]

WhatsApp account

[ G4 Commercial +55 11... ▼ ]

Internal description

[ Webinar confirmation campaign ]
```

---

## Step 2 — Audience

```text
Select audience

○ Customers
○ Webinar July
● Leads July

12,520 contacts

Validation

12,420 valid
82 duplicates
18 invalid
```

Botão:

```text
CONTINUE WITH 12,420 CONTACTS
```

---

## Step 3 — Message

```text
Template

[ webinar_confirmation ▼ ]

Preview

┌─────────────────────────────┐
│ Olá João 👋                 │
│                             │
│ Sua inscrição no Webinar    │
│ Growth 2026 foi confirmada. │
│                             │
│ 20 de julho às 19:00        │
└─────────────────────────────┘
```

Variable mapping:

```text
{{1}} → contact.name

{{2}} → metadata.event_name

{{3}} → campaign.event_date
```

Internamente:

```json
{
  "1": {
    "source": "contact",
    "field": "name"
  },
  "2": {
    "source": "metadata",
    "field": "event_name"
  },
  "3": {
    "source": "static",
    "value": "20 de julho às 19:00"
  }
}
```

Isso é muito mais robusto que:

```text
{{name}}
{{event}}
```

Porque o template real do provider e a representação interna são coisas diferentes.

---

# 13. Campaign Review

```text
CAMPAIGN

Webinar July 2026

WhatsApp Account
G4 Commercial

Audience
Leads July

Recipients
12,420

Template
webinar_confirmation

Estimated messages
12,420

Estimated cost
R$ X.XXX,XX

Schedule

● Send now
○ Schedule

[ BACK ]                  [ LAUNCH CAMPAIGN ]
```

A plataforma deve exibir estimativa, mas não fingir que ela é sempre o custo final. A Meta mantém rate cards e regras de pricing próprios; a documentação atual mostra tarifas e volume tiers efetivos a partir de 1º de julho de 2026. ([Facebook Developers][4])

Então:

```text
Estimated cost
```

e não:

```text
Final cost
```

antes do processamento.

---

# 14. Campaign Status

Estados:

```text
draft
validating
scheduled
queued
running
paused
completed
cancelled
failed
```

Enum:

```php
enum CampaignStatus: string
{
    case Draft = 'draft';
    case Validating = 'validating';
    case Scheduled = 'scheduled';
    case Queued = 'queued';
    case Running = 'running';
    case Paused = 'paused';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
}
```

Transições:

```text
DRAFT
 ↓
VALIDATING
 ↓
SCHEDULED
 ↓
QUEUED
 ↓
RUNNING
 ↓
COMPLETED
```

Alternativas:

```text
RUNNING → PAUSED
PAUSED → RUNNING

DRAFT → CANCELLED
SCHEDULED → CANCELLED

RUNNING → FAILED
```

Eu usaria uma state machine.

Não faria:

```php
$campaign->status = 'whatever';
```

espalhado pelo projeto.

---

# 15. Campaign Overview

```text
Campaign: Webinar July 2026

RUNNING

Progress
████████████████░░░░  72%

8,942 / 12,420

SENT        DELIVERED      READ       FAILED

8,942       8,721          7,193      221
100%        97.5%          82.4%      2.5%

Message status over time

        ╭───────
      ╭─╯
   ╭──╯
───╯

Recent failures

+5561...    Rate limited
+5511...    Invalid recipient
+5521...    Provider error
```

---

# 16. Campaign Recipients

```text
Recipient      Phone        Status       Attempts

João           +5561...     READ         1
Maria          +5511...     DELIVERED    1
Carlos         +5521...     FAILED       3
```

Filtro:

```text
All
Pending
Sent
Delivered
Read
Failed
```

Actions:

```text
Retry failed
Export CSV
```

Eu **não permitiria retry de qualquer erro**.

Erros precisam de classificação.

```text
RETRYABLE
NON_RETRYABLE
UNKNOWN
```

Exemplo:

```php
enum FailureType: string
{
    case Retryable = 'retryable';
    case NonRetryable = 'non_retryable';
    case Unknown = 'unknown';
}
```

---

# 17. Message State

```text
pending
queued
sending
accepted
sent
delivered
read
failed
```

Não sobrescreveria o histórico.

Teríamos:

```text
messages
```

e:

```text
message_events
```

Exemplo:

```text
MESSAGE

pending
 ↓
queued
 ↓
accepted
 ↓
sent
 ↓
delivered
 ↓
read
```

Tabela:

```text
message_events

id
message_id
type
provider_event_id
payload
occurred_at
created_at
```

Isso nos permite reconstruir o lifecycle.

Os status enviados pelo WhatsApp podem chegar por webhook; a documentação da Meta explicitamente descreve webhooks de status para mensagens enviadas. ([Facebook Developers][5])

---

# 18. Banco de dados

Minha primeira modelagem seria:

```text
organizations
users
organization_users

whatsapp_accounts

contacts
contact_imports

audiences
audience_contacts

message_templates

campaigns
campaign_audiences
campaign_recipients

messages
message_events

webhook_events

api_keys

audit_logs
```

## organizations

```text
id UUID
name
slug
status
settings JSONB
created_at
updated_at
```

## organization_users

```text
organization_id
user_id
role
```

## whatsapp_accounts

```text
id
organization_id
name
business_account_id
phone_number_id
display_phone_number
access_token_encrypted
status
metadata
last_synced_at
```

## campaigns

```text
id
organization_id
whatsapp_account_id
message_template_id

name
description

status

variable_mapping JSONB

scheduled_at
queued_at
started_at
completed_at

recipient_count
attempted_count
sent_count
delivered_count
read_count
failed_count

estimated_cost
actual_cost

created_by
created_at
updated_at
```

## campaign_recipients

```text
id
campaign_id
contact_id

resolved_variables JSONB

status
attempt_count

queued_at
sent_at
delivered_at
read_at
failed_at

failure_code
failure_message
```

Índices:

```sql
INDEX campaign_status_idx
(campaign_id, status)

INDEX campaign_pending_idx
(campaign_id, status, id)

INDEX contact_phone_idx
(organization_id, phone_normalized)

UNIQUE organization_phone_unique
(organization_id, phone_normalized)
```

Aqui precisamos tomar cuidado com tabela de alto volume.

`messages` pode virar:

```text
10M
100M
500M rows
```

Então não desenharia o banco assumindo 20 mil mensagens.

---

# 19. Arquitetura do backend

Eu faria **modular monolith**.

Não microservices.

Estrutura:

```text
app/
├── Domain/
│   ├── Organization/
│   ├── WhatsApp/
│   ├── Contact/
│   ├── Audience/
│   ├── Template/
│   ├── Campaign/
│   ├── Message/
│   └── Analytics/
│
├── Infrastructure/
│   ├── Meta/
│   ├── Queue/
│   ├── Storage/
│   └── Observability/
│
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/
│
└── Support/
```

Campaign:

```text
Domain/Campaign/

Actions/
    CreateCampaign.php
    ValidateCampaign.php
    ScheduleCampaign.php
    StartCampaign.php
    PauseCampaign.php

DTOs/
    CampaignData.php

Enums/
    CampaignStatus.php

Events/
    CampaignCreated.php
    CampaignStarted.php
    CampaignCompleted.php

Jobs/
    ValidateCampaignJob.php
    StartCampaignJob.php

Models/
    Campaign.php
    CampaignRecipient.php

Policies/
    CampaignPolicy.php

Services/
    CampaignMetricsService.php
```

---

# 20. WhatsApp Provider abstraction

Não acoplaria o domínio diretamente à Meta.

Errado:

```php
Http::post(
    'https://graph.facebook.com/...'
);
```

dentro de `SendMessageJob`.

Faria:

```php
interface MessagingProvider
{
    public function send(
        OutboundMessage $message
    ): ProviderMessageResult;
}
```

Meta:

```php
final class MetaWhatsAppProvider implements MessagingProvider
{
    public function send(
        OutboundMessage $message
    ): ProviderMessageResult {
        //
    }
}
```

Container:

```php
$this->app->bind(
    MessagingProvider::class,
    MetaWhatsAppProvider::class,
);
```

Isso permite futuramente:

```text
Meta Cloud API
Twilio
360dialog
Internal provider
```

Sem reescrever Campaign.

Mas o MVP usará a integração oficial da [WhatsApp Cloud API — Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started?utm_source=chatgpt.com).

---

# 21. Queue architecture

```text
Redis

queues:

campaign-control
campaign-validation

message-high
message-default
message-low

webhooks

analytics

imports
```

Workers:

```text
worker-control
worker-messages-01
worker-messages-02
worker-messages-03
worker-webhooks
worker-imports
```

Fluxo:

```text
StartCampaignJob
       │
       ▼
CreateRecipientBatches
       │
       ▼
DispatchMessageBatchJob
       │
       ▼
SendWhatsAppMessageJob
       │
       ▼
MetaWhatsAppProvider
```

Não criaria 1 milhão de jobs de uma vez.

Usaria batching progressivo.

```text
Campaign
 ↓
Batch 1 — 1,000
 ↓
Batch 2 — 1,000
 ↓
Batch 3 — 1,000
```

O batch dispatcher controla backpressure.

---

# 22. Idempotency

Isso é obrigatório.

Problema:

```text
Job sends message
        ↓
Meta accepts
        ↓
Network timeout
        ↓
Job thinks it failed
        ↓
Retry
        ↓
Customer receives twice
```

Precisamos de:

```text
idempotency_key
```

Exemplo:

```text
campaign:{campaign_id}:recipient:{recipient_id}
```

Antes do envio:

```php
$lock = Cache::lock(
    "message-send:{$recipient->id}",
    30
);

$lock->block(5, function () {
    //
});
```

Mas lock sozinho não resolve tudo.

Persistência:

```text
outbound_attempts

id
message_id
idempotency_key
provider_request_id
status
started_at
completed_at
```

---

# 23. Webhook architecture

Endpoint:

```text
GET  /webhooks/meta/whatsapp
POST /webhooks/meta/whatsapp
```

Controller deve ser burro.

```php
final class MetaWebhookController
{
    public function store(Request $request): Response
    {
        $event = WebhookEvent::create([
            'provider' => 'meta',
            'payload' => $request->all(),
        ]);

        ProcessMetaWebhookJob::dispatch($event);

        return response()->noContent();
    }
}
```

Não processar tudo no HTTP request.

Fluxo:

```text
Meta
 ↓
Webhook Controller
 ↓
Persist raw payload
 ↓
HTTP 200
 ↓
Queue
 ↓
ProcessMetaWebhookJob
 ↓
Normalize event
 ↓
Message Event
 ↓
Update projection
```

A integração oficial trabalha com HTTPS, Graph API e webhooks. ([Facebook Developers][1])

---

# 24. Webhook replay

Admin:

```text
Webhook Event #87291

Provider: META
Status: FAILED

Error
Message not found

Payload
{ ... }

[ REPROCESS ]
```

Command:

```bash
php artisan webhook:replay 87291
```

Action:

```php
ReplayWebhookEvent::execute($event);
```

Isso vai salvar nossa vida em produção.

---

# 25. Analytics

Eu não faria queries gigantes em `messages` para carregar dashboard.

Errado:

```sql
SELECT COUNT(*)
FROM messages
WHERE status = 'read'
AND created_at BETWEEN ...
```

em 100 milhões de rows toda vez que o dashboard abre.

Criaria projections.

```text
campaign_metrics

campaign_id
attempted
accepted
sent
delivered
read
failed
estimated_cost
actual_cost
```

Para dashboard por dia:

```text
organization_daily_metrics

organization_id
date
attempted
sent
delivered
read
failed
cost
```

Webhook:

```text
MESSAGE_DELIVERED
        ↓
UpdateMessageProjection
        ↓
IncrementCampaignMetrics
        ↓
IncrementDailyMetrics
```

---

# 26. API

```text
/api/v1
```

Endpoints:

```text
GET    /me

GET    /organizations
GET    /organizations/{organization}

GET    /contacts
POST   /contacts
GET    /contacts/{contact}

POST   /contact-imports
GET    /contact-imports/{import}

GET    /audiences
POST   /audiences
GET    /audiences/{audience}

GET    /templates
POST   /templates/sync

GET    /campaigns
POST   /campaigns
GET    /campaigns/{campaign}
PATCH  /campaigns/{campaign}

POST   /campaigns/{campaign}/validate
POST   /campaigns/{campaign}/schedule
POST   /campaigns/{campaign}/start
POST   /campaigns/{campaign}/pause
POST   /campaigns/{campaign}/resume
POST   /campaigns/{campaign}/cancel

GET    /campaigns/{campaign}/recipients
GET    /campaigns/{campaign}/messages
GET    /campaigns/{campaign}/metrics

GET    /analytics/overview

POST   /webhooks/meta/whatsapp
```

---

# 27. Frontend structure

Next.js:

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │
│   └── (dashboard)/
│       ├── dashboard/
│       ├── campaigns/
│       ├── contacts/
│       ├── audiences/
│       ├── templates/
│       ├── analytics/
│       └── settings/
│
├── components/
│   ├── ui/
│   ├── charts/
│   ├── campaigns/
│   ├── contacts/
│   └── whatsapp/
│
├── features/
│   ├── campaigns/
│   ├── contacts/
│   └── analytics/
│
├── lib/
│   ├── api/
│   ├── auth/
│   └── utils/
│
└── types/
```

Eu usaria:

```text
Next.js
TypeScript
Tailwind
shadcn/ui
TanStack Query
React Hook Form
Zod
Recharts
```

Não usaria Redux inicialmente.

TanStack Query para server state.

Local state normal para UI.

---

# 28. Repositório

Minha recomendação:

```text
wa-os/
├── apps/
│   ├── api/
│   └── web/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── terraform/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── adr/
│
├── docker-compose.yml
├── Makefile
└── README.md
```

Mas atenção:

não faria monorepo com ferramenta Node complexa só porque parece moderno.

```text
apps/api = Laravel
apps/web = Next.js
```

O root só coordena ambiente.

---

# 29. Docker local

```text
nginx
api
queue
scheduler
web
postgres
redis
mailpit
```

```text
localhost:3000 → Next.js
localhost:8080 → Laravel API
localhost:8025 → Mailpit
```

Horizon:

```text
localhost:8080/horizon
```

---

# 30. Segurança

Tokens Meta:

```text
access_token_encrypted
```

Laravel encrypted casts:

```php
protected function casts(): array
{
    return [
        'access_token' => 'encrypted',
    ];
}
```

Mas para produção séria eu consideraria:

```text
AWS Secrets Manager
```

Outras regras:

```text
Tenant isolation
RBAC
Audit logs
API rate limiting
Webhook verification
Signed imports
CSV sanitization
Encrypted credentials
No token in logs
PII masking
```

Logs:

Errado:

```php
Log::info($request->all());
```

Se payload tiver telefone:

```text
+5561999999999
```

nos logs, já criamos problema de dados.

Mask:

```text
+5561******999
```

---

# 31. LGPD

Como teremos:

```text
nome
telefone
metadata
message history
```

LGPD não pode ser "vemos depois".

Precisamos desde o MVP:

```text
Data retention
Contact deletion
Organization deletion
Audit logs
PII masking
Export
Consent metadata
Suppression list
```

Eu adicionaria:

```text
contact_consents
```

e:

```text
suppression_entries
```

```text
suppression_entries

organization_id
phone_hash
reason
source
created_at
```

Se alguém fez opt-out:

```text
Campaign
 ↓
Resolve audience
 ↓
Suppression check
 ↓
DO NOT QUEUE
```

---

# 32. MVP real

Eu cortaria o escopo assim.

## Sprint 1 — Foundation

```text
Laravel
Next.js
Docker
PostgreSQL
Redis
Authentication
Organizations
Tenant isolation
RBAC
```

## Sprint 2 — WhatsApp

```text
WhatsApp account
Meta credentials
Connection validation
Template sync
Webhook verification
Raw webhook storage
```

## Sprint 3 — Contacts

```text
Contacts
CSV upload
Column mapping
Background import
Phone normalization
Static audiences
```

## Sprint 4 — Campaign Builder

```text
Campaign CRUD
Template selection
Audience selection
Variable mapping
Preview
Validation
```

## Sprint 5 — Delivery Engine

```text
Campaign scheduler
Queue architecture
Message dispatch
Rate control
Retries
Idempotency
```

## Sprint 6 — Webhooks

```text
sent
delivered
read
failed

Message events
Webhook replay
Metrics projection
```

## Sprint 7 — Analytics

```text
Dashboard
Campaign metrics
Delivery rate
Read rate
Failure rate
Cost estimate
CSV export
```

## Sprint 8 — Production

```text
Audit
Security review
Load tests
Monitoring
Sentry
Backup
Deployment
Runbook
```

---

# 33. O que NÃO entra no MVP

```text
❌ AI Agent
❌ Chatbot Builder
❌ CRM
❌ Shared Inbox
❌ Sales Pipeline
❌ Instagram
❌ SMS
❌ Email Marketing
❌ Drag-and-drop automation
❌ Mobile app
❌ White label
❌ Billing SaaS
```

Sim, billing fica fora.

Primeiro precisamos provar:

```text
Can we reliably send,
track and operate
high-volume campaigns?
```

Se a resposta for não, Stripe não importa.

---

# 34. Definition of Done do MVP

Eu consideraria o MVP pronto quando conseguirmos:

```text
1. Create organization

2. Connect WhatsApp account

3. Sync approved templates

4. Import 100,000 contacts

5. Create audience

6. Create campaign

7. Map template variables

8. Validate campaign

9. Schedule campaign

10. Process recipients asynchronously

11. Send through Meta

12. Receive webhook events

13. Track:
    sent
    delivered
    read
    failed

14. Retry retryable failures

15. Prevent duplicate sends

16. Display campaign metrics

17. Export campaign report

18. Replay failed webhook

19. Audit critical actions

20. Delete/export contact data
```

---

# Minha recomendação técnica final

**Não começaria escrevendo controller.**

Primeiro:

```text
/docs/product/PRD.md
/docs/architecture/SYSTEM.md
/docs/architecture/DATA_MODEL.md
/docs/architecture/QUEUE.md
/docs/architecture/WEBHOOKS.md
/docs/architecture/SECURITY.md

/docs/adr/
ADR-001-modular-monolith.md
ADR-002-postgresql.md
ADR-003-redis-queues.md
ADR-004-provider-abstraction.md
ADR-005-message-event-history.md
```

Depois scaffold.

E vou ser ainda mais direto: **eu não começaria Laravel + Next.js simultaneamente**.

Minha ordem seria:

```text
1. Laravel API
2. PostgreSQL model
3. Meta sandbox integration
4. Webhook ingestion
5. Queue/message lifecycle
6. Feature tests
7. Só então dashboard Next.js