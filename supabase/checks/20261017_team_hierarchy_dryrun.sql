-- READ-ONLY dry run for 20261017_team_hierarchy.sql. Changes nothing.
-- Run it in the Supabase SQL Editor BEFORE applying the migration. It shows,
-- per profile, the hierarchy level and branch the migration would assign from
-- the free-text "position". Rules are identical to the migration's backfill.
--
-- review = 'CHECK' marks rows to look at by hand:
--   * position mentions "baskan" but matched no level rule (stays member)
--   * more than one branch keyword matched (branch left empty)
--   * branch_lead without a detected branch
with norm as (
  select
    p.id, p.display_order, p.first_name, p.last_name, p."position", p.department,
    pg_catalog.lower(pg_catalog.translate(coalesce(p."position", ''), 'İIıŞşĞğÜüÖöÇç', 'iiissgguuoocc')) as n
  from public.profiles as p
),
lvl as (
  select *,
    case
      when n ~ 'baskan\s*yardimci' or n ~ 'bsk\.?\s*yrd' or n ~ 'yardimcisi' then 'vice_president'
      when n ~ 'kol(u)?\s*(baskan|lider)' then 'branch_lead'
      when n ~ '^\s*(kulup\s+|yonetim\s+kurulu\s+)?baskan(i)?\s*$' then 'president'
      else 'member'
    end as level,
    array_remove(array[
      case when n ~ 'mobil' then 'mobil' end,
      case when n ~ 'web' then 'web' end,
      case when n ~ 'oyun|game' then 'oyun' end,
      case when n ~ 'blockchain|block\s*chain|blokzincir' then 'blockchain' end,
      case when n ~ 'sosyal\s*medya' then 'sosyal-medya' end,
      case when n ~ 'sponsor' then 'sponsorluk' end
    ], null) as hits
  from norm
)
select
  display_order,
  first_name || ' ' || last_name as name,
  "position",
  department,
  level as new_level,
  case when level in ('president', 'vice_president') then null
       when pg_catalog.cardinality(hits) = 1 then hits[1] end as new_branch,
  case
    when level = 'member' and n ~ 'baskan' then 'CHECK'
    when level in ('branch_lead', 'member') and pg_catalog.cardinality(hits) > 1 then 'CHECK'
    when level = 'branch_lead' and pg_catalog.cardinality(hits) <> 1 then 'CHECK'
  end as review
from lvl
order by display_order, id;
