import { query } from "./db";
import { blankProfile } from "./defaults";
import { personId } from "./people";
import type {
  CheckIn,
  Conversation,
  FollowUp,
  HearthState,
  LiveAlert,
  MemoryFact,
  Person,
  Profile,
  TranscriptLine,
} from "./types";

// All Hearth data lives in Neon Postgres (schema: db/schema.sql). Nothing here is sample data.

interface SettingsRow {
  profile: Profile;
  configured: boolean;
  call_active: boolean;
  calm_mode: boolean;
}

async function getSettings(): Promise<SettingsRow> {
  const [row] = await query<SettingsRow>("select profile, configured, call_active, calm_mode from settings where id = 1");
  return row ?? { profile: blankProfile, configured: false, call_active: false, calm_mode: false };
}

export async function getProfile(): Promise<{ profile: Profile; configured: boolean }> {
  const { profile, configured } = await getSettings();
  return { profile, configured };
}

/** Everything the family dashboard and the check-in call need. Never includes anyone's private memory. */
export async function getDashboard(): Promise<HearthState> {
  const [settings, checkins, alerts] = await Promise.all([
    getSettings(),
    query<{ data: CheckIn }>("select data from checkins order by created_at asc"),
    query<{ id: string; at: Date; reason: string; quote: string; translation: string | null }>(
      "select id, at, reason, quote, translation from alerts order by at desc",
    ),
  ]);
  return {
    profile: settings.profile,
    configured: settings.configured,
    callActive: settings.call_active,
    calmMode: settings.calm_mode,
    checkins: checkins.map((r) => r.data),
    liveAlerts: alerts.map((a): LiveAlert => ({ ...a, at: new Date(a.at).toISOString() })),
  };
}

/** Saves the setup page. Switching to a different person starts their dashboard fresh. */
export async function saveProfile(profile: Profile) {
  const current = await getSettings();
  if (current.configured && personId(current.profile.name) !== personId(profile.name)) {
    await clearCheckIns();
  }
  await query(
    `insert into settings (id, profile, configured) values (1, $1, true)
     on conflict (id) do update set profile = excluded.profile, configured = true, updated_at = now()`,
    [JSON.stringify(profile)],
  );
}

export async function setCallStatus(patch: { callActive?: boolean; calmMode?: boolean }) {
  await query(
    `insert into settings (id, profile, call_active, calm_mode) values (1, $1, coalesce($2, false), coalesce($3, false))
     on conflict (id) do update set
       call_active = coalesce($2, settings.call_active),
       calm_mode = coalesce($3, settings.calm_mode)`,
    [JSON.stringify(blankProfile), patch.callActive ?? null, patch.calmMode ?? null],
  );
}

/** Clears the family dashboard (check-ins and alerts). Memory is managed on the memory page. */
export async function clearCheckIns() {
  await query("delete from checkins");
  await query("delete from alerts");
  await query("update settings set call_active = false, calm_mode = false where id = 1");
}

export async function addCheckIn(checkIn: CheckIn) {
  await query("insert into checkins (id, data) values ($1, $2) on conflict (id) do update set data = excluded.data", [
    checkIn.id,
    JSON.stringify(checkIn),
  ]);
}

export async function addLiveAlert(alert: LiveAlert) {
  await query("insert into alerts (id, at, reason, quote, translation) values ($1, $2, $3, $4, $5)", [
    alert.id,
    alert.at,
    alert.reason,
    alert.quote,
    alert.translation ?? null,
  ]);
}

// ---- People and shared memory ----

interface PersonRow {
  id: string;
  name: string;
  summary: string;
  facts: MemoryFact[];
  follow_ups: FollowUp[];
}

interface ConversationRow {
  id: string;
  companion_id: string;
  at: Date;
  duration_sec: number;
  title: string;
  summary: string;
  quote: string;
  urgent: boolean;
  transcript: TranscriptLine[];
}

export async function getPersonById(id: string): Promise<Person | undefined> {
  const [row] = await query<PersonRow>("select id, name, summary, facts, follow_ups from people where id = $1", [id]);
  if (!row) return undefined;
  const conversations = await query<ConversationRow>(
    `select id, companion_id, at, duration_sec, title, summary, quote, urgent, transcript
     from conversations where person_id = $1 order by at asc`,
    [id],
  );
  return {
    id: row.id,
    name: row.name,
    summary: row.summary,
    facts: row.facts,
    followUps: row.follow_ups,
    conversations: conversations.map(
      (c): Conversation => ({
        id: c.id,
        companionId: c.companion_id,
        at: new Date(c.at).toISOString(),
        durationSec: c.duration_sec,
        title: c.title,
        summary: c.summary,
        quote: c.quote,
        urgent: c.urgent,
        transcript: c.transcript,
      }),
    ),
  };
}

export function getPerson(name: string) {
  return getPersonById(personId(name));
}

/** Finds or creates the person with this first name. */
export async function ensurePerson(name: string): Promise<Person> {
  const id = personId(name);
  await query("insert into people (id, name) values ($1, $2) on conflict (id) do nothing", [id, name.trim()]);
  return (await getPersonById(id))!;
}

export async function listPeople() {
  return query<{ id: string; name: string; conversations: number; last_at: Date | null }>(
    `select p.id, p.name, count(c.id)::int as conversations, max(c.at) as last_at
     from people p left join conversations c on c.person_id = p.id
     group by p.id order by max(c.at) desc nulls last`,
  );
}

export async function addConversation(person: Person, c: Conversation) {
  await query(
    `insert into conversations (id, person_id, companion_id, at, duration_sec, title, summary, quote, urgent, transcript)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [c.id, person.id, c.companionId, c.at, c.durationSec, c.title, c.summary, c.quote, c.urgent, JSON.stringify(c.transcript)],
  );
  person.conversations = [...person.conversations, c];
}

/** Saves what the memory agent learned. */
export async function savePersonMemory(person: Person) {
  await query("update people set summary = $2, facts = $3, follow_ups = $4, updated_at = now() where id = $1", [
    person.id,
    person.summary,
    JSON.stringify(person.facts),
    JSON.stringify(person.followUps),
  ]);
}

export async function forgetFact(id: string, factId: string) {
  const person = await getPersonById(id);
  if (!person) return;
  person.facts = person.facts.filter((f) => f.id !== factId);
  await savePersonMemory(person);
}

export async function forgetPerson(id: string) {
  await query("delete from people where id = $1", [id]);
}
