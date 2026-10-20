-- =============================================================
-- Crear (o actualizar) el usuario ADMIN del inventario.
-- Ejecutar en: Supabase Dashboard → SQL Editor, DESPUÉS de schema.sql.
--
-- 1. Cambia el correo y la contraseña de abajo.
-- 2. Ejecuta. Si el correo ya existe, actualiza su contraseña y le da rol admin.
-- Para varios admins, ejecútalo una vez por correo.
-- =============================================================
do $$
declare
  v_email    text := 'demo@3rcore.com';     -- ← correo del admin
  v_password text := 'CambiaEstaClave123!'; -- ← contraseña (mínimo 6 caracteres)
  v_user_id  uuid;
begin
  select id into v_user_id from auth.users where email = lower(v_email);

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      lower(v_email), extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text, 'email',
      jsonb_build_object('sub', v_user_id::text, 'email', lower(v_email), 'email_verified', true),
      now(), now(), now()
    );

    raise notice 'Admin creado: %', v_email;
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where id = v_user_id;

    raise notice 'Admin actualizado: %', v_email;
  end if;
end $$;

-- Ver admins:
-- select email, created_at from auth.users where raw_app_meta_data ->> 'role' = 'admin';

-- Quitar el rol admin a alguien:
-- update auth.users set raw_app_meta_data = raw_app_meta_data - 'role' where email = 'correo@ejemplo.com';
