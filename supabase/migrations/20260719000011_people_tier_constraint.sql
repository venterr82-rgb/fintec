-- people.tier already exists (added in 20260719000009 for the onboarding
-- wizard's document-tier-locking), storing capitalized values ('Basic',
-- 'Standard', 'Premium') with no constraint. This request specifies
-- lowercase values with a CHECK constraint plus a new 'custom' tier for
-- bespoke retainer clients — since the column already exists, a plain
-- `add column if not exists` would silently no-op and never add the
-- constraint, so this normalizes existing data instead of skipping it.

update people set tier = lower(tier) where tier is not null;
update people set tier = 'basic' where tier is null;

alter table people alter column tier set default 'basic';

alter table people add constraint people_tier_check
  check (tier in ('basic', 'standard', 'premium', 'custom'));

alter table people add column if not exists engagement_description text;
