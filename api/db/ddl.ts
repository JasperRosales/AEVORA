/**
 * Idempotent schema DDL shared by the seed and migration scripts. Keeping it
 * in one place means a branch that only needs the schema (no starter rows) can
 * be brought up to date with `npm run db:migrate`.
 */
export const DDL = `
create table if not exists cemeteries (
  id text primary key, name text not null, location text not null
);
create table if not exists cemetery_map_placeholders (
  cemetery_id text primary key references cemeteries(id),
  rows integer not null, columns integer not null, placements text not null
);
create table if not exists plots (
  id text primary key, plot_number text not null,
  cemetery_id text not null references cemeteries(id),
  section text not null, "row" integer not null, "column" integer not null,
  size text not null, price integer not null,
  status text not null, type text not null default 'Typical Block',
  group_name text, reserved_for text
);
alter table plots add column if not exists type text not null default 'Typical Block';
alter table plots alter column type set default 'Typical Block';
alter table plots add column if not exists group_name text;
-- Preserve the plot category when upgrading databases that stored it separately.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'plots' and column_name = 'category'
  ) then
    update plots set type = case category
      when 'Typical Plot' then 'Typical Block'
      when 'Public' then 'Typical Block'
      when 'Premium Block' then 'Premium Plot'
      when 'Premium Lot' then 'Premium Plot'
      when 'Private' then 'Premium Plot'
      when 'Special Premium Lot' then 'Special Premium Plot'
      when 'Vertical' then 'Special Premium Plot'
      else category
    end
    where category is not null;
    alter table plots drop column category;
  end if;
end $$;
update plots set type = case type
  when 'Typical Plot' then 'Typical Block'
  when 'Public' then 'Typical Block'
  when 'Premium Block' then 'Premium Plot'
  when 'Premium Lot' then 'Premium Plot'
  when 'Private' then 'Premium Plot'
  when 'Special Premium Lot' then 'Special Premium Plot'
  when 'Vertical' then 'Special Premium Plot'
  else type
end
where type in ('Typical Plot', 'Public', 'Premium Block', 'Premium Lot', 'Private', 'Special Premium Lot', 'Vertical');
create table if not exists reservations (
  id text primary key, reservation_number text not null, client_name text not null,
  cemetery_id text not null references cemeteries(id), plot_number text not null,
  date text not null, plot_category text not null default 'Typical Block',
  status text not null, verification text not null
);
alter table reservations add column if not exists plot_category text not null default 'Typical Block';
alter table reservations alter column plot_category set default 'Typical Block';
update reservations set plot_category = case plot_category
  when 'Typical Plot' then 'Typical Block'
  when 'Public' then 'Typical Block'
  when 'Premium Block' then 'Premium Plot'
  when 'Premium Lot' then 'Premium Plot'
  when 'Private' then 'Premium Plot'
  when 'Special Premium Lot' then 'Special Premium Plot'
  when 'Vertical' then 'Special Premium Plot'
  else plot_category
end
where plot_category in ('Typical Plot', 'Public', 'Premium Block', 'Premium Lot', 'Private', 'Special Premium Lot', 'Vertical');
-- Fold the retired burial type into plot category, then remove the old column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'reservations' and column_name = 'burial_type'
  ) then
    update reservations set plot_category = case burial_type
      when 'Private' then 'Premium Plot'
      when 'Vertical' then 'Special Premium Plot'
      when 'Public' then 'Typical Block'
      else plot_category
    end
    where burial_type is not null;
    alter table reservations drop column burial_type;
  end if;
end $$;
create table if not exists clients (
  id text primary key, client_id text not null, full_name text not null,
  contact_number text not null, email text not null, type text not null,
  registered_at text not null, status text not null, reservations integer not null
);
create table if not exists payments (
  id text primary key, receipt_number text not null, client_name text not null,
  plot_number text not null, type text not null, amount integer not null,
  date text not null, status text not null, method text not null,
  cemetery_id text not null references cemeteries(id)
);
create table if not exists agreements (
  id text primary key, agreement_number text not null, client_name text not null,
  plot_number text not null, cemetery_id text not null references cemeteries(id),
  type text not null, date_signed text not null, status text not null
);
create table if not exists activities (
  id text primary key, action text not null, "user" text not null,
  date_time text not null, record text not null
);
create table if not exists notifications (
  id text primary key, message text not null, type text not null,
  date_time text not null, is_read boolean not null default false
);
alter table notifications add column if not exists is_read boolean not null default false;
create table if not exists generated_reports (
  id text primary key, name text not null, type text not null,
  date_generated text not null, generated_by text not null, status text not null
);
create table if not exists attachments (
  id text primary key,
  reservation_id text not null references reservations(id),
  key text not null, filename text not null, content_type text not null,
  size integer not null, created_at timestamptz not null default now()
);
`
