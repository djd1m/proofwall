-- Подтверждение владения email. Не является входом или N3 proof.
alter table accounts add column email_verified_at timestamptz;

create table email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create unique index email_verification_one_unused
  on email_verification_tokens(account_id) where used_at is null;
-- Доступ только сервису: анонимный consume резолвит аккаунт из хеша, не из body.
alter table email_verification_tokens enable row level security;
grant select, insert, update on email_verification_tokens to app_service;
