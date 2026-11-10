import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

/** drumroll id -> rating -> count */
export type RatingTotals = Record<string, Record<string, number>>;

const DATA_DIR = process.env.DATA_DIR || join(__dirname, "../../data");
const RATINGS_FILE = join(DATA_DIR, "drumroll-ratings.json");

function load(): RatingTotals {
  if (!existsSync(RATINGS_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(RATINGS_FILE, "utf8"));
  } catch (e) {
    // Keep the unreadable file for inspection instead of overwriting it on the next vote.
    const aside = `${RATINGS_FILE}.corrupt-${Date.now()}`;
    console.error(`Could not read ${RATINGS_FILE}, moving it to ${aside}:`, e);
    try {
      renameSync(RATINGS_FILE, aside);
    } catch {
      // Nothing more to do; the next save replaces it.
    }
    return {};
  }
}

const totals: RatingTotals = load();

function save() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${RATINGS_FILE}.tmp`;
    writeFileSync(tmp, JSON.stringify(totals, null, 2));
    renameSync(tmp, RATINGS_FILE);
  } catch (e) {
    // Ratings are a nicety; never let a disk problem break the meeting.
    console.error(`Could not save drumroll ratings to ${RATINGS_FILE}:`, e);
  }
}

function adjust(drumrollId: string, rating: string, delta: number) {
  const counts = (totals[drumrollId] ??= {});
  const next = (counts[rating] ?? 0) + delta;
  if (next > 0) {
    counts[rating] = next;
  } else {
    delete counts[rating];
  }
  if (Object.keys(counts).length === 0) {
    delete totals[drumrollId];
  }
}

/** Moves one person's vote on a drumroll from `before` to `after` (either may be undefined). */
export function recordRatingChange(drumrollId: string, before?: string, after?: string) {
  if (before === after) {
    return;
  }
  if (before) {
    adjust(drumrollId, before, -1);
  }
  if (after) {
    adjust(drumrollId, after, 1);
  }
  save();
}

export function getRatingTotals(): RatingTotals {
  return totals;
}
