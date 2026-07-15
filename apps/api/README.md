# WA OS API

API HTTP do WA OS, construída com Laravel 13 e PHP 8.3+ (incluindo PHP 8.4).

## Requisitos

- PHP 8.3 ou superior
- Composer 2
- PostgreSQL 16+
- Redis 7+

## Preparação local

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
```

O arquivo `.env.example` usa PostgreSQL em `127.0.0.1:5432` e Redis em
`127.0.0.1:6379`. Ajuste as credenciais no `.env` de acordo com o ambiente.

Inicie a API:

```bash
php artisan serve
```

Confirme que o serviço está disponível:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Resposta esperada:

```json
{"status":"ok","service":"wa-os-api"}
```

## Testes e estilo

Os testes usam SQLite em memória, conforme `phpunit.xml`, e não dependem dos
serviços locais:

```bash
composer test
vendor/bin/pint --test
```

## Organização

- `routes/api.php`: rotas HTTP versionadas sob `/api/v1`.
- `app/Http/Controllers/Api/V1`: adaptadores HTTP da versão atual.
- `app/Modules`: ponto de entrada para módulos de negócio quando seus limites
  forem definidos. Nenhum domínio foi antecipado neste scaffold.

O endpoint nativo `/up` permanece disponível para probes internos do Laravel.
