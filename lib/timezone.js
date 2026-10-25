export const RANKS = {
  RECRUIT: "Recruit",
  KNIGHT: "Knight",
  VANGUARD_KNIGHT: "Vanguard Knight",
  COMMANDER: "Commander",
  PRIME_COMMANDER: "Prime Commander",
  GENERAL: "General",
  SUPREME_GENERAL: "Supreme General",
  SAIYAN_ROYALTY: "Saiyan Royalty",
};

const MINUTES_PER_DAY = 1440;

export function getTimezones() {
  return [...new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])].sort();
}

export function getUtcOffsetHours(timezone) {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;
  if (!offset) {
    throw new Error(`Could not determine UTC offset for timezone: ${timezone}`);
  }
  if (offset === "GMT") return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (!match) {
    throw new Error(`Unexpected UTC offset format for timezone: ${timezone}`);
  }
  const [, sign, hours, minutes] = match;
  return (sign === "-" ? -1 : 1) * (Number(hours) + Number(minutes) / 60);
}

export function parseAvailability(availability) {
  if (!Array.isArray(availability) || availability.length === 0) {
    throw new TypeError("Availability must contain at least one time range");
  }

  return availability.map(({ start, end }) => ({
    start_minute: parseTime(start, "start"),
    end_minute: parseTime(end, "end"),
  }));
}

function parseTime(value, field) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new TypeError(`Availability ${field} must be a valid HH:mm time`);
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function createGraphData(moderators, slotSize = 60) {
  if (!Number.isInteger(slotSize) || slotSize < 1 || slotSize > MINUTES_PER_DAY) {
    throw new TypeError("slot_size must be an integer between 1 and 1440");
  }

  const activeModerators = moderators.filter(
    (moderator) => !moderator.filtered && !moderator.offduty,
  );
  const activeModsByMinute = Array.from(
    { length: Math.ceil(MINUTES_PER_DAY / slotSize) },
    () => [],
  );

  for (const moderator of activeModerators) {
    for (let index = 0; index < activeModsByMinute.length; index += 1) {
      const startMinute = index * slotSize;
      if (
        moderator.availability.some((range) =>
          isUtcMinuteAvailable(startMinute, range, moderator.utc_offset),
        )
      ) {
        activeModsByMinute[index].push(moderator.name);
      }
    }
  }

  return activeModsByMinute.map((activeMods, index) => ({
    start_minute: index * slotSize,
    end_minute: Math.min((index + 1) * slotSize, MINUTES_PER_DAY),
    active_mods: activeMods,
    mod_count: activeMods.length,
  }));
}

export function compressGraphData(graph) {
  return graph.reduce((segments, slot) => {
    const previous = segments.at(-1);
    const sameActiveMods =
      previous &&
      slot.start_minute % 60 !== 0 &&
      previous.active_mods.length === slot.active_mods.length &&
      previous.active_mods.every((name, index) => name === slot.active_mods[index]);

    if (sameActiveMods) {
      previous.end_minute = slot.end_minute;
    } else {
      segments.push({
        start_minute: slot.start_minute,
        end_minute: slot.end_minute,
        active_mods: slot.active_mods,
      });
    }

    return segments;
  }, []);
}

function isUtcMinuteAvailable(utcMinute, range, offsetHours) {
  const localMinute =
    (utcMinute + Math.round(offsetHours * 60) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const { start_minute: start, end_minute: end } = range;

  if (start < end) return start <= localMinute && localMinute < end;
  if (start > end) return localMinute >= start || localMinute < end;
  return true;
}
