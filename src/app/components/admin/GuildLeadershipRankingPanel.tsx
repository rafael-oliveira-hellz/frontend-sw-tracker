import { ShieldAlert, ShieldCheck, Swords, UserX } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { useGuildWeek } from "../../context/GuildWeekContext";
import { buildGuildActivityOverview } from "../../lib/guildActivity";
import type { GuildCurrentStateDto, GuildWeeklyPunishmentDto } from "../../lib/guildImport";
import { useWeeklyPunishments } from "../../lib/useWeeklyPunishments";
import { DisciplineStatus, resolveDisciplineCopy } from "../shared/DisciplineStatus";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type RankingItem = {
  wizardId: number;
  memberName: string;
  details: string[];
  disciplineStatus: "punished" | "cooldown" | "clear";
  disciplineSummary: string;
  markedForRemoval?: boolean;
  removalReasonSummary?: string;
};

type DisciplineFilter = "all" | "punished" | "cooldown" | "clear";

const windowLabel = (label: string, completed: number, expected: number, winRate?: number) =>
  `${label}: ${completed}/${expected}${winRate !== undefined ? ` • WR ${winRate.toFixed(0)}%` : ""}`;

function RankingSection({
  title,
  description,
  emptyLabel,
  icon: Icon,
  accentClassName,
  items,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClassName: string;
  items: RankingItem[];
}) {
  return (
    <Card className="border border-slate-700/60 bg-slate-900/50">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl border p-2 ${accentClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            <CardDescription className="text-slate-300">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.wizardId} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{item.memberName}</p>
                  <p className="text-xs text-slate-400">{item.disciplineSummary}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <DisciplineStatus
                    punishment={
                      item.disciplineStatus === "punished"
                        ? ({
                            punishmentApplied: true,
                            cooldownActive: false,
                            reasonSummary: item.disciplineSummary,
                            events: [],
                          } as GuildWeeklyPunishmentDto)
                        : item.disciplineStatus === "cooldown"
                          ? ({
                              punishmentApplied: false,
                              cooldownActive: true,
                              reasonSummary: item.disciplineSummary,
                              events: [],
                            } as GuildWeeklyPunishmentDto)
                          : ({
                              punishmentApplied: false,
                              cooldownActive: false,
                              reasonSummary: item.disciplineSummary,
                              events: [],
                            } as GuildWeeklyPunishmentDto)
                    }
                    labels={{
                      punished: "Suspenso",
                      cooldown: "Suspenso",
                      clear: "Liberado",
                    }}
                  />
                  <Badge className="border-slate-700 bg-slate-900/70 text-slate-200">
                    {item.details.length} alerta{item.details.length > 1 ? "s" : ""}
                  </Badge>
                  {item.markedForRemoval ? (
                    <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100">
                      Marcado para remoção
                    </Badge>
                  ) : null}
                </div>
              </div>
              {item.removalReasonSummary ? (
                <p className="mt-2 text-xs text-fuchsia-200">{item.removalReasonSummary}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {item.details.map((detail) => (
                  <Badge
                    key={`${item.wizardId}-${detail}`}
                    className="border-slate-700/80 bg-slate-900/80 text-slate-200"
                  >
                    {detail}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function getDisciplineMeta(
  punishment: GuildWeeklyPunishmentDto | undefined,
): Pick<RankingItem, "disciplineStatus" | "disciplineSummary"> {
  if (punishment?.punishmentApplied) {
      return {
        disciplineStatus: "punished",
        disciplineSummary: resolveDisciplineCopy(punishment).reasonSummary,
      };
  }

  if (punishment?.cooldownActive) {
      return {
        disciplineStatus: "cooldown",
        disciplineSummary: resolveDisciplineCopy(punishment).reasonSummary,
      };
  }

  return {
    disciplineStatus: "clear",
    disciplineSummary: "Semana liberada, sem punição registrada.",
  };
}

export default function GuildLeadershipRankingPanel({
  currentState,
}: {
  currentState: GuildCurrentStateDto | null;
}) {
  const { selectedWeekKey, setSelectedWeekKey } = useGuildWeek();
  const { punishments } = useWeeklyPunishments(selectedWeekKey || undefined);
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>("all");
  const overview = useMemo(
    () => buildGuildActivityOverview(currentState, { weekKey: selectedWeekKey, historyStart: "2026-04-05" }),
    [currentState, selectedWeekKey],
  );

  useEffect(() => {
    if (overview && !selectedWeekKey) {
      setSelectedWeekKey(overview.selectedWeek.key);
    }
  }, [overview, selectedWeekKey, setSelectedWeekKey]);

  const punishmentMap = useMemo(
    () => new Map(punishments.map((punishment) => [punishment.wizardId, punishment])),
    [punishments],
  );

  const filterItemsByDiscipline = (items: RankingItem[]) => {
    if (disciplineFilter === "all") {
      return items;
    }

    return items.filter((item) => item.disciplineStatus === disciplineFilter);
  };

  const gwCompleted = useMemo<RankingItem[]>(() => {
    if (!overview) return [];

    return overview.members
      .filter(
        (row) =>
          row.guildWar.windows.length === 2 &&
          row.guildWar.windows.every((window) => window.completed >= window.expected),
      )
      .map((row) => ({
        wizardId: row.wizardId,
        memberName: row.memberName,
        details: row.guildWar.windows.map((window) =>
          windowLabel(window.label, window.completed, window.expected, window.winRate),
        ),
        ...getDisciplineMeta(punishmentMap.get(row.wizardId)),
      }));
  }, [overview, punishmentMap]);

  const siegeBelowGoal = useMemo<RankingItem[]>(() => {
    if (!overview) return [];

    return overview.members
      .map((row) => {
        const flaggedWindows = row.siege.windows.filter(
          (window) => window.completed > 0 && !window.meetsWinRateGoal,
        );

        if (flaggedWindows.length === 0) {
          return null;
        }

        return {
          wizardId: row.wizardId,
          memberName: row.memberName,
          details: flaggedWindows.map((window) =>
            windowLabel(window.label, window.completed, window.expected, window.winRate),
          ),
          ...getDisciplineMeta(punishmentMap.get(row.wizardId)),
        };
      })
      .filter((item): item is RankingItem => item !== null);
  }, [overview, punishmentMap]);

  const missingWindowAttacks = useMemo<RankingItem[]>(() => {
    if (!overview) return [];

    return overview.members
      .map((row) => {
        const missingWindows = [...row.guildWar.windows, ...row.siege.windows].filter(
          (window) => window.completed === 0,
        );

        if (missingWindows.length === 0) {
          return null;
        }

        return {
          wizardId: row.wizardId,
          memberName: row.memberName,
          details: missingWindows.map((window) => `${window.label} • ${window.daysLabel} • sem ataques`),
          ...getDisciplineMeta(punishmentMap.get(row.wizardId)),
        };
      })
      .filter((item): item is RankingItem => item !== null);
  }, [overview, punishmentMap]);

  const punishedMembers = useMemo<RankingItem[]>(() => {
    return punishments
      .filter((punishment) => punishment.punishmentApplied)
      .map((punishment) => ({
        wizardId: punishment.wizardId,
        memberName: punishment.memberName,
        details: punishment.events
          .filter((event) => event.punishmentApplied)
          .map((event) => `${event.label}: ${event.completed}/${event.expected} • ${event.reason}`),
        disciplineStatus: "punished",
        disciplineSummary: punishment.reasonSummary,
        markedForRemoval: punishment.markedForRemoval,
        removalReasonSummary: punishment.removalReasonSummary,
      }));
  }, [punishments]);

  const cooldownMembers = useMemo<RankingItem[]>(() => {
    return punishments
      .filter((punishment) => !punishment.punishmentApplied && punishment.cooldownActive)
      .map((punishment) => ({
        wizardId: punishment.wizardId,
        memberName: punishment.memberName,
        details: [
          punishment.nextEligiblePenaltyAt
            ? `Nova elegibilidade: ${new Date(punishment.nextEligiblePenaltyAt).toLocaleString("pt-BR")}`
            : punishment.reasonSummary,
        ],
        disciplineStatus: "cooldown",
        disciplineSummary: punishment.reasonSummary,
        markedForRemoval: punishment.markedForRemoval,
        removalReasonSummary: punishment.removalReasonSummary,
      }));
  }, [punishments]);

  const removalMarkedMembers = useMemo<RankingItem[]>(() => {
    return punishments
      .filter((punishment) => punishment.markedForRemoval)
      .map((punishment) => ({
        wizardId: punishment.wizardId,
        memberName: punishment.memberName,
        details: [
          punishment.removalReasonSummary ?? "Marcado para remoção por ausência na semana de punição.",
        ],
        disciplineStatus: punishment.punishmentApplied
          ? "punished"
          : punishment.cooldownActive
            ? "cooldown"
            : "clear",
        disciplineSummary: punishment.reasonSummary,
        markedForRemoval: true,
        removalReasonSummary: punishment.removalReasonSummary,
      }));
  }, [punishments]);

  const punishmentCounts = useMemo(
    () => ({
      punished: punishments.filter((entry) => entry.punishmentApplied).length,
      cooldown: punishments.filter((entry) => !entry.punishmentApplied && entry.cooldownActive).length,
      removal: punishments.filter((entry) => entry.markedForRemoval).length,
      clear: overview
        ? Math.max(
            overview.members.length -
              punishments.filter((entry) => entry.punishmentApplied || entry.cooldownActive).length,
            0,
          )
        : 0,
    }),
    [overview, punishments],
  );

  if (!overview) {
    return (
      <Card className="border-2 border-cyan-500/30 bg-slate-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Rankings de liderança</CardTitle>
          <CardDescription className="text-slate-300">
            Este bloco aparece quando o estado atual da guilda já estiver consolidado no backend.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-cyan-500/30 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2">
            <Swords className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <CardTitle className="text-white">Rankings de liderança</CardTitle>
            <CardDescription className="text-slate-300">
              Semana de {overview.selectedWeek.label} • leitura por janela para cobrança de presença e WR mínimo de 80% em GW e assalto.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDisciplineFilter("all")}
            className={`clandestino-badge cursor-pointer ${
              disciplineFilter === "all"
                ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                : "border-slate-700 bg-slate-900/70 text-slate-300"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setDisciplineFilter("punished")}
            className={`clandestino-badge cursor-pointer ${
              disciplineFilter === "punished"
                ? "clandestino-badge--danger"
                : "border-slate-700 bg-slate-900/70 text-slate-300"
            }`}
          >
            Suspensos ({punishmentCounts.punished})
          </button>
          <button
            type="button"
            onClick={() => setDisciplineFilter("cooldown")}
            className={`clandestino-badge cursor-pointer ${
              disciplineFilter === "cooldown"
                ? "clandestino-badge--warning"
                : "border-slate-700 bg-slate-900/70 text-slate-300"
            }`}
          >
            Ainda suspensos ({punishmentCounts.cooldown})
          </button>
          <button
            type="button"
            onClick={() => setDisciplineFilter("clear")}
            className={`clandestino-badge cursor-pointer ${
              disciplineFilter === "clear"
                ? "clandestino-badge--success"
                : "border-slate-700 bg-slate-900/70 text-slate-300"
            }`}
          >
            Liberados ({punishmentCounts.clear})
          </button>
          <button
            type="button"
            onClick={() => setDisciplineFilter("all")}
            className="clandestino-badge cursor-default border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100"
          >
            Marcados para remoção ({punishmentCounts.removal})
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-3">
          <RankingSection
            title="Fecharam as 2 GW da semana"
            description="Membros que completaram as duas janelas de Batalha de Guilda dentro da semana escolhida."
            emptyLabel="Ninguém fechou as duas GW nesta semana."
            icon={ShieldCheck}
            accentClassName="border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            items={filterItemsByDiscipline(gwCompleted)}
          />
          <RankingSection
            title="Abaixo de 80% em Siege 1 ou 2"
            description="Janelas de assalto com ataques registrados, mas WR abaixo da meta mínima."
            emptyLabel="Nenhum membro ficou abaixo de 80% nas janelas de assalto desta semana."
            icon={ShieldAlert}
            accentClassName="border-amber-500/30 bg-amber-500/10 text-amber-200"
            items={filterItemsByDiscipline(siegeBelowGoal)}
          />
          <RankingSection
            title="Sem ataque em alguma janela"
            description="Mostra quem não atacou em uma janela específica de GW ou assalto."
            emptyLabel="Todos os membros com dados atacaram em todas as janelas rastreadas desta semana."
            icon={UserX}
            accentClassName="border-rose-500/30 bg-rose-500/10 text-rose-200"
            items={filterItemsByDiscipline(missingWindowAttacks)}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <RankingSection
            title="Marcados para remoção"
            description="Membros com punição ativa que seguiram sem subjugação ou sem lab ativo na mesma semana."
            emptyLabel="Ninguém foi marcado para remoção nesta semana."
            icon={UserX}
            accentClassName="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100"
            items={removalMarkedMembers}
          />
          <RankingSection
            title="Suspensos na semana"
            description="Membros que ficaram punidos na semana selecionada por não cumprir algum conteúdo obrigatório."
            emptyLabel="Ninguém ficou de castigo nesta semana."
            icon={ShieldAlert}
            accentClassName="border-red-500/30 bg-red-500/10 text-red-200"
            items={filterItemsByDiscipline(punishedMembers)}
          />
          <RankingSection
            title="Ainda suspensos por 15 dias"
            description="Membros que não recebem nova punição nesta semana porque já foram punidos recentemente."
            emptyLabel="Ninguém está em carência nesta semana."
            icon={ShieldCheck}
            accentClassName="border-amber-500/30 bg-amber-500/10 text-amber-200"
            items={filterItemsByDiscipline(cooldownMembers)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
