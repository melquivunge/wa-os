# System architecture

WA OS is a modular monolith with independently deployable web and API applications. Next.js renders the product interface and consumes a versioned Laravel JSON API. Laravel owns authentication, authorization, tenant isolation, domain rules, asynchronous coordination, and persistence.

## Runtime boundaries

```text
Browser -> Next.js web -> Laravel API -> PostgreSQL
                                  \-> Redis queues
```

The initial WhatsApp provider is deterministic and simulated. Provider-specific payloads remain behind an infrastructure adapter; domain modules consume normalized accounts, templates, submissions, and message events.

## Backend modules

- Organization
- WhatsApp
- Contact
- Audience
- Template
- Campaign
- Message
- Analytics

HTTP controllers translate transport concerns. Domain actions own behavior. Jobs coordinate asynchronous steps and call domain actions. Infrastructure adapters own vendor APIs, queue implementations, storage, and observability.

## Frontend state

- Server data: TanStack Query.
- Forms: React Hook Form and Zod.
- Local interactions: React state.
- Backend validation and authorization remain authoritative.
