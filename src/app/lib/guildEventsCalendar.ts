export type GuildCalendarEventKey = "siege1" | "siege2" | "guildWar1" | "guildWar2" | "subjugation" | "labyrinth";

export type GuildCalendarEvent = {
  key: GuildCalendarEventKey;
  title: string;
  shortLabel: string;
  colorClassName: string;
  detail: string;
};

export type GuildCalendarDay = {
  date: Date;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isInSelectedWeek: boolean;
  events: GuildCalendarEvent[];
};

export type GuildCalendarMonth = {
  monthLabel: string;
  firstDay: Date;
  days: GuildCalendarDay[];
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const LABYRINTH_ANCHOR = new Date(2026, 3, 4);
const LABYRINTH_DURATION_DAYS = 4;
const LABYRINTH_INTERVAL_DAYS = 15;

const atMidnight = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const diffInDays = (left: Date, right: Date) =>
  Math.floor((atMidnight(left).getTime() - atMidnight(right).getTime()) / (24 * 60 * 60 * 1000));

const isSameDay = (left: Date, right: Date) => atMidnight(left).getTime() === atMidnight(right).getTime();

const getEventsForDate = (date: Date): GuildCalendarEvent[] => {
  const weekday = date.getDay();
  const events: GuildCalendarEvent[] = [];

  if (weekday === 1) {
    events.push({
      key: "siege1",
      title: "Siege 1",
      shortLabel: "Siege 1",
      colorClassName: "border-red-500/30 bg-red-500/10 text-red-200",
      detail: "Primeira janela de assalto da semana. Até 30 ataques por membro.",
    });
  }

  if (weekday === 2) {
    events.push({
      key: "siege1",
      title: "Siege 1",
      shortLabel: "Siege 1",
      colorClassName: "border-red-500/30 bg-red-500/10 text-red-200",
      detail: "Encerramento da primeira janela de assalto da semana.",
    });
  }

  if (weekday === 4) {
    events.push({
      key: "siege2",
      title: "Siege 2",
      shortLabel: "Siege 2",
      colorClassName: "border-rose-500/30 bg-rose-500/10 text-rose-200",
      detail: "Segunda janela de assalto da semana. Até 30 ataques por membro.",
    });
  }

  if (weekday === 5) {
    events.push({
      key: "siege2",
      title: "Siege 2",
      shortLabel: "Siege 2",
      colorClassName: "border-rose-500/30 bg-rose-500/10 text-rose-200",
      detail: "Encerramento da segunda janela de assalto da semana.",
    });
  }

  if (weekday === 3) {
    events.push({
      key: "guildWar1",
      title: "GW 1",
      shortLabel: "GW 1",
      colorClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      detail: "Primeira janela de Batalha de Guilda. 2 entradas de até 5 composições cada.",
    });
    events.push({
      key: "subjugation",
      title: "Subjugação",
      shortLabel: "Slime",
      colorClassName: "border-purple-500/30 bg-purple-500/10 text-purple-200",
      detail: "Início da subjugação às 21:30 no horário de Brasília.",
    });
  }

  if (weekday === 4) {
    events.push({
      key: "guildWar1",
      title: "GW 1",
      shortLabel: "GW 1",
      colorClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      detail: "Encerramento da primeira janela de Batalha de Guilda.",
    });
    events.push({
      key: "subjugation",
      title: "Subjugação",
      shortLabel: "Boss",
      colorClassName: "border-purple-500/30 bg-purple-500/10 text-purple-200",
      detail: "Boss da subjugação disponível.",
    });
  }

  if (weekday === 5) {
    events.push({
      key: "guildWar2",
      title: "GW 2",
      shortLabel: "GW 2",
      colorClassName: "border-lime-500/30 bg-lime-500/10 text-lime-200",
      detail: "Segunda janela de Batalha de Guilda. 2 entradas de até 5 composições cada.",
    });
    events.push({
      key: "subjugation",
      title: "Subjugação",
      shortLabel: "Fim Slime",
      colorClassName: "border-purple-500/30 bg-purple-500/10 text-purple-200",
      detail: "Encerramento da subjugação.",
    });
  }

  if (weekday === 6) {
    events.push({
      key: "guildWar2",
      title: "GW 2",
      shortLabel: "GW 2",
      colorClassName: "border-lime-500/30 bg-lime-500/10 text-lime-200",
      detail: "Encerramento da segunda janela de Batalha de Guilda.",
    });
  }

  const daysFromAnchor = diffInDays(date, LABYRINTH_ANCHOR);
  if (daysFromAnchor >= 0) {
    const cycleDay = daysFromAnchor % LABYRINTH_INTERVAL_DAYS;
    if (cycleDay >= 0 && cycleDay < LABYRINTH_DURATION_DAYS) {
      events.push({
        key: "labyrinth",
        title: "Labirinto",
        shortLabel: cycleDay === 0 ? "Lab início" : "Lab",
        colorClassName: "border-sky-500/30 bg-sky-500/10 text-sky-200",
        detail:
          cycleDay === 0
            ? "Início previsto do ciclo de labirinto."
            : "Labirinto ativo neste dia do ciclo de 15 dias.",
      });
    }
  }

  return events;
};

export const guildCalendarWeekdays = DAY_NAMES;

export const buildGuildCalendarMonth = (referenceDate = new Date(), selectedWeekStart?: Date): GuildCalendarMonth => {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const startOffset = monthStart.getDay();
  const gridStart = addDays(monthStart, -startOffset);
  const endOffset = 6 - monthEnd.getDay();
  const gridEnd = addDays(monthEnd, endOffset);
  const today = new Date();
  const selectedStart = selectedWeekStart ? atMidnight(selectedWeekStart) : null;
  const selectedEnd = selectedStart ? addDays(selectedStart, 6) : null;

  const days: GuildCalendarDay[] = [];
  for (let cursor = atMidnight(gridStart); cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    const normalizedCursor = atMidnight(cursor);
    days.push({
      date: cursor,
      dayNumber: cursor.getDate(),
      inCurrentMonth: cursor.getMonth() === referenceDate.getMonth(),
      isToday: isSameDay(cursor, today),
      isInSelectedWeek:
        selectedStart !== null && selectedEnd !== null &&
        normalizedCursor.getTime() >= selectedStart.getTime() &&
        normalizedCursor.getTime() <= selectedEnd.getTime(),
      events: getEventsForDate(cursor),
    });
  }

  return {
    monthLabel: monthStart.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
    firstDay: monthStart,
    days,
  };
};
