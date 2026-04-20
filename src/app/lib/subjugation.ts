import type { GuildCurrentMemberStateDto } from "./guildImport";

type SubjugationLike = GuildCurrentMemberStateDto["subjugation"];

const FALLBACK_FULL_CLEAR_MIN_SCORE = 4_200_000;

const uniqueSorted = (values: number[] | undefined, min: number, max: number) =>
  [...new Set((values ?? []).map((value) => Math.trunc(value)))]
    .filter((value) => value >= min && value <= max)
    .sort((left, right) => left - right);

export type SubjugationStatus = {
  score: number;
  hasLogs: boolean;
  hasAnyParticipation: boolean;
  completedMiniBosses: number;
  completedBosses: number;
  miniBossTypes: number[];
  bossTypes: number[];
  completed: boolean;
  incomplete: boolean;
  frontsCompleted: number;
  frontsExpected: number;
};

export const getSubjugationStatus = (subjugation?: SubjugationLike): SubjugationStatus => {
  const score = Math.max(0, Math.trunc(subjugation?.clearScore ?? 0));
  const miniBossTypes = uniqueSorted(subjugation?.miniBossTypes, 101, 103);
  const bossTypes = uniqueSorted(subjugation?.bossTypes, 201, 299);
  const hasLogs =
    (subjugation?.battleLogs?.length ?? 0) > 0 ||
    miniBossTypes.length > 0 ||
    bossTypes.length > 0;
  const completedMiniBosses = miniBossTypes.length;
  const completedBosses = bossTypes.length > 0 ? 1 : 0;
  const completed = hasLogs
    ? completedMiniBosses >= 3 && completedBosses > 0
    : score >= FALLBACK_FULL_CLEAR_MIN_SCORE;
  const hasAnyParticipation = hasLogs || score > 0;
  const incomplete = hasAnyParticipation && !completed;

  return {
    score,
    hasLogs,
    hasAnyParticipation,
    completedMiniBosses,
    completedBosses,
    miniBossTypes,
    bossTypes,
    completed,
    incomplete,
    frontsCompleted: completedMiniBosses + completedBosses,
    frontsExpected: 4,
  };
};

export const getSubjugationDisplay = (subjugation?: SubjugationLike) => {
  const status = getSubjugationStatus(subjugation);

  if (status.completed) {
    return {
      label: `Score ${status.score.toLocaleString("pt-BR")} • Rank ${subjugation?.rank ?? "-"}`,
      hint: "Subjugação concluída no ciclo atual",
    };
  }

  if (status.incomplete) {
    return {
      label: "Subjugação incompleta",
      hint: status.hasLogs
        ? `${status.completedMiniBosses}/3 minibosses e ${status.completedBosses}/1 boss registrados`
        : "Participação parcial registrada no ciclo atual",
    };
  }

  return {
    label: "Sem participação registrada",
    hint: "Nenhum ataque de subjugação identificado no ciclo atual",
  };
};
