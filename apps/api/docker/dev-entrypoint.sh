#!/usr/bin/env sh
set -eu

if [ ! -f vendor/autoload.php ]; then
  composer install
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

php <<'PHP'
<?php

$path = '.env';
$values = [
    'APP_URL',
    'FRONTEND_URL',
    'FRONTEND_ORIGINS',
    'SANCTUM_STATEFUL_DOMAINS',
    'DB_CONNECTION',
    'DB_HOST',
    'DB_PORT',
    'DB_DATABASE',
    'DB_USERNAME',
    'DB_PASSWORD',
    'REDIS_HOST',
    'REDIS_PORT',
];

$env = file_get_contents($path);

foreach ($values as $key) {
    $value = getenv($key);

    if ($value === false || $value === '') {
        continue;
    }

    $line = $key.'='.$value;
    $pattern = '/^'.preg_quote($key, '/').'=.*$/m';

    if (preg_match($pattern, $env)) {
        $env = preg_replace($pattern, $line, $env);
    } else {
        $env .= PHP_EOL.$line;
    }
}

file_put_contents($path, $env);
PHP

if ! grep -q '^APP_KEY=base64:' .env && [ -z "${APP_KEY:-}" ]; then
  php artisan key:generate
fi

php artisan config:clear
php artisan migrate --seed --force
php artisan serve --host=0.0.0.0 --port=8000
