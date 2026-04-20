const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");

export interface UploadedGuildFileDto {
  fileName: string;
  content: string;
}

export interface ImportGuildFilesRequestDto {
  files: UploadedGuildFileDto[];
  sourceLabel?: string;
}

export interface TeamCompositionDto {
  signature: string;
  monsters: number[];
  monsterNames?: string[];
  label: string;
}

export interface TeamUsageSummaryDto {
  team: TeamCompositionDto;
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  contexts: string[];
}

export interface AttackBattleRecordDto {
  context: "guildWar" | "siege";
  battleId: string;
  matchId?: number;
  dateId?: number;
  occurredAt?: number;
  targetLabel: string;
  targetWizardId?: number;
  targetGuildId?: number;
  targetGuildName?: string;
  baseId?: number;
  baseNumber?: number;
  outcome: "win" | "loss" | "draw" | "unknown";
  scoreDelta?: number;
  team: TeamCompositionDto;
}

export interface DefenseUnitEquipmentDto {
  unitId?: number;
  unitMasterId?: number;
  position?: number;
  unitLevel?: number;
  monsterName: string;
  equippedRunesCount?: number;
  expectedRunesCount?: number;
  reportedRuneSlotsCoveredCount?: number;
  equippedArtifactsCount?: number;
  expectedArtifactsCount?: number;
  missingRunesCount?: number;
  missingArtifactsCount?: number;
  missingRuneSlots?: number[];
  missingArtifactSlots?: number[];
}

export interface DefenseEquipmentAuditDto {
  status: "ok" | "incomplete" | "unknown";
  canIdentifySlots: boolean;
  summary: string;
  issuesCount: number;
  units: DefenseUnitEquipmentDto[];
}

export interface DefenseComplianceIssueDto {
  code:
    | "sameElementTeam"
    | "allBelowFiveStarsTeam"
    | "allNaturalFourTeam"
    | "belowLevelForty"
    | "missingRunes"
    | "missingArtifacts";
  summary: string;
  monsterNames: string[];
  monsterIds?: number[];
  element?: "water" | "fire" | "wind" | "light" | "dark";
  naturalStars?: number;
  affectedMonsterName?: string;
  missingRuneSlots?: number[];
  missingArtifactSlots?: number[];
}

export interface DefenseComplianceAuditDto {
  status: "ok" | "warning";
  summary: string;
  issuesCount: number;
  warningDeadlineAt?: string;
  issues: DefenseComplianceIssueDto[];
}

export interface DefenseDeckSummaryDto {
  context: "guildWar" | "siege";
  deckId?: number;
  assignedBase?: number;
  round?: number;
  ratingId?: number;
  unitIds?: number[];
  team: TeamCompositionDto;
  wins?: number;
  losses?: number;
  draws?: number;
  totalBattles?: number;
  winRate?: number;
  source: string;
  equipmentAudit?: DefenseEquipmentAuditDto;
  complianceAudit?: DefenseComplianceAuditDto;
}

export interface SiegeGuildStandingDto {
  guildId?: number;
  guildName?: string;
  posId?: number;
  ratingId?: number;
  matchScore?: number;
  matchScoreIncrement?: number;
  matchRank?: number;
  attackCount?: number;
  attackUnitCount?: number;
  playMemberCount?: number;
  lastUpdatedAt?: number;
  disqualified?: boolean;
  result: "win" | "loss" | "draw" | "unknown";
}

export interface SiegeMatchSummaryDto {
  siegeId?: number;
  matchId?: number;
  seasonType?: number;
  currentGuildId?: number;
  currentGuildName?: string;
  result: "win" | "loss" | "draw" | "unknown";
  currentGuildStanding?: SiegeGuildStandingDto;
  opponents: SiegeGuildStandingDto[];
  source: string;
  updatedAt?: number;
}

export interface MemberCoverageDto {
  attendance: boolean;
  subjugation: boolean;
  labyrinth: boolean;
  guildWarAttacks: boolean;
  guildWarDefenses: boolean;
  siegeAttacks: boolean;
  siegeDefenses: boolean;
}

export interface MemberProvenanceDto {
  attendance: string[];
  subjugation: string[];
  labyrinth: string[];
  guildWarAttacks: string[];
  guildWarDefenses: string[];
  siegeAttacks: string[];
  siegeDefenses: string[];
}

export interface GuildImportResultDto {
  importRun: {
    id: string;
    sourceFolder: string;
    importedAt: string;
    totalFilesRead: number;
  };
  snapshot: {
    id: string;
    guildId?: number;
    guildName?: string;
    currentUserWizardId?: number;
    generatedAt: string;
    sourceFolder: string;
  };
  sourcesSaved: number;
  membersSaved: number;
  attacksSaved: number;
  defensesSaved: number;
  teamUsageSaved: number;
  authSync?: {
    upserted: number;
    removed: number;
    defaultPasswordApplied: boolean;
  };
}

export interface GuildImportPreviewMemberDto {
  wizardId: number;
  member: {
    wizardId: number;
    wizardName: string;
    guildId?: number;
    guildName?: string;
    guildRole?: "member" | "senior" | "vice-leader" | "leader";
    guildGrade?: number;
    isCurrentUser?: boolean;
  };
  attendance: {
    attendedToday?: boolean;
    rewardClaimed?: boolean;
    date?: string;
  };
  subjugation: {
    clearScore?: number;
    contributeRatio?: number;
    rank?: number;
  };
  labyrinth: {
    score?: number;
    contributionRate?: number;
    rank?: number;
    isMvp?: boolean;
  };
  guildWar: {
    currentAttackCount?: number;
    currentEnergy?: number;
    attacks: AttackBattleRecordDto[];
    teams: TeamUsageSummaryDto[];
    defenses: DefenseDeckSummaryDto[];
  };
  siege: {
    attacks: AttackBattleRecordDto[];
    teams: TeamUsageSummaryDto[];
    defenses: DefenseDeckSummaryDto[];
  };
  coverage: MemberCoverageDto;
  provenance: MemberProvenanceDto;
}

export interface GuildImportPayloadPreviewDto {
  importRun: {
    importedAt: string;
    sourceFolder: string;
    totalFilesRead: number;
  };
  importSources: Array<{
    fileName: string;
    command: string;
    usedInAggregation: boolean;
    priorityOrder: number;
  }>;
  snapshot: {
    generatedAt: string;
    sourceFolder: string;
    filesRead: string[];
    guildId?: number;
    guildName?: string;
    currentUserWizardId?: number;
    siegeMatches: SiegeMatchSummaryDto[];
    mergePolicy: {
      fileOrdering: string;
      duplicateResolution: string;
      notes: string;
    };
  };
  activeRosterWizardIds?: number[];
  members: GuildImportPreviewMemberDto[];
  attacks: Array<unknown>;
  defenses: Array<unknown>;
  teamUsage: Array<unknown>;
}

export interface GuildImportHistoryItemDto {
  importRunId: string;
  snapshotId: string;
  importedAt: string;
  generatedAt: string;
  sourceFolder: string;
  guildId?: number;
  guildName?: string;
  currentUserWizardId?: number;
  totalFilesRead: number;
  sourcesSaved: number;
  membersSaved: number;
  attacksSaved: number;
  defensesSaved: number;
  teamUsageSaved: number;
}

export interface GuildImportHistoryDetailDto {
  history: GuildImportHistoryItemDto;
  importSources: Array<{
    fileName: string;
    command: string;
    usedInAggregation: boolean;
    priorityOrder: number;
  }>;
  snapshot: {
    generatedAt: string;
    sourceFolder: string;
    filesRead: string[];
    guildId?: number;
    guildName?: string;
    currentUserWizardId?: number;
    siegeMatches: SiegeMatchSummaryDto[];
    mergePolicy: {
      fileOrdering: string;
      duplicateResolution: string;
      notes: string;
    };
  };
}

export interface GuildCurrentMemberStateDto {
  guildId?: number;
  guildName?: string;
  importRunId: string;
  snapshotId: string;
  updatedAt: string;
  wizardId: number;
  member: {
    wizardId: number;
    wizardName: string;
    channelUid?: number;
    level?: number;
    ratingId?: number;
    joinedAt?: string;
    guildId?: number;
    guildName?: string;
    guildRole?: "member" | "senior" | "vice-leader" | "leader";
    guildGrade?: number;
    isCurrentUser?: boolean;
  };
  attendance: {
    attendedToday?: boolean;
    rewardClaimed?: boolean;
    date?: string;
  };
  subjugation: {
    clearScore?: number;
    contributeRatio?: number;
    rank?: number;
    lastUpdated?: string;
    weekNum?: number;
    miniBossTypes?: number[];
    bossTypes?: number[];
    battleLogs?: Array<{
      battleType: number;
      clearScore?: number;
      battleCount?: number;
      dateAdd?: string;
      dateMod?: string;
      bossDetected?: boolean;
    }>;
  };
  labyrinth: {
    score?: number;
    contributionRate?: number;
    rank?: number;
    isMvp?: boolean;
  };
  guildWar: {
    currentAttackCount?: number;
    currentEnergy?: number;
    attacks: AttackBattleRecordDto[];
    teams: TeamUsageSummaryDto[];
    defenses: DefenseDeckSummaryDto[];
  };
  siege: {
    attacks: AttackBattleRecordDto[];
    teams: TeamUsageSummaryDto[];
    defenses: DefenseDeckSummaryDto[];
  };
  coverage: MemberCoverageDto;
  provenance: MemberProvenanceDto;
}

export interface GuildCurrentStateDto {
  guildId?: number;
  guildName?: string;
  importRunId: string;
  snapshotId: string;
  updatedAt: string;
  activeRosterWizardIds?: number[];
  labyrinthStatus?: {
    startAt?: string;
    finishAt?: string;
    nextStartAt?: string;
    status?: number;
  };
  siegeMatches: SiegeMatchSummaryDto[];
  members: GuildCurrentMemberStateDto[];
}

export interface LabyrinthParticipationEntryDto {
  wizardId: number;
  memberName: string;
  validAttacks: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface LabyrinthCycleDto {
  guildId?: number;
  guildName?: string;
  cycleStartDate: string;
  expectedDurationDays: number;
  requiredAttacksByDay: number[];
  actualDurationDays?: number;
  isConcluded: boolean;
  concludedAt?: string;
  concludedBy?: string;
  updatedAt: string;
  updatedBy?: string;
  entries: LabyrinthParticipationEntryDto[];
}

export type WeeklyPunishmentEventKey =
  | "guildWar"
  | "siege"
  | "guildWarDefenseSetup"
  | "siegeDefenseSetup"
  | "guildWarDefenseCompliance"
  | "siegeDefenseCompliance"
  | "labyrinth"
  | "subjugation";

export interface WeeklyPunishmentEventAssessmentDto {
  eventKey: WeeklyPunishmentEventKey;
  label: string;
  required: boolean;
  completed: number;
  expected: number;
  punishmentApplied: boolean;
  reason: string;
}

export interface GuildWeeklyPunishmentDto {
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  evaluatedAt: string;
  guildId?: number;
  guildName?: string;
  importRunId: string;
  snapshotId: string;
  wizardId: number;
  memberName: string;
  role?: "member" | "senior" | "vice-leader" | "leader";
  cooldownActive: boolean;
  punishmentApplied: boolean;
  markedForRemoval: boolean;
  punishedEventKeys: WeeklyPunishmentEventKey[];
  reasonSummary: string;
  removalReasonSummary?: string;
  nextEligiblePenaltyAt?: string;
  events: WeeklyPunishmentEventAssessmentDto[];
}

export interface ImportGuildFilesResponseDto {
  success: boolean;
  result?: GuildImportResultDto;
  payload?: GuildImportPayloadPreviewDto;
  error?: string;
  message?: string;
}

export interface ImportHistoryListResponseDto {
  success: boolean;
  history?: GuildImportHistoryItemDto[];
  error?: string;
  message?: string;
}

export interface ImportHistoryDetailResponseDto {
  success: boolean;
  detail?: GuildImportHistoryDetailDto;
  error?: string;
  message?: string;
}

export interface CurrentGuildStateResponseDto {
  success: boolean;
  currentState?: GuildCurrentStateDto;
  error?: string;
  message?: string;
}

export interface WeeklyPunishmentsResponseDto {
  success: boolean;
  punishments?: GuildWeeklyPunishmentDto[];
  run?: {
    weekKey: string;
    evaluatedAt: string;
    saved: number;
    skipped: boolean;
    reason: string;
  };
  error?: string;
  message?: string;
}

export interface LabyrinthCycleResponseDto {
  success: boolean;
  cycle?: LabyrinthCycleDto;
  error?: string;
  message?: string;
}

export type BatchUploadProgress = {
  batchIndex: number;
  totalBatches: number;
  filesInBatch: number;
  batchFileNames: string[];
  completedFiles: number;
  completedFileNames: string[];
  stage: "preparing" | "uploading" | "completed";
};

export type ImportGuildFilesBatchResultDto = {
  responses: ImportGuildFilesResponseDto[];
  totalBatches: number;
  totalFiles: number;
};

const DEFAULT_IMPORT_BATCH_MB = Number(
  (import.meta.env.VITE_GUILD_IMPORT_BATCH_MB as string | undefined) ?? 40,
);

export const DEFAULT_GUILD_IMPORT_ENDPOINT = `${API_BASE_URL}/api/guild/import-files`;
export const DEFAULT_GUILD_IMPORT_HISTORY_ENDPOINT = `${API_BASE_URL}/api/guild/import-history`;
export const DEFAULT_GUILD_CURRENT_STATE_ENDPOINT = `${API_BASE_URL}/api/guild/current-state`;
export const DEFAULT_GUILD_PUNISHMENTS_ENDPOINT = `${API_BASE_URL}/api/guild/punishments`;
export const DEFAULT_GUILD_RUN_WEEKLY_PUNISHMENTS_ENDPOINT = `${API_BASE_URL}/api/guild/punishments/run-weekly-evaluation`;
export const DEFAULT_GUILD_LABYRINTH_CYCLE_ENDPOINT = `${API_BASE_URL}/api/guild/labyrinth-cycle/current`;
export const DEFAULT_GUILD_IMPORT_BATCH_BYTES = Math.max(1, DEFAULT_IMPORT_BATCH_MB) * 1024 * 1024;

export const GUILD_IMPORT_COMPLETED_EVENT = "guild-import:completed";
const LAST_IMPORT_RUN_ID_STORAGE_KEY = "guild-import:last-import-run-id";
const LAST_GUILD_ID_STORAGE_KEY = "guild-import:last-guild-id";

type GuildImportCompletedEventDetail = {
  importRunId: string;
  snapshotId: string;
  importedAt: string;
  guildId?: number;
  guildName?: string;
};

const getUploadedFileBytes = (file: UploadedGuildFileDto) => new TextEncoder().encode(file.content).length;

export function splitUploadedGuildFilesIntoBatches(
  files: UploadedGuildFileDto[],
  maxBatchBytes = DEFAULT_GUILD_IMPORT_BATCH_BYTES,
): UploadedGuildFileDto[][] {
  const batches: UploadedGuildFileDto[][] = [];
  let currentBatch: UploadedGuildFileDto[] = [];
  let currentBytes = 0;

  for (const file of files) {
    const fileBytes = getUploadedFileBytes(file);

    if (currentBatch.length > 0 && currentBytes + fileBytes > maxBatchBytes) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBytes = 0;
    }

    currentBatch.push(file);
    currentBytes += fileBytes;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

export function notifyGuildImportCompleted(detail: GuildImportCompletedEventDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(LAST_IMPORT_RUN_ID_STORAGE_KEY, detail.importRunId);
  if (detail.guildId !== undefined) {
    window.sessionStorage.setItem(LAST_GUILD_ID_STORAGE_KEY, String(detail.guildId));
  }
  window.dispatchEvent(new CustomEvent<GuildImportCompletedEventDetail>(GUILD_IMPORT_COMPLETED_EVENT, { detail }));
}

export function readLastGuildImportRunId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(LAST_IMPORT_RUN_ID_STORAGE_KEY);
}

export function clearLastGuildImportRunId() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(LAST_IMPORT_RUN_ID_STORAGE_KEY);
}

export function readLastGuildId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(LAST_GUILD_ID_STORAGE_KEY);
}

export function clearLastGuildId() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(LAST_GUILD_ID_STORAGE_KEY);
}

export async function filesToUploadedGuildFiles(
  files: FileList | File[],
): Promise<UploadedGuildFileDto[]> {
  const list = Array.from(files);

  const uploadedFiles = await Promise.all(
    list
      .filter((file) => file.name.toLowerCase().endsWith(".json"))
      .map(async (file) => ({
        fileName: file.name,
        content: await file.text(),
      })),
  );

  return uploadedFiles.sort((left, right) => left.fileName.localeCompare(right.fileName));
}

export async function buildImportGuildFilesRequest(
  files: FileList | File[],
  sourceLabel = "upload://frontend",
): Promise<ImportGuildFilesRequestDto> {
  return {
    files: await filesToUploadedGuildFiles(files),
    sourceLabel,
  };
}

export async function importGuildFiles(
  request: ImportGuildFilesRequestDto,
  endpoint = DEFAULT_GUILD_IMPORT_ENDPOINT,
): Promise<ImportGuildFilesResponseDto> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as ImportGuildFilesResponseDto;

  if (!response.ok) {
    throw new Error(payload.message ?? "Falha ao importar os arquivos da guilda.");
  }

  return payload;
}

export async function importGuildFilesInBatches(
  request: ImportGuildFilesRequestDto,
  endpoint = DEFAULT_GUILD_IMPORT_ENDPOINT,
  maxBatchBytes = DEFAULT_GUILD_IMPORT_BATCH_BYTES,
  onProgress?: (progress: BatchUploadProgress) => void,
): Promise<ImportGuildFilesBatchResultDto> {
  const batches = splitUploadedGuildFilesIntoBatches(request.files, maxBatchBytes);
  const responses: ImportGuildFilesResponseDto[] = [];
  const completedFileNames: string[] = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const batchFileNames = batch.map((file) => file.fileName);

    onProgress?.({
      batchIndex: index + 1,
      totalBatches: batches.length,
      filesInBatch: batch.length,
      batchFileNames,
      completedFiles: completedFileNames.length,
      completedFileNames: [...completedFileNames],
      stage: index === 0 && completedFileNames.length === 0 ? "preparing" : "uploading",
    });

    const batchSourceLabel = batches.length > 1
      ? `${request.sourceLabel ?? "upload://frontend"} [batch ${index + 1}/${batches.length}]`
      : request.sourceLabel;

    const response = await importGuildFiles(
      {
        files: batch,
        sourceLabel: batchSourceLabel,
      },
      endpoint,
    );

    responses.push(response);
    completedFileNames.push(...batchFileNames);

    onProgress?.({
      batchIndex: index + 1,
      totalBatches: batches.length,
      filesInBatch: batch.length,
      batchFileNames,
      completedFiles: completedFileNames.length,
      completedFileNames: [...completedFileNames],
      stage: index + 1 === batches.length ? "completed" : "uploading",
    });
  }

  return {
    responses,
    totalBatches: batches.length,
    totalFiles: request.files.length,
  };
}

export async function fetchGuildImportHistory(
  endpoint = DEFAULT_GUILD_IMPORT_HISTORY_ENDPOINT,
): Promise<GuildImportHistoryItemDto[]> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json()) as ImportHistoryListResponseDto;

  if (!response.ok) {
    throw new Error(payload.message ?? "Falha ao carregar o histórico de importações.");
  }

  return payload.history ?? [];
}

export async function fetchGuildImportHistoryDetail(
  importRunId: string,
  endpoint = DEFAULT_GUILD_IMPORT_HISTORY_ENDPOINT,
): Promise<GuildImportHistoryDetailDto> {
  const response = await fetch(`${endpoint}/${encodeURIComponent(importRunId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json()) as ImportHistoryDetailResponseDto;

  if (!response.ok || !payload.detail) {
    throw new Error(payload.message ?? "Falha ao carregar os detalhes da importação.");
  }

  return payload.detail;
}

export async function fetchGuildCurrentState(
  endpoint = DEFAULT_GUILD_CURRENT_STATE_ENDPOINT,
  guildId?: string | number,
): Promise<GuildCurrentStateDto> {
  const query = guildId !== undefined && guildId !== null && `${guildId}`.trim() !== ""
    ? `?guildId=${encodeURIComponent(String(guildId))}`
    : "";

  const response = await fetch(`${endpoint}${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json()) as CurrentGuildStateResponseDto;

  if (!response.ok || !payload.currentState) {
    throw new Error(payload.message ?? "Falha ao carregar o estado atual da guilda.");
  }

  return payload.currentState;
}

export async function fetchGuildWeeklyPunishments(
  accessToken: string,
  weekKey?: string,
  endpoint = DEFAULT_GUILD_PUNISHMENTS_ENDPOINT,
): Promise<GuildWeeklyPunishmentDto[]> {
  const query = weekKey ? `?weekKey=${encodeURIComponent(weekKey)}` : "";
  const response = await fetch(`${endpoint}${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as WeeklyPunishmentsResponseDto;

  if (!response.ok) {
    throw new Error(payload.message ?? "Falha ao carregar as punições semanais.");
  }

  return payload.punishments ?? [];
}

export async function runGuildWeeklyPunishmentEvaluation(
  accessToken: string,
  endpoint = DEFAULT_GUILD_RUN_WEEKLY_PUNISHMENTS_ENDPOINT,
): Promise<NonNullable<WeeklyPunishmentsResponseDto["run"]>> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  const payload = (await response.json()) as WeeklyPunishmentsResponseDto;

  if (!response.ok || !payload.run) {
    throw new Error(payload.message ?? "Falha ao executar a avaliação semanal de punições.");
  }

  return payload.run;
}

export async function fetchCurrentLabyrinthCycle(
  accessToken: string,
  endpoint = DEFAULT_GUILD_LABYRINTH_CYCLE_ENDPOINT,
): Promise<LabyrinthCycleDto> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as LabyrinthCycleResponseDto;

  if (!response.ok || !payload.cycle) {
    throw new Error(payload.message ?? "Falha ao carregar o ciclo manual do labirinto.");
  }

  return payload.cycle;
}

type UpsertLabyrinthCycleRequest = {
  actualDurationDays?: number;
  requiredAttacksByDay?: number[];
  entries: Array<{
    wizardId: number;
    memberName?: string;
    validAttacks: number;
  }>;
};

export async function saveCurrentLabyrinthCycle(
  accessToken: string,
  request: UpsertLabyrinthCycleRequest,
  endpoint = DEFAULT_GUILD_LABYRINTH_CYCLE_ENDPOINT,
): Promise<LabyrinthCycleDto> {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as LabyrinthCycleResponseDto;

  if (!response.ok || !payload.cycle) {
    throw new Error(payload.message ?? "Falha ao salvar o ciclo manual do labirinto.");
  }

  return payload.cycle;
}

export async function concludeCurrentLabyrinthCycle(
  accessToken: string,
  request: UpsertLabyrinthCycleRequest,
  endpoint = DEFAULT_GUILD_LABYRINTH_CYCLE_ENDPOINT,
): Promise<LabyrinthCycleDto> {
  const response = await fetch(`${endpoint}/conclude`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as LabyrinthCycleResponseDto;

  if (!response.ok || !payload.cycle) {
    throw new Error(payload.message ?? "Falha ao concluir o ciclo manual do labirinto.");
  }

  return payload.cycle;
}
