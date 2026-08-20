-- Migration: 008_add_skills_talents_table
-- Grant select on skills_talents to authenticated role.


create table if not exists skills_talents (
  skill_id uuid not null,
  talent_id uuid not null,
  constraint skill_talent_links_skill_id_fkey foreign KEY (skill_id) references skills (id) on delete CASCADE,
  constraint skill_talent_links_talent_id_fkey foreign KEY (talent_id) references talents (id) on delete CASCADE,
  primary key (skill_id, talent_id)
);


grant
select
  on table public.skills_talents to authenticated;