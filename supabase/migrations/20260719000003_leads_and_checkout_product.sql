-- B2B "sell the platform to accounting firms" lead capture + setup fee.
--
-- pending_checkouts gets a `product` discriminator so the Yoco webhook can
-- tell a firm's R1,500 setup-fee checkout apart from a client's tax-service
-- checkout without any change to Yoco's own webhook payload (Yoco sends no
-- metadata back — see the header comment in src/app/api/webhooks/yoco/route.ts).

create table leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id), -- null until/unless this lead becomes a real customer
  firm_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  approx_client_count integer,
  checkout_id text,
  paid_setup_fee boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table pending_checkouts add column product text not null default 'tax_service';
alter table pending_checkouts add column lead_id uuid references leads(id);

-- Same access model as verified_payments/pending_checkouts: only the
-- service-role client (used by /api/leads, /api/leads/checkout, and the
-- webhook handler) ever touches this table.
alter table leads enable row level security;

create policy "leads: service role only" on leads
  for all
  to authenticated
  using (false);
