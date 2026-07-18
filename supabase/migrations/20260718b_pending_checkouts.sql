create table pending_checkouts (
  checkout_id text primary key,
  email text not null,
  amount numeric,
  created_at timestamptz default now()
);
