--
-- PostgreSQL database dump
--

\restrict Kxh1dVmLtMY8honbAuKhvpb1a9hOLcDBelC2c4m1UOsaHKEvioq4DSzyXu3MtLa

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: delete_old_notifications(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_old_notifications() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  delete from public.notifications
  where (created_at < now() - interval '30 days')
  or (is_read = true and created_at < now() - interval '5 days');
  return new;
end;
$$;


--
-- Name: get_email_by_username(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_email_by_username(search_username text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  found_email text;
begin
  select email into found_email
  from public.profiles
  where lower(username) = lower(search_username)
  limit 1;

  return found_email;
end;
$$;


--
-- Name: get_session_id_by_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_session_id_by_code(target_code text) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select s.id
  from public.sessions s
  where upper(s.code) = upper(target_code)
    and s.is_archived = false
  limit 1;
$$;


--
-- Name: get_session_owner_for_request(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_session_owner_for_request(target_session_id uuid) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select s.mj_id
  from public.sessions s
  where s.id = target_session_id
    and s.is_archived = false
  limit 1;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.profiles (id, username, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'user_' || new.id::text),
    coalesce(new.email, 'user_' || new.id::text || '@example.invalid'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;


--
-- Name: is_character_visible(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_character_visible(target_character_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
    from public.characters c
    where c.id = target_character_id
      and (
        c.user_id = auth.uid()
        or exists (
          select 1
          from public.users_session us
          where us.session_id = c.session_id
            and us.user_id = auth.uid()
            and us.active = true
        )
      )
  );
$$;


--
-- Name: is_session_mj(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_session_mj(target_session_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
    from public.sessions s
    where s.id = target_session_id
      and s.mj_id = auth.uid()
  );
$$;


--
-- Name: search_session_notes(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_session_notes(target_session_id uuid, search_text text) RETURNS TABLE(id uuid, session_id uuid, author_user_id uuid, title character varying, content_text text, is_visible boolean, is_archived boolean, created_at timestamp with time zone, updated_at timestamp with time zone, rank real)
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
  with q as (
    select websearch_to_tsquery('french', coalesce(search_text, '')) as tsq
  )
  select
    sn.id,
    sn.session_id,
    sn.author_user_id,
    sn.title,
    sn.content_text,
    sn.is_visible,
    sn.is_archived,
    sn.created_at,
    sn.updated_at,
    ts_rank('{0.0,0.2,0.6,1.0}'::real[], sn.fts_weighted, q.tsq, 32) as rank
  from public.session_notes sn
  cross join q
  where sn.session_id = target_session_id
    and q.tsq <> ''::tsquery
    and sn.fts_weighted @@ q.tsq
  order by rank desc, sn.created_at desc;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: armors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.armors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    encumbrance integer NOT NULL,
    armor_points integer NOT NULL,
    covered_locations text[] NOT NULL,
    CONSTRAINT armors_covered_locations_check CHECK (((cardinality(covered_locations) > 0) AND (covered_locations <@ ARRAY['tête'::text, 'corps'::text, 'bras'::text, 'jambes'::text]))),
    CONSTRAINT armors_encumbrance_check CHECK ((encumbrance >= 0))
);


--
-- Name: career_paths; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_paths (
    from_career_id uuid NOT NULL,
    to_career_id uuid NOT NULL
);


--
-- Name: careers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.careers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: character_armors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_armors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_id uuid,
    armor_id uuid,
    is_equipped boolean DEFAULT false NOT NULL,
    quality character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    CONSTRAINT character_armors_quality_check CHECK (((quality)::text = ANY ((ARRAY['médiocre'::character varying, 'normal'::character varying, 'bonne'::character varying, 'exceptionelle'::character varying])::text[])))
);


--
-- Name: character_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_id uuid,
    item_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    quality character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    CONSTRAINT character_items_quality_check CHECK (((quality)::text = ANY ((ARRAY['médiocre'::character varying, 'normal'::character varying, 'bonne'::character varying, 'exceptionelle'::character varying])::text[]))),
    CONSTRAINT character_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: character_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_skills (
    character_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    mastery_level integer DEFAULT 1 NOT NULL,
    CONSTRAINT character_skills_mastery_level_check CHECK ((mastery_level = ANY (ARRAY[1, 2, 3])))
);


--
-- Name: character_stat_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_stat_values (
    character_id uuid NOT NULL,
    stat_code character varying(3) NOT NULL,
    base_value integer NOT NULL,
    current_advanced integer DEFAULT 0 NOT NULL,
    total_advanced integer DEFAULT 0 NOT NULL,
    CONSTRAINT character_stat_values_base_value_check CHECK ((base_value >= 0)),
    CONSTRAINT character_stat_values_current_advanced_check CHECK ((current_advanced >= 0)),
    CONSTRAINT character_stat_values_total_advanced_check CHECK ((total_advanced >= 0))
);


--
-- Name: character_talents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_talents (
    character_id uuid NOT NULL,
    talent_id uuid NOT NULL
);


--
-- Name: character_weapons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.character_weapons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_id uuid,
    weapon_id uuid,
    equiped character varying(6),
    quality character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    CONSTRAINT character_weapons_equiped_check CHECK (((equiped)::text = ANY ((ARRAY['droite'::character varying, 'gauche'::character varying, 'd&g'::character varying])::text[]))),
    CONSTRAINT character_weapons_quality_check CHECK (((quality)::text = ANY ((ARRAY['médiocre'::character varying, 'normal'::character varying, 'bonne'::character varying, 'exceptionelle'::character varying])::text[])))
);


--
-- Name: characters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.characters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    race character varying(20) NOT NULL,
    career_id uuid NOT NULL,
    pv_max integer NOT NULL,
    pv_current integer NOT NULL,
    destiny_current integer NOT NULL,
    fortune_max integer NOT NULL,
    fortune_current integer NOT NULL,
    xp_total integer DEFAULT 0 NOT NULL,
    xp_available integer DEFAULT 0 NOT NULL,
    money_gold integer DEFAULT 0 NOT NULL,
    money_silver integer DEFAULT 0 NOT NULL,
    money_copper integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    gender character varying(8) DEFAULT 'masculin'::character varying NOT NULL,
    insanity_points integer DEFAULT 0 NOT NULL,
    CONSTRAINT characters_destiny_current_check CHECK ((destiny_current >= 0)),
    CONSTRAINT characters_fortune_current_check CHECK ((fortune_current >= 0)),
    CONSTRAINT characters_fortune_max_check CHECK ((fortune_max >= 0)),
    CONSTRAINT characters_gender_check CHECK (((gender)::text = ANY ((ARRAY['masculin'::character varying, 'féminin'::character varying])::text[]))),
    CONSTRAINT characters_money_copper_check CHECK ((money_copper >= 0)),
    CONSTRAINT characters_money_gold_check CHECK ((money_gold >= 0)),
    CONSTRAINT characters_money_silver_check CHECK ((money_silver >= 0)),
    CONSTRAINT characters_pv_current_check CHECK ((pv_current >= 0)),
    CONSTRAINT characters_pv_max_check CHECK ((pv_max >= 0)),
    CONSTRAINT characters_race_check CHECK (((race)::text = ANY ((ARRAY['elfe'::character varying, 'halfling'::character varying, 'humain'::character varying, 'nain'::character varying])::text[]))),
    CONSTRAINT characters_xp_available_check CHECK ((xp_available >= 0)),
    CONSTRAINT characters_xp_total_check CHECK ((xp_total >= 0)),
    CONSTRAINT check_fortune_bounds CHECK ((fortune_current <= fortune_max)),
    CONSTRAINT check_money_bounds CHECK (((money_copper >= 0) AND (money_silver >= 0) AND (money_gold >= 0))),
    CONSTRAINT check_pv_bounds CHECK ((pv_current <= pv_max)),
    CONSTRAINT check_xp_bounds CHECK ((xp_available <= xp_total))
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    encumbrance integer NOT NULL,
    CONSTRAINT items_encumbrance_check CHECK ((encumbrance >= 0))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_user_id uuid,
    receiver_user_id uuid NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    author_user_id uuid DEFAULT auth.uid() NOT NULL,
    title character varying(200) NOT NULL,
    content_text text,
    is_visible boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fts_weighted tsvector GENERATED ALWAYS AS ((setweight(to_tsvector('french'::regconfig, (COALESCE(title, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('french'::regconfig, COALESCE(content_text, ''::text)), 'B'::"char"))) STORED,
    CONSTRAINT session_notes_has_content CHECK ((COALESCE(length(TRIM(BOTH FROM content_text)), 0) > 0))
);

ALTER TABLE ONLY public.session_notes REPLICA IDENTITY FULL;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mj_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(6) NOT NULL,
    description text,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    specialization character varying(100),
    is_basic boolean DEFAULT false NOT NULL,
    stat_code character varying(3) NOT NULL,
    description text
);


--
-- Name: static_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.static_stats (
    code character varying(3) NOT NULL,
    name character varying(50) NOT NULL,
    is_secondary boolean DEFAULT false NOT NULL
);


--
-- Name: talents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    specialization character varying(100)
);


--
-- Name: users_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_session (
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: weapon_attribute_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weapon_attribute_mappings (
    weapon_id uuid NOT NULL,
    attribute_id uuid NOT NULL
);


--
-- Name: weapon_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weapon_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


--
-- Name: weapons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weapons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    encumbrance integer NOT NULL,
    damage_formula character varying(20) NOT NULL,
    CONSTRAINT weapons_encumbrance_check CHECK ((encumbrance >= 0))
);


--
-- Name: armors armors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.armors
    ADD CONSTRAINT armors_pkey PRIMARY KEY (id);


--
-- Name: career_paths career_paths_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_paths
    ADD CONSTRAINT career_paths_pkey PRIMARY KEY (from_career_id, to_career_id);


--
-- Name: careers careers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.careers
    ADD CONSTRAINT careers_name_key UNIQUE (name);


--
-- Name: careers careers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.careers
    ADD CONSTRAINT careers_pkey PRIMARY KEY (id);


--
-- Name: character_armors character_armors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_armors
    ADD CONSTRAINT character_armors_pkey PRIMARY KEY (id);


--
-- Name: character_items character_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_items
    ADD CONSTRAINT character_items_pkey PRIMARY KEY (id);


--
-- Name: character_skills character_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_pkey PRIMARY KEY (character_id, skill_id);


--
-- Name: character_stat_values character_stat_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_stat_values
    ADD CONSTRAINT character_stat_values_pkey PRIMARY KEY (character_id, stat_code);


--
-- Name: character_talents character_talents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_talents
    ADD CONSTRAINT character_talents_pkey PRIMARY KEY (character_id, talent_id);


--
-- Name: character_weapons character_weapons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_weapons
    ADD CONSTRAINT character_weapons_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: items items_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_name_key UNIQUE (name);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: session_notes session_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_code_key UNIQUE (code);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: skills skills_name_specialization_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_name_specialization_key UNIQUE (name, specialization);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: static_stats static_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.static_stats
    ADD CONSTRAINT static_stats_pkey PRIMARY KEY (code);


--
-- Name: talents talents_name_specialization_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talents
    ADD CONSTRAINT talents_name_specialization_key UNIQUE (name, specialization);


--
-- Name: talents talents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talents
    ADD CONSTRAINT talents_pkey PRIMARY KEY (id);


--
-- Name: users_session users_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_session
    ADD CONSTRAINT users_session_pkey PRIMARY KEY (session_id, user_id);


--
-- Name: weapon_attribute_mappings weapon_attribute_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_attribute_mappings
    ADD CONSTRAINT weapon_attribute_mappings_pkey PRIMARY KEY (weapon_id, attribute_id);


--
-- Name: weapon_attributes weapon_attributes_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_attributes
    ADD CONSTRAINT weapon_attributes_name_key UNIQUE (name);


--
-- Name: weapon_attributes weapon_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_attributes
    ADD CONSTRAINT weapon_attributes_pkey PRIMARY KEY (id);


--
-- Name: weapons weapons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_pkey PRIMARY KEY (id);


--
-- Name: armors_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX armors_name_key ON public.armors USING btree (name);


--
-- Name: session_notes_fts_weighted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_notes_fts_weighted_idx ON public.session_notes USING gin (fts_weighted);


--
-- Name: session_notes_session_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_notes_session_created_idx ON public.session_notes USING btree (session_id, created_at DESC);


--
-- Name: weapons_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX weapons_name_key ON public.weapons USING btree (name);


--
-- Name: notifications delete_old_notifications_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER delete_old_notifications_trigger AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.delete_old_notifications();


--
-- Name: career_paths career_paths_from_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_paths
    ADD CONSTRAINT career_paths_from_career_id_fkey FOREIGN KEY (from_career_id) REFERENCES public.careers(id) ON DELETE CASCADE;


--
-- Name: career_paths career_paths_to_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_paths
    ADD CONSTRAINT career_paths_to_career_id_fkey FOREIGN KEY (to_career_id) REFERENCES public.careers(id) ON DELETE CASCADE;


--
-- Name: character_armors character_armors_armor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_armors
    ADD CONSTRAINT character_armors_armor_id_fkey FOREIGN KEY (armor_id) REFERENCES public.armors(id) ON DELETE RESTRICT;


--
-- Name: character_armors character_armors_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_armors
    ADD CONSTRAINT character_armors_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_items character_items_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_items
    ADD CONSTRAINT character_items_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_items character_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_items
    ADD CONSTRAINT character_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


--
-- Name: character_skills character_skills_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_skills character_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_skills
    ADD CONSTRAINT character_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: character_stat_values character_stat_values_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_stat_values
    ADD CONSTRAINT character_stat_values_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_stat_values character_stat_values_stat_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_stat_values
    ADD CONSTRAINT character_stat_values_stat_code_fkey FOREIGN KEY (stat_code) REFERENCES public.static_stats(code);


--
-- Name: character_talents character_talents_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_talents
    ADD CONSTRAINT character_talents_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_talents character_talents_talent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_talents
    ADD CONSTRAINT character_talents_talent_id_fkey FOREIGN KEY (talent_id) REFERENCES public.talents(id) ON DELETE CASCADE;


--
-- Name: character_weapons character_weapons_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_weapons
    ADD CONSTRAINT character_weapons_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: character_weapons character_weapons_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.character_weapons
    ADD CONSTRAINT character_weapons_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON DELETE RESTRICT;


--
-- Name: characters characters_career_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_career_id_fkey FOREIGN KEY (career_id) REFERENCES public.careers(id);


--
-- Name: characters characters_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_receiver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_receiver_user_id_fkey FOREIGN KEY (receiver_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: session_notes session_notes_author_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: session_notes session_notes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_mj_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_mj_id_fkey FOREIGN KEY (mj_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: skills skills_stat_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_stat_code_fkey FOREIGN KEY (stat_code) REFERENCES public.static_stats(code);


--
-- Name: users_session users_session_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_session
    ADD CONSTRAINT users_session_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: users_session users_session_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_session
    ADD CONSTRAINT users_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: weapon_attribute_mappings weapon_attribute_mappings_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_attribute_mappings
    ADD CONSTRAINT weapon_attribute_mappings_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.weapon_attributes(id) ON DELETE CASCADE;


--
-- Name: weapon_attribute_mappings weapon_attribute_mappings_weapon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weapon_attribute_mappings
    ADD CONSTRAINT weapon_attribute_mappings_weapon_id_fkey FOREIGN KEY (weapon_id) REFERENCES public.weapons(id) ON DELETE CASCADE;


--
-- Name: armors Admin can modify armors.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify armors." ON public.armors USING ((auth.role() = 'service_role'::text));


--
-- Name: career_paths Admin can modify career_paths.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify career_paths." ON public.career_paths USING ((auth.role() = 'service_role'::text));


--
-- Name: careers Admin can modify careers.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify careers." ON public.careers USING ((auth.role() = 'service_role'::text));


--
-- Name: items Admin can modify items.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify items." ON public.items USING ((auth.role() = 'service_role'::text));


--
-- Name: skills Admin can modify skills.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify skills." ON public.skills USING ((auth.role() = 'service_role'::text));


--
-- Name: static_stats Admin can modify static_stats.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify static_stats." ON public.static_stats USING ((auth.role() = 'service_role'::text));


--
-- Name: talents Admin can modify talents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify talents." ON public.talents USING ((auth.role() = 'service_role'::text));


--
-- Name: weapon_attributes Admin can modify weapon_attributes.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify weapon_attributes." ON public.weapon_attributes USING ((auth.role() = 'service_role'::text));


--
-- Name: weapons Admin can modify weapons.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can modify weapons." ON public.weapons USING ((auth.role() = 'service_role'::text));


--
-- Name: items Authenticated can read items.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read items." ON public.items FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: session_notes Authors or MJ can delete session_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors or MJ can delete session_notes" ON public.session_notes FOR DELETE TO authenticated USING (((author_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.sessions s
  WHERE ((s.id = session_notes.session_id) AND (s.mj_id = auth.uid()))))));


--
-- Name: session_notes Authors or MJ can update session_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors or MJ can update session_notes" ON public.session_notes FOR UPDATE TO authenticated USING (((author_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.sessions s
  WHERE ((s.id = session_notes.session_id) AND (s.mj_id = auth.uid())))))) WITH CHECK (((COALESCE(length(TRIM(BOTH FROM content_text)), 0) > 0) AND ((author_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.sessions s
  WHERE ((s.id = session_notes.session_id) AND (s.mj_id = auth.uid())))))));


--
-- Name: armors Everyone can read armors.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read armors." ON public.armors FOR SELECT TO authenticated USING (true);


--
-- Name: career_paths Everyone can read career_paths.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read career_paths." ON public.career_paths FOR SELECT USING (true);


--
-- Name: careers Everyone can read careers.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read careers." ON public.careers FOR SELECT USING (true);


--
-- Name: skills Everyone can read skills.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read skills." ON public.skills FOR SELECT USING (true);


--
-- Name: static_stats Everyone can read static_stats.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read static_stats." ON public.static_stats FOR SELECT USING (true);


--
-- Name: talents Everyone can read talents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read talents." ON public.talents FOR SELECT USING (true);


--
-- Name: weapon_attributes Everyone can read weapon_attributes.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read weapon_attributes." ON public.weapon_attributes FOR SELECT USING (true);


--
-- Name: weapons Everyone can read weapons.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read weapons." ON public.weapons FOR SELECT TO authenticated USING (true);


--
-- Name: users_session MJ can create users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "MJ can create users_session." ON public.users_session FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sessions
  WHERE ((sessions.id = users_session.session_id) AND (sessions.mj_id = auth.uid())))));


--
-- Name: users_session MJ can delete users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "MJ can delete users_session." ON public.users_session FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sessions
  WHERE ((sessions.id = users_session.session_id) AND (sessions.mj_id = auth.uid())))));


--
-- Name: session_notes MJ can read session_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "MJ can read session_notes" ON public.session_notes FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sessions s
  WHERE ((s.id = session_notes.session_id) AND (s.mj_id = auth.uid())))));


--
-- Name: users_session MJ can read users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "MJ can read users_session." ON public.users_session FOR SELECT TO authenticated USING (public.is_session_mj(session_id));


--
-- Name: users_session MJ can update users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "MJ can update users_session." ON public.users_session FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sessions
  WHERE ((sessions.id = users_session.session_id) AND (sessions.mj_id = auth.uid())))));


--
-- Name: sessions MJs can update own sessions.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "MJs can update own sessions." ON public.sessions FOR UPDATE TO authenticated USING ((auth.uid() = mj_id));


--
-- Name: sessions Player can read own sessions.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Player can read own sessions." ON public.sessions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.session_id = sessions.id) AND (characters.user_id = auth.uid())))));


--
-- Name: session_notes Players can read visible session_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Players can read visible session_notes" ON public.session_notes FOR SELECT TO authenticated USING (((is_visible = true) AND (EXISTS ( SELECT 1
   FROM public.users_session us
  WHERE ((us.session_id = session_notes.session_id) AND (us.user_id = auth.uid()) AND (us.active = true))))));


--
-- Name: session_notes Session members can insert session_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Session members can insert session_notes" ON public.session_notes FOR INSERT TO authenticated WITH CHECK (((auth.uid() IS NOT NULL) AND (author_user_id = auth.uid()) AND (COALESCE(length(TRIM(BOTH FROM content_text)), 0) > 0) AND (EXISTS ( SELECT 1
   FROM (public.users_session us
     JOIN public.sessions s ON ((s.id = us.session_id)))
  WHERE ((us.session_id = session_notes.session_id) AND (us.user_id = auth.uid()) AND (us.active = true) AND (s.is_archived = false))))));


--
-- Name: users_session User can create users_session only when user is session MJ; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can create users_session only when user is session MJ" ON public.users_session FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.sessions s
  WHERE ((s.id = users_session.session_id) AND (s.mj_id = auth.uid()))))));


--
-- Name: users_session User can delete own users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can delete own users_session." ON public.users_session FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: users_session User can read own users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can read own users_session." ON public.users_session FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: character_armors Users can create character_armors.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create character_armors." ON public.character_armors FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_armors.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_items Users can create character_items.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create character_items." ON public.character_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_items.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_skills Users can create character_skills.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create character_skills." ON public.character_skills FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_skills.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_stat_values Users can create character_stat_values.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create character_stat_values." ON public.character_stat_values FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_stat_values.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_talents Users can create character_talents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create character_talents." ON public.character_talents FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_talents.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_weapons Users can create character_weapons.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create character_weapons." ON public.character_weapons FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_weapons.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: characters Users can create characters.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create characters." ON public.characters FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: items Users can create items.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create items." ON public.items FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: notifications Users can create notifications.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create notifications." ON public.notifications FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_user_id) OR (sender_user_id IS NULL)));


--
-- Name: sessions Users can create sessions.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create sessions." ON public.sessions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = mj_id));


--
-- Name: character_armors Users can delete own character_armors.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own character_armors." ON public.character_armors FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_armors.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_items Users can delete own character_items.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own character_items." ON public.character_items FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_items.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_skills Users can delete own character_skills.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own character_skills." ON public.character_skills FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_skills.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_stat_values Users can delete own character_stat_values.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own character_stat_values." ON public.character_stat_values FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_stat_values.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_talents Users can delete own character_talents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own character_talents." ON public.character_talents FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_talents.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_weapons Users can delete own character_weapons.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own character_weapons." ON public.character_weapons FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_weapons.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: notifications Users can delete own notifications.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notifications." ON public.notifications FOR DELETE TO authenticated USING ((auth.uid() = receiver_user_id));


--
-- Name: profiles Users can insert their own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = id));


--
-- Name: character_armors Users can read character_armors in accessible sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read character_armors in accessible sessions" ON public.character_armors FOR SELECT TO authenticated USING (public.is_character_visible(character_id));


--
-- Name: character_items Users can read character_items in accessible sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read character_items in accessible sessions" ON public.character_items FOR SELECT TO authenticated USING (public.is_character_visible(character_id));


--
-- Name: character_skills Users can read character_skills in accessible sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read character_skills in accessible sessions" ON public.character_skills FOR SELECT TO authenticated USING (public.is_character_visible(character_id));


--
-- Name: character_stat_values Users can read character_stat_values in accessible sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read character_stat_values in accessible sessions" ON public.character_stat_values FOR SELECT TO authenticated USING (public.is_character_visible(character_id));


--
-- Name: character_talents Users can read character_talents in accessible sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read character_talents in accessible sessions" ON public.character_talents FOR SELECT TO authenticated USING (public.is_character_visible(character_id));


--
-- Name: character_weapons Users can read character_weapons in accessible sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read character_weapons in accessible sessions" ON public.character_weapons FOR SELECT TO authenticated USING (public.is_character_visible(character_id));


--
-- Name: characters Users can read characters in joined sessions.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read characters in joined sessions." ON public.characters FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.users_session us
  WHERE ((us.session_id = characters.session_id) AND (us.user_id = auth.uid()) AND (us.active = true))))));


--
-- Name: sessions Users can read joined sessions via users_session.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read joined sessions via users_session." ON public.sessions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users_session
  WHERE ((users_session.session_id = sessions.id) AND (users_session.user_id = auth.uid()) AND (users_session.active = true)))));


--
-- Name: notifications Users can read own notifications.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own notifications." ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = receiver_user_id));


--
-- Name: profiles Users can read profiles in shared sessions or self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read profiles in shared sessions or self" ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.users_session me
     JOIN public.users_session other ON ((other.session_id = me.session_id)))
  WHERE ((me.user_id = auth.uid()) AND (other.user_id = profiles.id) AND (me.active = true) AND (other.active = true))))));


--
-- Name: notifications Users can read sent notifications.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read sent notifications." ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = sender_user_id));


--
-- Name: character_armors Users can update own character_armors.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own character_armors." ON public.character_armors FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_armors.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_items Users can update own character_items.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own character_items." ON public.character_items FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_items.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_skills Users can update own character_skills.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own character_skills." ON public.character_skills FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_skills.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_stat_values Users can update own character_stat_values.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own character_stat_values." ON public.character_stat_values FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_stat_values.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_talents Users can update own character_talents.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own character_talents." ON public.character_talents FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_talents.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: character_weapons Users can update own character_weapons.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own character_weapons." ON public.character_weapons FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.id = character_weapons.character_id) AND (characters.user_id = auth.uid())))));


--
-- Name: characters Users can update own characters.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own characters." ON public.characters FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications." ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = receiver_user_id));


--
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ((( SELECT auth.uid() AS uid) = id));


--
-- Name: armors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.armors ENABLE ROW LEVEL SECURITY;

--
-- Name: career_paths; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;

--
-- Name: careers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

--
-- Name: character_armors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_armors ENABLE ROW LEVEL SECURITY;

--
-- Name: character_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_items ENABLE ROW LEVEL SECURITY;

--
-- Name: character_skills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_skills ENABLE ROW LEVEL SECURITY;

--
-- Name: character_stat_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_stat_values ENABLE ROW LEVEL SECURITY;

--
-- Name: character_talents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_talents ENABLE ROW LEVEL SECURITY;

--
-- Name: character_weapons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.character_weapons ENABLE ROW LEVEL SECURITY;

--
-- Name: characters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

--
-- Name: items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: session_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: skills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

--
-- Name: static_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.static_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: talents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;

--
-- Name: users_session; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users_session ENABLE ROW LEVEL SECURITY;

--
-- Name: weapon_attribute_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weapon_attribute_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: weapon_attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weapon_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: weapons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weapons ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION get_email_by_username(search_username text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_email_by_username(search_username text) TO anon;
GRANT ALL ON FUNCTION public.get_email_by_username(search_username text) TO authenticated;


--
-- Name: FUNCTION get_session_id_by_code(target_code text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_session_id_by_code(target_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_session_id_by_code(target_code text) TO authenticated;


--
-- Name: FUNCTION get_session_owner_for_request(target_session_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_session_owner_for_request(target_session_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_session_owner_for_request(target_session_id uuid) TO authenticated;


--
-- Name: FUNCTION is_character_visible(target_character_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_character_visible(target_character_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_character_visible(target_character_id uuid) TO authenticated;


--
-- Name: FUNCTION is_session_mj(target_session_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_session_mj(target_session_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_session_mj(target_session_id uuid) TO authenticated;


--
-- Name: FUNCTION search_session_notes(target_session_id uuid, search_text text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.search_session_notes(target_session_id uuid, search_text text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.search_session_notes(target_session_id uuid, search_text text) TO authenticated;


--
-- Name: TABLE armors; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.armors TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.armors TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.armors TO service_role;


--
-- Name: TABLE career_paths; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.career_paths TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.career_paths TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.career_paths TO service_role;


--
-- Name: TABLE careers; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.careers TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.careers TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.careers TO service_role;


--
-- Name: TABLE character_armors; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_armors TO anon;
GRANT ALL ON TABLE public.character_armors TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_armors TO service_role;


--
-- Name: TABLE character_items; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_items TO anon;
GRANT ALL ON TABLE public.character_items TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_items TO service_role;


--
-- Name: TABLE character_skills; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_skills TO anon;
GRANT ALL ON TABLE public.character_skills TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_skills TO service_role;


--
-- Name: TABLE character_stat_values; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_stat_values TO anon;
GRANT ALL ON TABLE public.character_stat_values TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_stat_values TO service_role;


--
-- Name: TABLE character_talents; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_talents TO anon;
GRANT ALL ON TABLE public.character_talents TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_talents TO service_role;


--
-- Name: TABLE character_weapons; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_weapons TO anon;
GRANT ALL ON TABLE public.character_weapons TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.character_weapons TO service_role;


--
-- Name: TABLE characters; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.characters TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.characters TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.characters TO service_role;


--
-- Name: TABLE items; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.items TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.items TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.items TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.notifications TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.profiles TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.profiles TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.profiles TO service_role;


--
-- Name: TABLE session_notes; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.session_notes TO anon;
GRANT ALL ON TABLE public.session_notes TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.session_notes TO service_role;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.sessions TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.sessions TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.sessions TO service_role;


--
-- Name: TABLE skills; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.skills TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.skills TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.skills TO service_role;


--
-- Name: TABLE static_stats; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.static_stats TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.static_stats TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.static_stats TO service_role;


--
-- Name: TABLE talents; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.talents TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.talents TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.talents TO service_role;


--
-- Name: TABLE users_session; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.users_session TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.users_session TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.users_session TO service_role;


--
-- Name: TABLE weapon_attribute_mappings; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapon_attribute_mappings TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapon_attribute_mappings TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapon_attribute_mappings TO service_role;


--
-- Name: TABLE weapon_attributes; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapon_attributes TO anon;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapon_attributes TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapon_attributes TO service_role;


--
-- Name: TABLE weapons; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapons TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapons TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.weapons TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict Kxh1dVmLtMY8honbAuKhvpb1a9hOLcDBelC2c4m1UOsaHKEvioq4DSzyXu3MtLa