create table verified_payments (
  id uuid primary key default gen_random_uuid(),
  email text,
  amount numeric,
  yoco_payment_id text unique,
  used boolean default false,
  created_at timestamptz default now()
);
