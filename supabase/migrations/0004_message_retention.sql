-- =====================================================================
-- Message retention: messages are kept for 7 days in every chat (rolling).
-- Matches and requests stay; only message rows older than 7 days go.
-- Also schedules the spec's recommended expiry of past pending requests.
-- =====================================================================
create extension if not exists pg_cron with schema pg_catalog;

-- The server decides when a message was sent: a client-supplied created_at could
-- dodge the purge (a future date) and read_at could fake a read receipt.
-- clock_timestamp() also keeps messages in one transaction strictly ordered.
create function messages_server_fields() returns trigger language plpgsql as $$
begin
  new.created_at := clock_timestamp();
  new.read_at := null;
  return new;
end $$;
create trigger messages_server_fields before insert on messages
  for each row execute function messages_server_fields();

create function purge_old_messages() returns void
language sql security definer set search_path = public as $$
  delete from messages where created_at < now() - interval '7 days';
$$;

-- Housekeeping only: not callable by users.
revoke execute on function purge_old_messages() from public, anon, authenticated;

-- Hourly at :15; requests every 30 minutes (from the 0001 comments).
select cron.schedule('purge-old-messages', '15 * * * *', 'select public.purge_old_messages()');
select cron.schedule('expire-requests', '*/30 * * * *', 'select public.expire_stale_requests()');
