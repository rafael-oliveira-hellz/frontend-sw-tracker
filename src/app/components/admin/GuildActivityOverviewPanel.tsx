import { CalendarRange, Compass, Shield, Skull, Swords } from "lucide-react";
import React, { useEffect, useMemo } from "react";

import {
  buildGuildActivityOverview,
  type DailyAttackBreakdown,
  type GuildActivityEventCard,
  type GuildActivityEventKey,
  type WeeklyMemberActivityRow,
} from "../../lib/guildActivity";
import { useGuildWeek } from "../../context/GuildWeekContext";
import { formatTeamLabel } from "../../lib/monsterCatalog";
import type { GuildCurrentStateDto, GuildWeeklyPunishmentDto } from "../../lib/guildImport";
import { useWeeklyPunishments } from "../../lib/useWeeklyPunishments";
import { DisciplineStatus, resolveDisciplineCopy } from "../shared/DisciplineStatus";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const EVENT_ICON: Record<GuildActivityEventKey, React.ComponentType<{ className?: string }>> = {
  labyrinth: Compass,
  guildWar: Shield,
  siege: Swords,
  subjugation: Skull,
};

const EVENT_ACCENT: Record<GuildActivityEventKey, string> = {
  labyrinth: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  guildWar: "text-green-300 border-green-500/30 bg-green-500/10",
  siege: "text-red-300 border-red-500/30 bg-red-500/10",
  subjugation: "text-amber-300 border-amber-500/30 bg-amber-500/10",
};

const formatPercent = (value: number) => `${value.toFixed(0)}%`;

const formatHighlightLabel = (eventKey: GuildActivityEventKey, label: string, position: number) => {
  if (!["labyrinth", "subjugation"].includes(eventKey)) {
    return label;
  }

  return label.replace(/Rank\s+\d+/i, `Top ${position}`);
};

function DailyBreakdownList({ items }: { items: DailyAttackBreakdown[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500">Nenhum ataque com data identificada nesta semana.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.dayKey}
          className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
        >
          <p className="font-medium text-white">{item.dateLabel}</p>
          <p>GW {item.guildWarEntries} entrada(s) ({item.guildWarBattles} batalha(s))</p>
          <p>Siege {item.siegeAttacks} ataque(s) • Total {item.totalActions} ação(ões)</p>
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: GuildActivityEventCard }) {
  const Icon = EVENT_ICON[event.eventKey];

  return (
    <Card className="border border-slate-700/60 bg-slate-900/50">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl border p-2 ${EVENT_ACCENT[event.eventKey]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white">{event.title}</CardTitle>
              <CardDescription className="text-slate-400">{event.cadenceLabel}</CardDescription>
            </div>
          </div>
          <Badge className={`clandestino-badge border ${EVENT_ACCENT[event.eventKey]}`}>{formatPercent(event.completionRate)}</Badge>
        </div>
        <div className="text-xs text-slate-400">
          <p>{event.durationLabel}</p>
          <p>{event.expectationLabel}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Progresso consolidado</span>
            <span>{event.totalCompleted}/{event.totalExpected}</span>
          </div>
          <Progress value={event.completionRate} className="h-2.5" />
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-slate-500">Membros com dados</p>
            <p className="text-lg font-semibold text-white">{event.membersWithData}/{event.totalMembers}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-slate-500">Membros completos</p>
            <p className="text-lg font-semibold text-white">{event.fullyCompletedMembers}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-slate-500">Top composições</p>
            <p className="text-lg font-semibold text-white">{event.topTeams.length}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Destaques por membro</p>
            <div className="space-y-2">
              {event.topMembers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-500">
                  Nenhum registro consolidado ainda.
                </div>
              ) : (
                event.topMembers.map((member, index) => (
                  <div
                    key={`${event.eventKey}-${member.wizardId}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{member.memberName}</p>
                      <Badge className="clandestino-badge clandestino-badge--neutral">
                        {member.completed}/{member.expected}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatHighlightLabel(event.eventKey, member.label, index + 1)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Composições mais usadas
            </p>
            <div className="space-y-2">
              {event.topTeams.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-500">
                  Este evento não tem composições rastreadas nesta semana.
                </div>
              ) : (
                event.topTeams.map((team) => (
                  <div
                    key={`${event.eventKey}-${team.team.signature}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{formatTeamLabel(team.team)}</p>
                      <Badge className="clandestino-badge clandestino-badge--neutral">
                        WR {team.winRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {team.totalBattles} usos • {team.team.monsters.length} monstros
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyRow({
  row,
  punishment,
}: {
  row: WeeklyMemberActivityRow;
  punishment?: GuildWeeklyPunishmentDto;
}) {
  const currentDiscipline = resolveDisciplineCopy(punishment);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-white">{row.memberName}</p>
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-200">
              {formatPercent(row.overallCompletionRate)}
            </Badge>
            <DisciplineStatus punishment={punishment} hideWhenClear />
          </div>
          <p className="text-xs text-slate-500">
            {row.completedEvents}/{row.totalEvents} frentes concluídas • atualizado em {new Date(row.updatedAt).toLocaleString()}
          </p>
            {currentDiscipline.state !== "clear" && currentDiscipline.reasonSummary ? (
              <p className="mt-1 text-xs text-slate-400">{currentDiscipline.reasonSummary}</p>
            ) : null}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
          {row.totalTrackedAttacks} ações rastreadas na semana
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">Batalha de Guilda</p>
          <p className="mt-1 text-sm font-semibold text-white">{row.guildWar.label}</p>
          <p className="mt-1 text-xs text-slate-400">{row.guildWar.hint}</p>
          <p className="mt-1 text-xs text-slate-500">W {row.guildWar.wins} • L {row.guildWar.losses} • D {row.guildWar.draws}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {row.guildWar.windows.map((window) => (
              <Badge
                key={window.key}
                className={
                  window.meetsWinRateGoal
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                }
              >
                {window.label}: {window.entryCount ?? 0}/{window.expectedEntries ?? 0} entradas • {window.completed}/{window.expected} batalhas • WR {window.winRate.toFixed(0)}%
              </Badge>
            ))}
          </div>
          {row.guildWar.teamsUsed[0] && (
            <p className="mt-1 text-xs text-slate-500">Time principal: {formatTeamLabel(row.guildWar.teamsUsed[0].team)}</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">Batalha de Assalto</p>
          <p className="mt-1 text-sm font-semibold text-white">{row.siege.label}</p>
          <p className="mt-1 text-xs text-slate-400">{row.siege.hint}</p>
          <p className="mt-1 text-xs text-slate-500">W {row.siege.wins} • L {row.siege.losses} • D {row.siege.draws}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {row.siege.windows.map((window) => (
              <Badge
                key={window.key}
                className={
                  window.meetsWinRateGoal
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                }
              >
                {window.label}: {window.completed}/{window.expected} • WR {window.winRate.toFixed(0)}%
              </Badge>
            ))}
          </div>
          {row.siege.teamsUsed[0] && (
            <p className="mt-1 text-xs text-slate-500">Time principal: {formatTeamLabel(row.siege.teamsUsed[0].team)}</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">Labirinto</p>
          <p className="mt-1 text-sm font-semibold text-white">{row.labyrinth.label}</p>
          <p className="mt-1 text-xs text-slate-400">{row.labyrinth.hint}</p>
        </div>

        <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">Subjugação</p>
          <p className="mt-1 text-sm font-semibold text-white">{row.subjugation.label}</p>
          <p className="mt-1 text-xs text-slate-400">{row.subjugation.hint}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Atividade por dia na semana</p>
        <DailyBreakdownList items={row.dailyBreakdown} />
      </div>
    </div>
  );
}

export default function GuildActivityOverviewPanel({ currentState }: { currentState: GuildCurrentStateDto | null }) {
  const { selectedWeekKey, setSelectedWeekKey } = useGuildWeek();
  const { punishments } = useWeeklyPunishments(selectedWeekKey || undefined);
  const overview = useMemo(
    () => buildGuildActivityOverview(currentState, { weekKey: selectedWeekKey, historyStart: "2026-04-05" }),
    [currentState, selectedWeekKey],
  );
  const punishmentByWizardId = useMemo(
    () => new Map(punishments.map((punishment) => [punishment.wizardId, punishment])),
    [punishments],
  );

  useEffect(() => {
    if (overview && !selectedWeekKey) {
      setSelectedWeekKey(overview.selectedWeek.key);
    }
  }, [overview, selectedWeekKey, setSelectedWeekKey]);

  if (!overview) {
    return (
      <Card className="border-2 border-amber-500/30 bg-slate-900/60 backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="text-white">Visão semanal e por evento</CardTitle>
            <CardDescription className="clandestino-page-header__description text-slate-300">
              O painel aparece assim que o backend tiver um estado atual consolidado.
            </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      id="guild-weekly-overview"
      className="border-2 border-amber-500/30 bg-slate-900/60 backdrop-blur-sm"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2">
            <CalendarRange className="h-5 w-5 text-amber-300" />
          </div>
          <div className="clandestino-page-header">
            <div className="clandestino-page-header__eyebrow">Operação semanal</div>
            <CardTitle className="clandestino-page-header__title text-white">Visão semanal e por evento</CardTitle>
            <CardDescription className="clandestino-page-header__description text-slate-300">
              Semana de {overview.selectedWeek.label} • snapshot atual de {overview.guildName ?? "guilda não identificada"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-sm text-slate-300">
            A semana sempre começa no domingo. O histórico desta visão parte de 05/04/2026, e os totais usam apenas registros com data dentro da semana escolhida. Em GW, a tela separa entradas reais e batalhas individuais.
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Semana analisada</p>
            <Select value={overview.selectedWeek.key} onValueChange={setSelectedWeekKey}>
              <SelectTrigger className="border-slate-700 bg-slate-800/70 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                {overview.availableWeeks.map((week) => (
                  <SelectItem key={week.key} value={week.key}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Membros</p>
            <p className="text-lg font-semibold text-white">{overview.summary.totalMembers}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Conclusão média</p>
            <p className="text-lg font-semibold text-white">{formatPercent(overview.summary.averageCompletionRate)}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Ações rastreadas</p>
            <p className="text-lg font-semibold text-white">{overview.summary.trackedAttacks}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Composições rastreadas</p>
            <p className="text-lg font-semibold text-white">{overview.summary.trackedTeams}</p>
          </div>
        </div>

        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/60">
            <TabsTrigger value="weekly">Consolidado semanal</TabsTrigger>
            <TabsTrigger value="events">Por evento</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <ScrollArea className="h-[40rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <div className="space-y-3">
                {overview.members.map((row) => (
                  <WeeklyRow
                    key={`${row.wizardId}-${overview.weekKey}`}
                    row={row}
                    punishment={punishmentByWizardId.get(row.wizardId)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid gap-4 xl:grid-cols-2">
              {overview.events.map((event) => (
                <EventCard key={`${overview.weekKey}-${event.eventKey}`} event={event} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/20 p-4 text-xs text-slate-500">
          Os valores desta tela representam a semana selecionada. O histórico acumulado do membro não entra nos totais da semana. Em GW, entradas e batalhas são mostradas separadamente para evitar inflação visual.
        </div>
      </CardContent>
    </Card>
  );
}


