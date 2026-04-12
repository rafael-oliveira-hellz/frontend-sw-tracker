import type { TeamCompositionDto } from "./guildImport";
import { DISCOVERED_MONSTER_NAMES } from "./monsterCatalog.data";

const looksLikeNumericTeamLabel = (value: string) =>
  /^\s*\d+(\s*[,/|-]\s*\d+)*\s*$/.test(value);

const looksLikeFallbackMonsterName = (value: string) =>
  /^\s*monstro\s*#\s*\d+\s*$/i.test(value);

export function getMonsterName(monsterId: number, explicitName?: string): string | undefined {
  const cleanedExplicitName = explicitName?.trim();
  if (cleanedExplicitName && !looksLikeFallbackMonsterName(cleanedExplicitName)) {
    return cleanedExplicitName;
  }

  return DISCOVERED_MONSTER_NAMES[monsterId];
}

export function formatMonsterName(monsterId: number, explicitName?: string): string {
  return getMonsterName(monsterId, explicitName) ?? `Monstro #${monsterId}`;
}

export function formatMonsterList(monsterIds: number[], monsterNames?: string[]): string {
  return monsterIds
    .map((monsterId, index) => formatMonsterName(monsterId, monsterNames?.[index]))
    .join(", ");
}

export function formatTeamLabel(team: TeamCompositionDto): string {
  if (team.monsterNames?.length) {
    return team.monsters
      .map((monsterId, index) => formatMonsterName(monsterId, team.monsterNames?.[index]))
      .join(" / ");
  }

  if (team.label && !looksLikeNumericTeamLabel(team.label)) {
    return team.label;
  }

  return formatMonsterList(team.monsters, team.monsterNames);
}
