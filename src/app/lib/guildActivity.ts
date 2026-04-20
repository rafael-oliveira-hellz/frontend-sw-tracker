import type {
  AttackBattleRecordDto,
  GuildCurrentMemberStateDto,
  GuildCurrentStateDto,
  TeamCompositionDto,
  TeamUsageSummaryDto,
} from "./guildImport";

export type GuildActivityEventKey = "labyrinth" | "guildWar" | "siege" | "subjugation";

export type GuildActivityWeekOption = {
  key: string;
  startDate: string;
  endDate: string;
  label: string;
  isLatest: boolean;
};

export type DailyAttackBreakdown = {
  dayKey: string;
  dateLabel: string;
  totalActions: number;
  guildWarEntries: number;
  guildWarBattles: number;
  siegeAttacks: number;
  guildWarWins: number;
  guildWarLosses: number;
  guildWarDraws: number;
  siegeWins: number;
  siegeLosses: number;
  siegeDraws: number;
};

export type EventWindowProgress = {
  key: string;
  label: string;
  daysLabel: string;
  completed: number;
  expected: number;
  entryCount?: number;
  expectedEntries?: number;
  completionRate: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  meetsWinRateGoal: boolean;
};

export type WeeklyEventMemberProgress = {
  hasData: boolean;
  completed: number;
  expected: number;
  completionRate: number;
  label: string;
  hint: string;
  winRate: number;
  teamsUsed: TeamUsageSummaryDto[];
  attacksUsed: AttackBattleRecordDto[];
  wins: number;
  losses: number;
  draws: number;
  dailyBreakdown: DailyAttackBreakdown[];
  windows: EventWindowProgress[];
  extra?: {
    warsCompleted?: number;
    siegeRoundsCompleted?: number;
    battlesTracked?: number;
    attacksTracked?: number;
    score?: number;
    rank?: number;
    contributionRate?: number;
  };
};

export type WeeklyMemberActivityRow = {
  wizardId: number;
  memberName: string;
  weekKey: string;
  updatedAt: string;
  overallCompletionRate: number;
  completedEvents: number;
  totalEvents: number;
  totalTrackedAttacks: number;
  guildWar: WeeklyEventMemberProgress;
  siege: WeeklyEventMemberProgress;
  labyrinth: WeeklyEventMemberProgress;
  subjugation: WeeklyEventMemberProgress;
  dailyBreakdown: DailyAttackBreakdown[];
};

export type GuildActivityEventCard = {
  eventKey: GuildActivityEventKey;
  title: string;
  cadenceLabel: string;
  durationLabel: string;
  expectationLabel: string;
  totalMembers: number;
  membersWithData: number;
  fullyCompletedMembers: number;
  totalCompleted: number;
  totalExpected: number;
  completionRate: number;
  topMembers: Array<{
    wizardId: number;
    memberName: string;
    completed: number;
    expected: number;
    label: string;
  }>;
  topTeams: TeamUsageSummaryDto[];
};

export type GuildActivityOverview = {
  weekKey: string;
  generatedAt: string;
  guildName?: string;
  selectedWeek: GuildActivityWeekOption;
  availableWeeks: GuildActivityWeekOption[];
  members: WeeklyMemberActivityRow[];
  events: GuildActivityEventCard[];
  summary: {
    totalMembers: number;
    averageCompletionRate: number;
    trackedAttacks: number;
    trackedTeams: number;
  };
};

export type BuildGuildActivityOverviewOptions = {
  weekKey?: string;
  historyStart?: string | Date;
};

type EventConfig = {
  title: string;
  cadenceLabel: string;
  durationLabel: string;
  expectationLabel: string;
};

const HISTORY_START = new Date(2026, 3, 5);

const EVENT_CONFIG: Record<GuildActivityEventKey, EventConfig> = {
  labyrinth: {
    title: "Labirinto",
    cadenceLabel: "1 ciclo a cada 15 dias",
    durationLabel: "Duração média de 3 a 4 dias",
    expectationLabel: "Participação no ciclo atual",
  },
  guildWar: {
    title: "Batalha de Guilda",
    cadenceLabel: "Quarta/quinta e sexta/sábado",
    durationLabel: "2 GW por semana, cada uma durando 2 dias e com até 10 batalhas rastreadas",
    expectationLabel: "Limite semanal: até 20 batalhas rastreadas, sendo até 10 por GW",
  },
  siege: {
    title: "Batalha de Assalto",
    cadenceLabel: "Segunda/terça e quinta/sexta",
    durationLabel: "2 assaltos por semana, com até 30 ataques por assalto",
    expectationLabel: "Limite semanal: até 60 ataques rastreados, sendo até 30 por assalto",
  },
  subjugation: {
    title: "Subjugação de Monstros",
    cadenceLabel: "Quarta, quinta e sexta",
    durationLabel: "Início às 21:30 BRT, boss na quinta e encerramento na sexta",
    expectationLabel: "Participação no ciclo atual",
  },
};

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

const toDateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeekSunday = (date: Date) => {
  const copy = toDateOnly(date);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
};

const endOfWeekSaturday = (date: Date) => {
  const start = startOfWeekSunday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

const formatWeekLabel = (start: Date, end: Date) =>
  `${formatDateLabel(start)} a ${formatDateLabel(end)}`;

const resolveHistoryStart = (value?: string | Date) => {
  if (!value) {
    return HISTORY_START;
  }

  const parsed = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(parsed.getTime()) ? HISTORY_START : toDateOnly(parsed);
};

const resolveAttackDate = (attack: AttackBattleRecordDto): Date | null => {
  if (attack.occurredAt) {
    return toDateOnly(new Date(attack.occurredAt * 1000));
  }

  if (attack.dateId) {
    const value = String(attack.dateId);
    if (value.length === 8) {
      const year = Number(value.slice(0, 4));
      const month = Number(value.slice(4, 6)) - 1;
      const day = Number(value.slice(6, 8));
      return new Date(year, month, day);
    }
  }

  return null;
};

const buildAttackIdentity = (attack: AttackBattleRecordDto) =>
  [
    attack.context,
    attack.battleId,
    attack.matchId ?? "",
    attack.baseId ?? attack.baseNumber ?? "",
    attack.targetWizardId ?? "",
    attack.dateId ?? "",
  ].join(":");

const dedupeAttacks = (attacks: AttackBattleRecordDto[]) => {
  const seen = new Set<string>();

  return attacks.filter((attack) => {
    const identity = buildAttackIdentity(attack);
    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
};

const buildGuildWarEntryKey = (attack: AttackBattleRecordDto) =>
  attack.context === "guildWar" ? attack.battleId.replace(/-\d+$/, "") : attack.battleId;

const countGuildWarEntries = (attacks: AttackBattleRecordDto[]) =>
  new Set(dedupeAttacks(attacks).map((attack) => buildGuildWarEntryKey(attack))).size;

const isDateInWeek = (date: Date, weekStart: Date) => {
  const normalized = toDateOnly(date).getTime();
  const start = weekStart.getTime();
  const end = addDays(weekStart, 6).getTime();
  return normalized >= start && normalized <= end;
};

const filterAttacksToWeek = (attacks: AttackBattleRecordDto[], weekStart: Date) =>
  dedupeAttacks(attacks).filter((attack) => {
    const date = resolveAttackDate(attack);
    return date ? isDateInWeek(date, weekStart) : false;
  });

const filterAttacksByWeekdays = (attacks: AttackBattleRecordDto[], weekdays: number[]) =>
  dedupeAttacks(attacks).filter((attack) => {
    const date = resolveAttackDate(attack);
    return date ? weekdays.includes(date.getDay()) : false;
  });

const summarizeOutcomes = (attacks: AttackBattleRecordDto[]) => ({
  wins: attacks.filter((attack) => attack.outcome === "win").length,
  losses: attacks.filter((attack) => attack.outcome === "loss").length,
  draws: attacks.filter((attack) => attack.outcome === "draw").length,
});

const calculateWinRate = (wins: number, total: number, draws = 0) =>
  total > 0 ? (((wins + draws * 0.5) / total) * 100) : 0;

const hasLabyrinthParticipation = (member: GuildCurrentMemberStateDto) =>
  Boolean(
    (member.labyrinth.score ?? 0) > 0 ||
      (member.labyrinth.contributionRate ?? 0) > 0 ||
      member.labyrinth.isMvp,
  );

const SUBJUGATION_FULL_CLEAR_MIN_SCORE = 4_200_000;

const hasSubjugationParticipation = (member: GuildCurrentMemberStateDto) =>
  (member.subjugation.clearScore ?? 0) >= SUBJUGATION_FULL_CLEAR_MIN_SCORE;

const buildWindowProgress = (
  key: string,
  label: string,
  daysLabel: string,
  expected: number,
  attacks: AttackBattleRecordDto[],
  options?: {
    entryCount?: number;
    expectedEntries?: number;
  },
): EventWindowProgress => {
  const outcomes = summarizeOutcomes(attacks);
  const decisiveBattles = outcomes.wins + outcomes.losses + outcomes.draws;
  const winRate = calculateWinRate(outcomes.wins, decisiveBattles, outcomes.draws);

  return {
    key,
    label,
    daysLabel,
    completed: attacks.length,
    expected,
    entryCount: options?.entryCount,
    expectedEntries: options?.expectedEntries,
    completionRate: clampPercentage((attacks.length / expected) * 100),
    wins: outcomes.wins,
    losses: outcomes.losses,
    draws: outcomes.draws,
    winRate,
    meetsWinRateGoal: decisiveBattles > 0 && winRate >= 80,
  };
};

const mergeDailyBreakdowns = (...collections: DailyAttackBreakdown[][]): DailyAttackBreakdown[] => {
  const merged = new Map<string, DailyAttackBreakdown>();

  for (const collection of collections) {
    for (const bucket of collection) {
      const current = merged.get(bucket.dayKey);
      if (!current) {
        merged.set(bucket.dayKey, { ...bucket });
        continue;
      }

      current.totalActions += bucket.totalActions;
      current.guildWarEntries += bucket.guildWarEntries;
      current.guildWarBattles += bucket.guildWarBattles;
      current.siegeAttacks += bucket.siegeAttacks;
      current.guildWarWins += bucket.guildWarWins;
      current.guildWarLosses += bucket.guildWarLosses;
      current.guildWarDraws += bucket.guildWarDraws;
      current.siegeWins += bucket.siegeWins;
      current.siegeLosses += bucket.siegeLosses;
      current.siegeDraws += bucket.siegeDraws;
    }
  }

  return [...merged.values()].sort((left, right) => left.dayKey.localeCompare(right.dayKey));
};

const buildDailyBreakdown = (
  attacks: AttackBattleRecordDto[],
  context: "guildWar" | "siege",
): DailyAttackBreakdown[] => {
  const buckets = new Map<string, DailyAttackBreakdown>();
  const guildWarDayEntries = new Map<string, Set<string>>();

  for (const attack of dedupeAttacks(attacks)) {
    const attackDate = resolveAttackDate(attack);
    if (!attackDate) {
      continue;
    }

    const dayKey = formatDateKey(attackDate);
    const bucket = buckets.get(dayKey) ?? {
      dayKey,
      dateLabel: attackDate.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
      totalActions: 0,
      guildWarEntries: 0,
      guildWarBattles: 0,
      siegeAttacks: 0,
      guildWarWins: 0,
      guildWarLosses: 0,
      guildWarDraws: 0,
      siegeWins: 0,
      siegeLosses: 0,
      siegeDraws: 0,
    };

    if (context === "guildWar") {
      const entryKey = buildGuildWarEntryKey(attack);
      const dayEntries = guildWarDayEntries.get(dayKey) ?? new Set<string>();
      bucket.guildWarBattles += 1;
      if (!dayEntries.has(entryKey)) {
        dayEntries.add(entryKey);
        bucket.guildWarEntries += 1;
        bucket.totalActions += 1;
      }
      guildWarDayEntries.set(dayKey, dayEntries);
      if (attack.outcome === "win") bucket.guildWarWins += 1;
      if (attack.outcome === "loss") bucket.guildWarLosses += 1;
      if (attack.outcome === "draw") bucket.guildWarDraws += 1;
    } else {
      bucket.totalActions += 1;
      bucket.siegeAttacks += 1;
      if (attack.outcome === "win") bucket.siegeWins += 1;
      if (attack.outcome === "loss") bucket.siegeLosses += 1;
      if (attack.outcome === "draw") bucket.siegeDraws += 1;
    }

    buckets.set(dayKey, bucket);
  }

  return [...buckets.values()].sort((left, right) => left.dayKey.localeCompare(right.dayKey));
};

const createEmptyTeamUsage = (team: TeamCompositionDto): TeamUsageSummaryDto => ({
  team,
  totalBattles: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winRate: 0,
  contexts: [],
});

const summarizeTeamsFromAttacks = (attacks: AttackBattleRecordDto[], limit = 3): TeamUsageSummaryDto[] => {
  const usageMap = new Map<string, TeamUsageSummaryDto>();

  for (const attack of dedupeAttacks(attacks)) {
    const signature = attack.team.signature;
    const current = usageMap.get(signature) ?? createEmptyTeamUsage(attack.team);
    current.totalBattles += 1;
    if (attack.outcome === "win") current.wins += 1;
    if (attack.outcome === "loss") current.losses += 1;
    if (attack.outcome === "draw") current.draws += 1;
    if (!current.contexts.includes(attack.context)) {
      current.contexts.push(attack.context);
    }
    usageMap.set(signature, current);
  }

  return [...usageMap.values()]
    .map((team) => ({
      ...team,
      winRate: calculateWinRate(
        team.wins,
        team.wins + team.losses + team.draws,
        team.draws,
      ),
    }))
    .sort((left, right) => right.totalBattles - left.totalBattles || right.winRate - left.winRate)
    .slice(0, limit);
};

const buildGuildWarProgress = (
  member: GuildCurrentMemberStateDto,
  weekStart: Date,
): WeeklyEventMemberProgress => {
  const attacks = filterAttacksToWeek(member.guildWar.attacks ?? [], weekStart);
  const teamsUsed = summarizeTeamsFromAttacks(attacks);
  const outcomes = summarizeOutcomes(attacks);
  const firstWindowAttacks = filterAttacksByWeekdays(attacks, [3, 4]);
  const secondWindowAttacks = filterAttacksByWeekdays(attacks, [5, 6]);
  const entryCount = countGuildWarEntries(attacks);
  const firstWindow = buildWindowProgress("gw-1", "GW 1", "Quarta e quinta", 10, firstWindowAttacks, {
    entryCount: countGuildWarEntries(firstWindowAttacks),
    expectedEntries: 2,
  });
  const secondWindow = buildWindowProgress("gw-2", "GW 2", "Sexta e sábado", 10, secondWindowAttacks, {
    entryCount: countGuildWarEntries(secondWindowAttacks),
    expectedEntries: 2,
  });
  const decisiveBattles = outcomes.wins + outcomes.losses + outcomes.draws;
  const warsCompleted = [firstWindow, secondWindow].filter((window) => window.completed >= window.expected).length;
  const hasData =
    member.coverage.guildWarAttacks ||
    member.coverage.guildWarDefenses ||
    member.guildWar.currentAttackCount !== undefined ||
    member.guildWar.currentEnergy !== undefined ||
    member.guildWar.attacks.length > 0 ||
    member.guildWar.defenses.length > 0 ||
    member.guildWar.teams.length > 0;

  return {
    hasData,
    completed: attacks.length,
    expected: 20,
    completionRate: clampPercentage((attacks.length / 20) * 100),
    label:
      attacks.length > 0
        ? `${entryCount} entradas registradas • ${attacks.length} de 20 batalhas rastreadas na semana`
        : "Nenhuma entrada de GW rastreada nesta semana",
    hint: `${warsCompleted}/2 GW concluídas na semana • ${entryCount}/4 entradas registradas`,
    winRate: calculateWinRate(outcomes.wins, decisiveBattles, outcomes.draws),
    teamsUsed,
    attacksUsed: attacks,
    wins: outcomes.wins,
    losses: outcomes.losses,
    draws: outcomes.draws,
    dailyBreakdown: buildDailyBreakdown(attacks, "guildWar"),
    windows: [firstWindow, secondWindow],
    extra: {
      warsCompleted,
      battlesTracked: attacks.length,
      attacksTracked: entryCount,
    },
  };
};

const buildSiegeProgress = (
  member: GuildCurrentMemberStateDto,
  weekStart: Date,
): WeeklyEventMemberProgress => {
  const attacks = filterAttacksToWeek(member.siege.attacks ?? [], weekStart);
  const teamsUsed = summarizeTeamsFromAttacks(attacks);
  const outcomes = summarizeOutcomes(attacks);
  const firstWindow = buildWindowProgress("siege-1", "Siege 1", "Segunda e terça", 30, filterAttacksByWeekdays(attacks, [1, 2]));
  const secondWindow = buildWindowProgress("siege-2", "Siege 2", "Quinta e sexta", 30, filterAttacksByWeekdays(attacks, [4, 5]));
  const decisiveBattles = outcomes.wins + outcomes.losses + outcomes.draws;
  const siegeRoundsCompleted = [firstWindow, secondWindow].filter((window) => window.completed >= window.expected).length;
  const hasData =
    member.coverage.siegeAttacks ||
    member.coverage.siegeDefenses ||
    member.siege.attacks.length > 0 ||
    member.siege.defenses.length > 0 ||
    member.siege.teams.length > 0;

  return {
    hasData,
    completed: attacks.length,
    expected: 60,
    completionRate: clampPercentage((attacks.length / 60) * 100),
    label:
      attacks.length > 0
        ? `${attacks.length} de 60 ataques rastreados na semana`
        : "Nenhum ataque rastreado nesta semana",
    hint: `${siegeRoundsCompleted}/2 assaltos concluídos na semana • limite de até 30 ataques por assalto`,
    winRate: calculateWinRate(outcomes.wins, decisiveBattles, outcomes.draws),
    teamsUsed,
    attacksUsed: attacks,
    wins: outcomes.wins,
    losses: outcomes.losses,
    draws: outcomes.draws,
    dailyBreakdown: buildDailyBreakdown(attacks, "siege"),
    windows: [firstWindow, secondWindow],
    extra: {
      siegeRoundsCompleted,
      attacksTracked: attacks.length,
    },
  };
};

const buildLabyrinthProgress = (member: GuildCurrentMemberStateDto): WeeklyEventMemberProgress => {
  const participated = hasLabyrinthParticipation(member);
  const completed = participated ? 1 : 0;

  return {
    hasData:
      member.coverage.labyrinth ||
      (member.labyrinth.score ?? 0) > 0 ||
      (member.labyrinth.contributionRate ?? 0) > 0 ||
      member.labyrinth.rank !== undefined ||
      member.labyrinth.isMvp,
    completed,
    expected: 1,
    completionRate: completed * 100,
    label: participated
      ? `Score ${member.labyrinth.score ?? 0} • Rank ${member.labyrinth.rank ?? "-"}`
      : "Sem participação registrada",
    hint: "Participação no ciclo atual do labirinto",
    winRate: 0,
    teamsUsed: [],
    attacksUsed: [],
    wins: 0,
    losses: 0,
    draws: 0,
    dailyBreakdown: [],
    windows: [],
    extra: {
      score: member.labyrinth.score,
      rank: member.labyrinth.rank,
      contributionRate: member.labyrinth.contributionRate,
    },
  };
};

const buildSubjugationProgress = (member: GuildCurrentMemberStateDto): WeeklyEventMemberProgress => {
  const participated = hasSubjugationParticipation(member);
  const completed = participated ? 1 : 0;
  const score = member.subjugation.clearScore ?? 0;

  return {
    hasData:
      member.coverage.subjugation ||
      (member.subjugation.clearScore ?? 0) > 0 ||
      (member.subjugation.contributeRatio ?? 0) > 0 ||
      member.subjugation.rank !== undefined,
    completed,
    expected: 1,
    completionRate: completed * 100,
    label: participated
      ? `Score ${score} • Rank ${member.subjugation.rank ?? "-"}`
      : score > 0
        ? "Subjugação incompleta"
        : "Sem participação registrada",
    hint: participated
      ? "Subjugação concluída no ciclo atual"
      : score > 0
        ? "A pontuação indica que o membro não completou toda a subjugação"
        : "Participação no ciclo atual da subjugação",
    winRate: 0,
    teamsUsed: [],
    attacksUsed: [],
    wins: 0,
    losses: 0,
    draws: 0,
    dailyBreakdown: [],
    windows: [],
    extra: {
      score: member.subjugation.clearScore,
      rank: member.subjugation.rank,
      contributionRate: member.subjugation.contributeRatio,
    },
  };
};

const buildWeeklyMemberRow = (
  member: GuildCurrentMemberStateDto,
  weekKey: string,
  weekStart: Date,
): WeeklyMemberActivityRow => {
  const guildWar = buildGuildWarProgress(member, weekStart);
  const siege = buildSiegeProgress(member, weekStart);
  const labyrinth = buildLabyrinthProgress(member);
  const subjugation = buildSubjugationProgress(member);
  const totalEvents = 4;
  const completedEvents = [guildWar, siege, labyrinth, subjugation].filter(
    (event) => event.completionRate >= 100,
  ).length;
  const overallCompletionRate =
    (guildWar.completionRate + siege.completionRate + labyrinth.completionRate + subjugation.completionRate) /
    totalEvents;

  return {
    wizardId: member.wizardId,
    memberName: member.member.wizardName,
    weekKey,
    updatedAt: member.updatedAt,
    overallCompletionRate,
    completedEvents,
    totalEvents,
    totalTrackedAttacks: (guildWar.extra?.attacksTracked ?? guildWar.completed) + siege.completed,
    guildWar,
    siege,
    labyrinth,
    subjugation,
    dailyBreakdown: mergeDailyBreakdowns(guildWar.dailyBreakdown, siege.dailyBreakdown),
  };
};

const buildEventCard = (
  eventKey: GuildActivityEventKey,
  rows: WeeklyMemberActivityRow[],
): GuildActivityEventCard => {
  const config = EVENT_CONFIG[eventKey];
  const eventRows = rows.map((row) => ({
    wizardId: row.wizardId,
    memberName: row.memberName,
    progress: row[eventKey],
  }));
  const totalMembers = eventRows.length;
  const membersWithData = eventRows.filter((item) => item.progress.hasData).length;
  const fullyCompletedMembers = eventRows.filter((item) => item.progress.completionRate >= 100).length;
  const totalCompleted = eventRows.reduce((sum, item) => sum + item.progress.completed, 0);
  const totalExpected = eventRows.reduce((sum, item) => sum + item.progress.expected, 0);
  const completionRate = totalExpected > 0 ? clampPercentage((totalCompleted / totalExpected) * 100) : 0;

  const topMembers = [...eventRows]
    .sort(
      (left, right) =>
        right.progress.completed - left.progress.completed ||
        right.progress.completionRate - left.progress.completionRate,
    )
    .slice(0, 5)
    .map((item) => ({
      wizardId: item.wizardId,
      memberName: item.memberName,
      completed: item.progress.completed,
      expected: item.progress.expected,
      label: item.progress.label,
    }));

  const topTeams = summarizeTeamsFromAttacks(
    eventRows.flatMap((item) => item.progress.attacksUsed),
    5,
  );

  return {
    eventKey,
    title: config.title,
    cadenceLabel: config.cadenceLabel,
    durationLabel: config.durationLabel,
    expectationLabel: config.expectationLabel,
    totalMembers,
    membersWithData,
    fullyCompletedMembers,
    totalCompleted,
    totalExpected,
    completionRate,
    topMembers,
    topTeams,
  };
};

const collectAttackDates = (currentState: GuildCurrentStateDto) => {
  const dates: Date[] = [];

  for (const member of currentState.members) {
    for (const attack of dedupeAttacks([...member.guildWar.attacks, ...member.siege.attacks])) {
      const attackDate = resolveAttackDate(attack);
      if (attackDate) {
        dates.push(attackDate);
      }
    }
  }

  return dates;
};

export const getGuildActivityWeekOptions = (
  currentState: GuildCurrentStateDto | null,
  historyStartInput?: string | Date,
): GuildActivityWeekOption[] => {
  const historyStart = startOfWeekSunday(resolveHistoryStart(historyStartInput));
  const latestDateCandidate = currentState?.updatedAt ? new Date(currentState.updatedAt) : new Date();
  const attackDates = currentState ? collectAttackDates(currentState) : [];
  const latestAttackDate = attackDates.sort((left, right) => right.getTime() - left.getTime())[0];
  const latestReferenceDate = latestAttackDate && latestAttackDate > latestDateCandidate
    ? latestAttackDate
    : latestDateCandidate;

  const latestWeekStart = startOfWeekSunday(latestReferenceDate);
  const weeks: GuildActivityWeekOption[] = [];

  for (let cursor = new Date(historyStart); cursor <= latestWeekStart; cursor = addDays(cursor, 7)) {
    const end = endOfWeekSaturday(cursor);
    weeks.push({
      key: formatDateKey(cursor),
      startDate: cursor.toISOString(),
      endDate: end.toISOString(),
      label: formatWeekLabel(cursor, end),
      isLatest: cursor.getTime() === latestWeekStart.getTime(),
    });
  }

  return weeks;
};

export const buildGuildActivityOverview = (
  currentState: GuildCurrentStateDto | null,
  options: BuildGuildActivityOverviewOptions = {},
): GuildActivityOverview | null => {
  if (!currentState) {
    return null;
  }

  const availableWeeks = getGuildActivityWeekOptions(currentState, options.historyStart);
  const selectedWeek =
    availableWeeks.find((week) => week.key === options.weekKey) ??
    availableWeeks[availableWeeks.length - 1];

  if (!selectedWeek) {
    return null;
  }

  const weekStart = new Date(selectedWeek.startDate);
  const members = currentState.members
    .map((member) => buildWeeklyMemberRow(member, selectedWeek.key, weekStart))
    .sort(
      (left, right) =>
        right.overallCompletionRate - left.overallCompletionRate ||
        left.memberName.localeCompare(right.memberName),
    );

  const events = [
    buildEventCard("labyrinth", members),
    buildEventCard("guildWar", members),
    buildEventCard("siege", members),
    buildEventCard("subjugation", members),
  ];

  const trackedAttacks = members.reduce(
    (sum, row) => sum + (row.guildWar.extra?.attacksTracked ?? row.guildWar.completed) + row.siege.completed,
    0,
  );
  const trackedTeams = members.reduce(
    (sum, row) => sum + row.guildWar.teamsUsed.length + row.siege.teamsUsed.length,
    0,
  );
  const averageCompletionRate = members.length
    ? members.reduce((sum, row) => sum + row.overallCompletionRate, 0) / members.length
    : 0;

  return {
    weekKey: selectedWeek.key,
    generatedAt: currentState.updatedAt,
    guildName: currentState.guildName,
    selectedWeek,
    availableWeeks,
    members,
    events,
    summary: {
      totalMembers: members.length,
      averageCompletionRate,
      trackedAttacks,
      trackedTeams,
    },
  };
};
