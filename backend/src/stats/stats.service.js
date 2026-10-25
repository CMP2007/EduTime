import { ValidationError } from '../errors.js';
import { sessionsRepository } from '../sessions/sessions.repository.js';
import { addDays, enumerateDays, getRange, isValidPeriod, PERIODS, todayString } from '../utils/date.js';

export const GOAL_MINUTES = 180;

function sumByDate(sessions) {
  const map = new Map();
  for (const session of sessions) {
    map.set(session.date, (map.get(session.date) ?? 0) + session.durationMinutes);
  }
  return map;
}

function totalMinutes(sessions) {
  return sessions.reduce((total, session) => total + session.durationMinutes, 0);
}

function groupBySubject(sessions) {
  const map = new Map();
  for (const session of sessions) {
    const entry = map.get(session.title) ?? { title: session.title, minutes: 0, sessions: 0 };
    entry.minutes += session.durationMinutes;
    entry.sessions += 1;
    map.set(session.title, entry);
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}

function findLongest(sessions) {
  return sessions.reduce(
    (longest, session) => (!longest || session.durationMinutes > longest.durationMinutes ? session : longest),
    null,
  );
}

/** Racha = días consecutivos en los que se cumplió la meta, hasta la fecha de referencia. */
function computeStreaks(goalDates, reference) {
  const today = reference || todayString();
  const sorted = [...goalDates].filter((date) => date <= today).sort();
  if (sorted.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let index = 1; index < sorted.length; index += 1) {
    run = addDays(sorted[index - 1], 1) === sorted[index] ? run + 1 : 1;
    if (run > best) best = run;
  }

  const set = new Set(sorted);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best };
}

function buildHeatmap(totalsByDate, from, to) {
  return enumerateDays(from, to).map((date) => {
    const minutes = totalsByDate.get(date) ?? 0;
    return { date, minutes, goalMet: minutes >= GOAL_MINUTES };
  });
}

export const statsService = {
  async getStats({ period, date, heatmap, heatmapDate } = {}) {
    if (period !== undefined && !isValidPeriod(period)) {
      throw new ValidationError(`Periodo inválido. Valores permitidos: ${PERIODS.join(', ')}.`);
    }
    if (heatmap !== undefined && !isValidPeriod(heatmap)) {
      throw new ValidationError(`Periodo del heatmap inválido. Valores permitidos: ${PERIODS.join(', ')}.`);
    }

    const reference = date || todayString();
    const heatmapReference = heatmapDate || reference;
    const periodKey = period ?? 'week';
    const heatmapKey = heatmap ?? 'week';

    const sessions = await sessionsRepository.findAll();
    const periodRange = getRange(periodKey, reference);
    const heatmapRange = getRange(heatmapKey, heatmapReference);

    const periodSessions = sessions.filter(
      (session) => session.date >= periodRange.from && session.date <= periodRange.to,
    );

    const totalsByDate = sumByDate(sessions);
    const goalDays = [...totalsByDate.values()].filter((minutes) => minutes >= GOAL_MINUTES).length;
    const goalDates = [...totalsByDate.entries()]
      .filter(([, minutes]) => minutes >= GOAL_MINUTES)
      .map(([dateKey]) => dateKey);

    const periodTotals = sumByDate(periodSessions);
    const activeDaysInPeriod = periodTotals.size;
    const goalDaysInPeriod = [...periodTotals.values()].filter(
      (minutes) => minutes >= GOAL_MINUTES,
    ).length;

    const longest = findLongest(periodSessions);
    const todayMinutes = totalsByDate.get(reference) ?? 0;

    return {
      period: {
        key: periodRange.key,
        label: periodRange.label,
        from: periodRange.from,
        to: periodRange.to,
      },
      summary: {
        totalMinutes: totalMinutes(periodSessions),
        totalSessions: periodSessions.length,
        activeDays: activeDaysInPeriod,
        goalDays: goalDaysInPeriod,
        longestClass: longest
          ? {
            id: longest.id,
            title: longest.title,
            date: longest.date,
            durationMinutes: longest.durationMinutes,
          }
          : null,
        subjects: groupBySubject(periodSessions),
      },
      global: {
        totalMinutes: totalMinutes(sessions),
        totalSessions: sessions.length,
        activeDays: totalsByDate.size,
        goalDays,
        streak: computeStreaks(goalDates, todayString()),
      },
      today: {
        date: reference,
        minutes: todayMinutes,
        goalMinutes: GOAL_MINUTES,
        goalMet: todayMinutes >= GOAL_MINUTES,
      },
      heatmap: {
        range: heatmapRange.key,
        label: heatmapRange.label,
        from: heatmapRange.from,
        to: heatmapRange.to,
        goalMinutes: GOAL_MINUTES,
        days: buildHeatmap(totalsByDate, heatmapRange.from, heatmapRange.to),
      },
    };
  },
};
