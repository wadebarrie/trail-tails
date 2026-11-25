const RECENT_UNSENT_MS = 48 * 60 * 60 * 1000;

export function splitRecentUnsent<T extends { created_at: string }>(notes: T[]) {
  const cutoff = Date.now() - RECENT_UNSENT_MS;
  return {
    recent: notes.filter((note) => new Date(note.created_at).getTime() >= cutoff),
    older: notes.filter((note) => new Date(note.created_at).getTime() < cutoff),
  };
}
