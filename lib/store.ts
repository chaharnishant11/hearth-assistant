import { profile as seedProfile, seedCheckins } from "./seed";
import type { CheckIn, HearthState, LiveAlert, PersonalMemory, Profile } from "./types";

// In-memory demo store. Kept on globalThis so it survives dev hot reloads.
const g = globalThis as unknown as { __hearth?: HearthState };

function fresh(profile: Profile, sampleHistory: boolean): HearthState {
  return {
    personal: {},
    profile,
    sampleHistory,
    checkins: sampleHistory ? structuredClone(seedCheckins) : [],
    liveAlerts: [],
    callActive: false,
    calmMode: false,
  };
}

export function getState(): HearthState {
  if (!g.__hearth) g.__hearth = fresh(seedProfile, true);
  return g.__hearth;
}

/** Clears calls and alerts but keeps the family's saved profile. */
export function resetState(): HearthState {
  const { profile, sampleHistory } = getState();
  g.__hearth = fresh(profile, sampleHistory);
  return g.__hearth;
}

/** Saves a new profile from the setup page and starts a clean history. */
export function saveProfile(profile: Profile, sampleHistory: boolean): HearthState {
  g.__hearth = fresh(profile, sampleHistory);
  return g.__hearth;
}

export function addCheckIn(checkIn: CheckIn) {
  const state = getState();
  state.checkins = [...state.checkins.filter((c) => c.id !== checkIn.id), checkIn];
}

export function addLiveAlert(alert: LiveAlert) {
  getState().liveAlerts.unshift(alert);
}

export function setCallStatus(patch: Partial<Pick<HearthState, "callActive" | "calmMode">>) {
  Object.assign(getState(), patch);
}

export function getPersonal(companionId: string): PersonalMemory | undefined {
  return getState().personal?.[companionId];
}

export function rememberSession(
  companionId: string,
  userName: string,
  session: { title: string; reflection: string },
  notes: string[],
) {
  const state = getState();
  state.personal ??= {};
  const prev = state.personal[companionId];
  state.personal[companionId] = {
    userName,
    notes: [...(prev?.notes ?? []), ...notes].slice(-12),
    sessions: [...(prev?.sessions ?? []), { at: new Date().toISOString(), ...session }].slice(-5),
  };
}
