-- ============================================
-- PostPro Planner — Seed Data
-- ============================================
-- Plak dit in de Supabase SQL Editor NADAT:
-- 1. De migration (001_initial_schema.sql) is gedraaid
-- 2. Je een account hebt aangemaakt (koen@creativebros.nl)
-- 3. De organisatie "Team5pm" al bestaat
--
-- Dit script voegt toe:
-- - 4 extra teamleden (dummy auth users + profiles)
-- - 3 projecten met videos en taken
-- - Time entries en feedback
-- - 1 share link
-- ============================================

-- Stap 0: Haal je eigen user-ID en org-ID op
DO $$
DECLARE
  v_org_id uuid;
  v_koen_id uuid;
  v_jordan_id uuid := gen_random_uuid();
  v_daniel_id uuid := gen_random_uuid();
  v_jessica_id uuid := gen_random_uuid();
  v_timothy_id uuid := gen_random_uuid();
  -- Projecten
  v_proj_ewc uuid := gen_random_uuid();
  v_proj_arcade uuid := gen_random_uuid();
  v_proj_nike uuid := gen_random_uuid();
  -- Videos
  v_vid_ewc1 uuid := gen_random_uuid();
  v_vid_ewc2 uuid := gen_random_uuid();
  v_vid_ewc3 uuid := gen_random_uuid();
  v_vid_arcade1 uuid := gen_random_uuid();
  v_vid_arcade2 uuid := gen_random_uuid();
  v_vid_nike1 uuid := gen_random_uuid();
  -- Taken
  v_task uuid;
  v_task1 uuid := gen_random_uuid();
  v_task2 uuid := gen_random_uuid();
  v_task3 uuid := gen_random_uuid();
  v_task4 uuid := gen_random_uuid();
  v_task5 uuid := gen_random_uuid();
  v_task6 uuid := gen_random_uuid();
  v_task7 uuid := gen_random_uuid();
  v_task8 uuid := gen_random_uuid();
  v_task9 uuid := gen_random_uuid();
  v_task10 uuid := gen_random_uuid();
  v_task11 uuid := gen_random_uuid();
  v_task12 uuid := gen_random_uuid();
  v_task13 uuid := gen_random_uuid();
  v_task14 uuid := gen_random_uuid();
  v_task15 uuid := gen_random_uuid();
  v_task16 uuid := gen_random_uuid();
  v_task17 uuid := gen_random_uuid();
  v_task18 uuid := gen_random_uuid();
  v_task19 uuid := gen_random_uuid();
  v_task20 uuid := gen_random_uuid();
BEGIN
  -- Haal org_id op
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'team5pm';
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organisatie team5pm niet gevonden. Draai eerst de migration + INSERT INTO organizations.';
  END IF;

  -- Haal jouw user ID op
  SELECT id INTO v_koen_id FROM auth.users WHERE email = 'koen@creativebros.nl';
  IF v_koen_id IS NULL THEN
    RAISE EXCEPTION 'User koen@creativebros.nl niet gevonden. Maak eerst een account aan.';
  END IF;

  -- Maak jouw profiel admin (als dat nog niet zo is)
  UPDATE public.profiles SET role = 'admin', name = 'Koen' WHERE id = v_koen_id;

  -- ============================================
  -- DUMMY TEAMLEDEN (direct in profiles, geen echte auth users nodig voor seed)
  -- ============================================
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
  VALUES
    (v_jordan_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jordan@team5pm.com', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', ''),
    (v_daniel_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'daniel@team5pm.com', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', ''),
    (v_jessica_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jessica@team5pm.com', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', ''),
    (v_timothy_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'timothy@team5pm.com', crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Profiles voor teamleden (trigger zou dit normaal doen, maar we forceren het hier)
  INSERT INTO public.profiles (id, org_id, name, role, hourly_rate) VALUES
    (v_jordan_id, v_org_id, 'Jordan', 'editor', 65.00),
    (v_daniel_id, v_org_id, 'Daniel', 'editor', 65.00),
    (v_jessica_id, v_org_id, 'Jessica', 'planner', 75.00),
    (v_timothy_id, v_org_id, 'Timothy', 'editor', 60.00)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, hourly_rate = EXCLUDED.hourly_rate;

  -- ============================================
  -- PROJECT 1: EWC Batch 3 (actief, lopend)
  -- ============================================
  INSERT INTO public.projects (id, org_id, name, client_name, status, start_date, end_date, total_budget_hours, total_budget_euros, color, created_by)
  VALUES (v_proj_ewc, v_org_id, 'EWC Batch 3', 'EWC', 'active', '2026-03-17', '2026-04-11', 120, 8400, '#f5c518', v_koen_id);

  -- Project members
  INSERT INTO public.project_members (project_id, user_id, role) VALUES
    (v_proj_ewc, v_koen_id, 'owner'),
    (v_proj_ewc, v_jordan_id, 'editor'),
    (v_proj_ewc, v_daniel_id, 'editor'),
    (v_proj_ewc, v_jessica_id, 'editor');

  -- Videos EWC
  INSERT INTO public.videos (id, project_id, name, format, sort_order, budget_hours) VALUES
    (v_vid_ewc1, v_proj_ewc, 'Video 1 · Brand Story', 'landscape', 0, 40),
    (v_vid_ewc2, v_proj_ewc, 'Video 2 · 20''''', 'portrait', 1, 24),
    (v_vid_ewc3, v_proj_ewc, 'Video 3 · Social Cut', 'square', 2, 16);

  -- Taken EWC Video 1
  INSERT INTO public.tasks (id, video_id, project_id, name, phase, assigned_to, start_date, end_date, status, budgeted_hours, sort_order, version_label) VALUES
    (v_task1, v_vid_ewc1, v_proj_ewc, 'V0.5 + sync', 'editing', v_jordan_id, '2026-03-17', '2026-03-18', 'done', 6, 0, 'V0.5'),
    (v_task2, v_vid_ewc1, v_proj_ewc, 'feedback internal', 'internal_review', v_jessica_id, '2026-03-19', '2026-03-19', 'done', 2, 1, NULL),
    (v_task3, v_vid_ewc1, v_proj_ewc, 'V1 edit', 'editing', v_jordan_id, '2026-03-20', '2026-03-21', 'done', 8, 2, 'V1'),
    (v_task4, v_vid_ewc1, v_proj_ewc, 'klant feedback V1', 'client_feedback', NULL, '2026-03-24', '2026-03-26', 'in_progress', 0, 3, 'V1'),
    (v_task5, v_vid_ewc1, v_proj_ewc, 'V1.1 verwerking', 'editing', v_jordan_id, '2026-03-27', '2026-03-28', 'todo', 4, 4, 'V1.1'),
    (v_task6, v_vid_ewc1, v_proj_ewc, 'grading', 'grading', v_daniel_id, '2026-03-31', '2026-03-31', 'todo', 3, 5, 'FINAL'),
    (v_task7, v_vid_ewc1, v_proj_ewc, 'delivery', 'delivery', v_koen_id, '2026-04-01', '2026-04-01', 'todo', 1, 6, 'FINAL');

  -- Taken EWC Video 2
  INSERT INTO public.tasks (id, video_id, project_id, name, phase, assigned_to, start_date, end_date, status, budgeted_hours, sort_order, version_label) VALUES
    (v_task8, v_vid_ewc2, v_proj_ewc, 'V0.5 + sync', 'editing', v_daniel_id, '2026-03-19', '2026-03-20', 'done', 4, 0, 'V0.5'),
    (v_task9, v_vid_ewc2, v_proj_ewc, 'feedback internal', 'internal_review', v_jessica_id, '2026-03-21', '2026-03-21', 'done', 1, 1, NULL),
    (v_task10, v_vid_ewc2, v_proj_ewc, 'V1 edit', 'editing', v_daniel_id, '2026-03-24', '2026-03-25', 'in_progress', 6, 2, 'V1'),
    (v_task11, v_vid_ewc2, v_proj_ewc, 'klant feedback', 'client_feedback', NULL, '2026-03-26', '2026-03-28', 'todo', 0, 3, 'V1'),
    (v_task12, v_vid_ewc2, v_proj_ewc, 'grading', 'grading', v_daniel_id, '2026-04-01', '2026-04-01', 'todo', 2, 4, 'FINAL');

  -- Taken EWC Video 3
  INSERT INTO public.tasks (id, video_id, project_id, name, phase, assigned_to, start_date, end_date, status, budgeted_hours, sort_order, version_label) VALUES
    (v_task13, v_vid_ewc3, v_proj_ewc, 'V0.5 rough cut', 'editing', v_timothy_id, '2026-03-24', '2026-03-25', 'in_progress', 4, 0, 'V0.5'),
    (v_task14, v_vid_ewc3, v_proj_ewc, 'V1 edit', 'editing', v_timothy_id, '2026-03-27', '2026-03-28', 'todo', 4, 1, 'V1'),
    (v_task15, v_vid_ewc3, v_proj_ewc, 'grading + delivery', 'grading', v_daniel_id, '2026-04-02', '2026-04-02', 'todo', 2, 2, 'FINAL');

  -- ============================================
  -- PROJECT 2: Arcade Q1 Campaign (actief)
  -- ============================================
  INSERT INTO public.projects (id, org_id, name, client_name, status, start_date, end_date, total_budget_hours, total_budget_euros, color, created_by)
  VALUES (v_proj_arcade, v_org_id, 'Arcade Q1 Campaign', 'Arcade', 'active', '2026-03-10', '2026-04-04', 80, 5600, '#8b5cf6', v_koen_id);

  INSERT INTO public.project_members (project_id, user_id, role) VALUES
    (v_proj_arcade, v_koen_id, 'owner'),
    (v_proj_arcade, v_daniel_id, 'editor'),
    (v_proj_arcade, v_timothy_id, 'editor');

  INSERT INTO public.videos (id, project_id, name, format, sort_order, budget_hours) VALUES
    (v_vid_arcade1, v_proj_arcade, 'Hero Video · 60s', 'landscape', 0, 48),
    (v_vid_arcade2, v_proj_arcade, 'Social Cutdown · 15s', 'portrait', 1, 16);

  INSERT INTO public.tasks (id, video_id, project_id, name, phase, assigned_to, start_date, end_date, status, budgeted_hours, sort_order, version_label) VALUES
    (v_task16, v_vid_arcade1, v_proj_arcade, 'V1 edit', 'editing', v_daniel_id, '2026-03-10', '2026-03-14', 'done', 16, 0, 'V1'),
    (v_task17, v_vid_arcade1, v_proj_arcade, 'klant review', 'client_feedback', NULL, '2026-03-17', '2026-03-21', 'done', 0, 1, 'V1'),
    (v_task18, v_vid_arcade1, v_proj_arcade, 'V2 final + grading', 'grading', v_daniel_id, '2026-03-24', '2026-03-27', 'in_progress', 12, 2, 'V2'),
    (v_task19, v_vid_arcade2, v_proj_arcade, 'cutdown edit', 'editing', v_timothy_id, '2026-03-25', '2026-03-26', 'in_progress', 6, 0, 'V1'),
    (v_task20, v_vid_arcade2, v_proj_arcade, 'delivery', 'delivery', v_koen_id, '2026-03-31', '2026-03-31', 'todo', 1, 1, 'FINAL');

  -- ============================================
  -- PROJECT 3: Nike Summer Drop (afgerond)
  -- ============================================
  INSERT INTO public.projects (id, org_id, name, client_name, status, start_date, end_date, total_budget_hours, total_budget_euros, color, created_by)
  VALUES (v_proj_nike, v_org_id, 'Nike Summer Drop', 'Nike', 'completed', '2026-02-03', '2026-03-07', 60, 4200, '#14b8a6', v_koen_id);

  INSERT INTO public.project_members (project_id, user_id, role) VALUES
    (v_proj_nike, v_koen_id, 'owner'),
    (v_proj_nike, v_jordan_id, 'editor');

  INSERT INTO public.videos (id, project_id, name, format, sort_order, budget_hours) VALUES
    (v_vid_nike1, v_proj_nike, 'Launch Video', 'landscape', 0, 60);

  -- Nike taken (allemaal done)
  INSERT INTO public.tasks (video_id, project_id, name, phase, assigned_to, start_date, end_date, status, budgeted_hours, sort_order, version_label) VALUES
    (v_vid_nike1, v_proj_nike, 'V1 edit', 'editing', v_jordan_id, '2026-02-03', '2026-02-07', 'done', 16, 0, 'V1'),
    (v_vid_nike1, v_proj_nike, 'klant feedback', 'client_feedback', NULL, '2026-02-10', '2026-02-14', 'done', 0, 1, 'V1'),
    (v_vid_nike1, v_proj_nike, 'V2 edit', 'editing', v_jordan_id, '2026-02-17', '2026-02-21', 'done', 12, 2, 'V2'),
    (v_vid_nike1, v_proj_nike, 'grading', 'grading', v_daniel_id, '2026-02-24', '2026-02-25', 'done', 4, 3, 'FINAL'),
    (v_vid_nike1, v_proj_nike, 'delivery', 'delivery', v_koen_id, '2026-02-26', '2026-02-26', 'done', 1, 4, 'FINAL');

  -- ============================================
  -- TIME ENTRIES (realistische uren)
  -- ============================================
  -- EWC Video 1
  INSERT INTO public.time_entries (task_id, user_id, logged_at, hours, note) VALUES
    (v_task1, v_jordan_id, '2026-03-17', 3, 'sync + rough assembly'),
    (v_task1, v_jordan_id, '2026-03-18', 3.5, 'V0.5 afgerond'),
    (v_task2, v_jessica_id, '2026-03-19', 1.5, 'internal review + notities'),
    (v_task3, v_jordan_id, '2026-03-20', 4, 'V1 eerste dag'),
    (v_task3, v_jordan_id, '2026-03-21', 4.5, 'V1 afgerond + export'),
    -- EWC Video 2
    (v_task8, v_daniel_id, '2026-03-19', 2, 'sync + assembly'),
    (v_task8, v_daniel_id, '2026-03-20', 2.5, 'V0.5 klaar'),
    (v_task9, v_jessica_id, '2026-03-21', 1, 'snelle review'),
    (v_task10, v_daniel_id, '2026-03-24', 3, 'V1 in progress'),
    -- EWC Video 3
    (v_task13, v_timothy_id, '2026-03-24', 2, 'rough cut gestart'),
    (v_task13, v_timothy_id, '2026-03-25', 1.5, 'nog bezig'),
    -- Arcade Hero Video
    (v_task16, v_daniel_id, '2026-03-10', 4, 'dag 1 edit'),
    (v_task16, v_daniel_id, '2026-03-11', 4, 'dag 2 edit'),
    (v_task16, v_daniel_id, '2026-03-12', 4, 'dag 3 edit'),
    (v_task16, v_daniel_id, '2026-03-13', 3, 'afwerking'),
    (v_task18, v_daniel_id, '2026-03-24', 4, 'V2 grading gestart'),
    (v_task18, v_daniel_id, '2026-03-25', 3, 'grading vervolg'),
    (v_task19, v_timothy_id, '2026-03-25', 3, 'cutdown eerste versie'),
    -- Taken van Koen (zodat jij ook uren ziet op dashboard)
    (v_task4, v_koen_id, '2026-03-25', 1, 'feedback verzameld van klant'),
    (v_task4, v_koen_id, '2026-03-26', 0.5, 'feedback doorgestuurd');

  -- ============================================
  -- FEEDBACK ENTRIES
  -- ============================================
  INSERT INTO public.feedback_entries (task_id, author_id, content, version) VALUES
    (v_task2, v_jessica_id, 'Timing op 0:32 iets strakker, muziek faden bij interview', 'V0.5'),
    (v_task2, v_koen_id, 'Looks goed, alleen de intro kan 2 sec korter', 'V0.5'),
    (v_task4, v_koen_id, 'Klant wil logo groter in de outro + andere muziek in het midden', 'V1'),
    (v_task9, v_jessica_id, 'Prima, alleen de text overlay op :08 moet wit ipv geel', 'V0.5'),
    (v_task17, v_koen_id, 'Klant is tevreden, kleine kleurcorrectie nodig op shot 3', 'V1');

  -- ============================================
  -- SHARE LINK (voor testen van de publieke pagina)
  -- ============================================
  INSERT INTO public.share_links (project_id, token, created_by, show_hours, show_budget, show_owners, show_internal_feedback, is_active, label)
  VALUES (v_proj_ewc, 'test-share-ewc-batch3-2026', v_koen_id, true, false, true, false, true, 'Klantlink EWC');

  RAISE NOTICE 'Seed data succesvol aangemaakt!';
  RAISE NOTICE 'Je kunt nu inloggen als koen@creativebros.nl (admin)';
  RAISE NOTICE 'Of als jordan@team5pm.com / daniel@team5pm.com / jessica@team5pm.com / timothy@team5pm.com (wachtwoord: testpass123)';
  RAISE NOTICE 'Share link: /share/test-share-ewc-batch3-2026';
END $$;
