import { format } from "date-fns";
import { AlertCircle, ArrowLeft, Loader2, RefreshCcw, Shield, Swords } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DisciplineStatus } from "../components/shared/DisciplineStatus";
import { Progress } from "../components/ui/progress";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useData } from "../context/DataContext";
import { buildGuildActivityOverview } from "../lib/guildActivity";
import { formatMonsterName, formatTeamLabel } from "../lib/monsterCatalog";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";
import { useWeeklyPunishments } from "../lib/useWeeklyPunishments";

const isTimestampInWeekLabel = (timestampSeconds: number | undefined, weekLabel: string) => {
  if (!timestampSeconds || !weekLabel.includes(" a ")) {
    return false;
  }

  const [startLabel, endLabel] = weekLabel.split(" a ");
  const [startDay, startMonth] = startLabel.split("/").map(Number);
  const [endDay, endMonth] = endLabel.split("/").map(Number);
  const currentDate = new Date(timestampSeconds * 1000);
  const start = new Date(currentDate.getFullYear(), (startMonth ?? 1) - 1, startDay ?? 1, 0, 0, 0, 0);
  const end = new Date(currentDate.getFullYear(), (endMonth ?? 1) - 1, endDay ?? 1, 23, 59, 59, 999);

  return currentDate >= start && currentDate <= end;
};

export default function SiegeBattle() {
  const { userData } = useData();
  const { currentState, currentMember, isLoading, error, refresh } = useGuildCurrentState({
    currentUserName: userData?.user.username,
    currentWizardId: userData?.user.wizardId,
  });
  const [selectedWeekKey, setSelectedWeekKey] = useState("");

  const activityOverview = useMemo(
    () => buildGuildActivityOverview(currentState, { weekKey: selectedWeekKey, historyStart: "2026-04-05" }),
    [currentState, selectedWeekKey],
  );
  const { punishments } = useWeeklyPunishments(selectedWeekKey || undefined);

  useEffect(() => {
    if (activityOverview && !selectedWeekKey) {
      setSelectedWeekKey(activityOverview.selectedWeek.key);
    }
  }, [activityOverview, selectedWeekKey]);

  const currentWeekRow =
    activityOverview?.members.find((member) => member.wizardId === currentMember?.wizardId) ?? null;
  const currentPunishment = useMemo(
    () =>
      currentMember
        ? punishments.find((punishment) => punishment.wizardId === currentMember.wizardId) ?? null
        : null,
    [currentMember, punishments],
  );

  if (!userData) return null;

  const attacks = currentWeekRow?.siege.attacksUsed ?? [];
  const teams = currentWeekRow?.siege.teamsUsed ?? [];
  const defenses = currentMember?.siege.defenses ?? [];
  const trackedAttacks = currentWeekRow?.siege.completed ?? 0;
  const expectedWeekly = currentWeekRow?.siege.expected ?? 60;
  const progressValue = expectedWeekly > 0 ? (Math.min(trackedAttacks, expectedWeekly) / expectedWeekly) * 100 : 0;
  const summaryLabel = currentWeekRow?.siege.label ?? "Nenhum ataque rastreado na semana selecionada";
  const summaryHint = currentWeekRow?.siege.hint ?? "Limite semanal de até 60 ataques";
  const totalMonstersUsed = new Set(
    attacks.flatMap((attack) => attack.team.monsters.filter((monster) => Number.isFinite(monster))),
  ).size;
  const siegeMatchesThisWeek = (currentState?.siegeMatches ?? [])
    .filter((match) => isTimestampInWeekLabel(match.updatedAt, activityOverview?.selectedWeek.label ?? ""))
    .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
  const siegeWindowBreakdown = currentWeekRow
    ? currentWeekRow.siege.windows.map((window) => {
        const allowedDays = window.key === "siege-1" ? [1, 2] : [4, 5];
        const days = currentWeekRow.siege.dailyBreakdown.filter((day) => {
          const [year, month, date] = day.dayKey.split("-").map(Number);
          const parsedDate = new Date(year, (month ?? 1) - 1, date ?? 1);
          return allowedDays.includes(parsedDate.getDay());
        });

        return {
          ...window,
          trackedDaysLabel:
            days.length > 0
              ? days.map((day) => `${day.dateLabel}: ${day.siegeAttacks}`).join(" • ")
              : "Nenhum ataque rastreado nessa janela",
        };
      })
    : [];

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <div className="clandestino-toolbar">
            {activityOverview && (
              <div className="min-w-56">
                <Select value={activityOverview.selectedWeek.key} onValueChange={setSelectedWeekKey}>
                  <SelectTrigger className="border-slate-700 bg-slate-800/70 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                    {activityOverview.availableWeeks.map((week) => (
                      <SelectItem key={week.key} value={week.key}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="button"
              onClick={() => void refresh()}
              disabled={isLoading}
              className="clandestino-action-button clandestino-action-button--refresh !text-cyan-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar assalto
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="clandestino-event-frame border-red-500/30 bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <div className="clandestino-page-header">
            <div className="clandestino-page-header__eyebrow">Janela semanal</div>
            <CardTitle className="clandestino-page-header__title text-3xl text-white">Batalha de Assalto</CardTitle>
            <CardDescription className="clandestino-page-header__description text-slate-300">
              Janela da semana de {activityOverview?.selectedWeek.label ?? "semana atual"} para {userData.user.username}, usando apenas os ataques rastreados nessa semana.
            </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha ao carregar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="clandestino-event-inner bg-red-500/10">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-300">Janela da semana</span>
                <span className="font-bold text-white">{summaryLabel}</span>
              </div>
              <Progress value={progressValue} className="mb-2 h-3" />
              <div className="text-sm text-slate-300">{summaryHint}</div>
              <div className="mt-2 text-xs text-slate-500">
                O painel considera só o histórico rastreado dentro da semana selecionada, sem somar ataques antigos da guilda.
              </div>
              {currentPunishment && (
                <DisciplineStatus
                  className="mt-3"
                  punishment={currentPunishment}
                  eventKey="siege"
                  labels={{
                    punished: "De castigo em assalto nesta semana",
                    cooldown: "Em carência de punição",
                    clear: "Assalto liberado nesta semana",
                  }}
                  showReason
                />
              )}
              {currentWeekRow?.siege.windows.length ? (
                <div className="mt-3 space-y-2">
                  {siegeWindowBreakdown.map((window) => (
                    <div key={window.key}>
                      <Badge
                        className={
                          window.meetsWinRateGoal
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        }
                      >
                        {window.label}: {window.completed}/{window.expected} • WR {window.winRate.toFixed(0)}%
                      </Badge>
                      <div className="mt-1 text-xs text-slate-400">{window.trackedDaysLabel}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 text-sm text-slate-400">
                {totalMonstersUsed} monstros únicos utilizados nos ataques rastreados da semana
              </div>
            </div>

            <section className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-300" />
                <h3 className="font-semibold text-white">Resultados das rodadas de assalto na semana</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {siegeMatchesThisWeek.length === 0 ? (
                  <Card className="clandestino-panel-card border-slate-700/60 md:col-span-2">
                    <CardContent className="pt-6 text-center text-slate-400">
                      Nenhuma rodada de assalto dessa semana foi encontrada nos logs importados.
                    </CardContent>
                  </Card>
                ) : (
                  siegeMatchesThisWeek.map((match) => (
                    <Card key={`${match.siegeId}-${match.matchId}`} className="clandestino-panel-card border-slate-700/60">
                      <CardContent className="space-y-3 pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">
                              Siege {match.siegeId ?? "-"} • Match {match.matchId ?? "-"}
                            </p>
                            <p className="text-xs text-slate-400">
                              Atualizado em{" "}
                              {match.updatedAt
                                ? format(new Date(match.updatedAt * 1000), "dd/MM/yyyy HH:mm")
                                : "horário indisponível"}
                            </p>
                          </div>
                          <Badge
                            className={
                              match.result === "win"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                : match.result === "loss"
                                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                                  : "border-slate-500/30 bg-slate-500/10 text-slate-200"
                            }
                          >
                            {match.result === "win" ? "Vitória" : match.result === "loss" ? "Derrota" : "Em aberto"}
                          </Badge>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
                          <p>
                            Nossa guilda: <span className="font-semibold text-white">{match.currentGuildName ?? "Não identificada"}</span>
                          </p>
                          <p>
                            Rank <span className="font-semibold text-white">{match.currentGuildStanding?.matchRank ?? "-"}</span>
                            {" • "}
                            Posição <span className="font-semibold text-white">{match.currentGuildStanding?.posId ?? "-"}</span>
                          </p>
                          <p>
                            Rating <span className="font-semibold text-white">{match.currentGuildStanding?.ratingId ?? "-"}</span>
                            {" • "}
                            Score <span className="font-semibold text-white">{match.currentGuildStanding?.matchScore?.toFixed?.(2) ?? "-"}</span>
                          </p>
                          <p>
                            Ataques <span className="font-semibold text-white">{match.currentGuildStanding?.attackCount ?? "-"}</span>
                            {" • "}
                            Membros ativos <span className="font-semibold text-white">{match.currentGuildStanding?.playMemberCount ?? "-"}</span>
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Oponentes</p>
                          {match.opponents.map((opponent) => (
                            <div
                              key={`${match.matchId}-${opponent.guildId}-${opponent.posId}`}
                              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300"
                            >
                              <p className="font-medium text-white">{opponent.guildName ?? "Guilda desconhecida"}</p>
                              <p>
                                Rank {opponent.matchRank ?? "-"} • Posição {opponent.posId ?? "-"} • Rating {opponent.ratingId ?? "-"}
                              </p>
                              <p>
                                Ataques {opponent.attackCount ?? "-"} • Membros ativos {opponent.playMemberCount ?? "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-red-300" />
                <h3 className="font-semibold text-white">Melhores composições da janela da semana</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {teams.length === 0 ? (
                  <Card className="clandestino-panel-card border-slate-700/60 md:col-span-2">
                    <CardContent className="pt-6 text-center text-slate-400">
                      Nenhuma composição de assalto rastreada na janela da semana selecionada.
                    </CardContent>
                  </Card>
                ) : (
                  teams.slice(0, 4).map((team) => (
                    <Card key={team.team.signature} className="clandestino-panel-card border-slate-700/60">
                      <CardContent className="space-y-2 pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{formatTeamLabel(team.team)}</p>
                            <p className="text-xs text-slate-400">{team.totalBattles} usos rastreados na semana</p>
                          </div>
                          <Badge className="border-red-500/30 bg-red-500/10 text-red-200">
                            WR {team.winRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-slate-300">
                          {team.team.monsters.map((monster, monsterIndex) => (
                            <div key={`${team.team.signature}-${monster}`} className="rounded bg-slate-950/50 px-3 py-2">
                              {formatMonsterName(monster, team.team.monsterNames?.[monsterIndex])}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-300" />
                <h3 className="font-semibold text-white">Defesas do estado atual sincronizado</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {defenses.length === 0 ? (
                  <Card className="clandestino-panel-card border-slate-700/60 md:col-span-2">
                    <CardContent className="pt-6 text-center text-slate-400">
                      Nenhuma defesa atual de assalto encontrada.
                    </CardContent>
                  </Card>
                ) : (
                  defenses.slice(0, 4).map((defense, defenseIndex) => (
                    <Card key={`${defense.team.signature}-${defenseIndex}`} className="clandestino-panel-card border-slate-700/60">
                      <CardContent className="space-y-2 pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{formatTeamLabel(defense.team)}</p>
                            <p className="text-xs text-slate-400">
                              Base {defense.assignedBase ?? "-"} • Deck ID {defense.deckId ?? "-"} • Rating {defense.ratingId ?? currentMember?.member.ratingId ?? "-"}
                            </p>
                          </div>
                          <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-200">
                            WR {(defense.winRate ?? 0).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-slate-300">
                          {defense.team.monsters.map((monster, monsterIndex) => (
                            <div key={`${defense.team.signature}-${monster}`} className="rounded bg-slate-950/50 px-3 py-2">
                              {formatMonsterName(monster, defense.team.monsterNames?.[monsterIndex])}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            <section className="border-t border-slate-800 pt-4">
              <h3 className="mb-3 font-semibold text-white">Histórico rastreado da semana</h3>
              <ScrollArea className="h-[28rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-3">
                <div className="space-y-3">
                  {attacks.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                      Nenhum ataque de assalto foi encontrado na janela da semana selecionada.
                    </p>
                  ) : (
                    attacks.map((attack, index) => (
                      <Card key={`${attack.battleId}-${index}`} className="border-slate-800 bg-slate-900/60">
                        <CardContent className="pt-6">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{attack.targetLabel}</div>
                              <div className="text-sm text-slate-400">
                                {attack.occurredAt ? format(new Date(attack.occurredAt * 1000), "dd/MM/yyyy HH:mm") : "Data indisponível"}
                              </div>
                            </div>
                            <Badge className="border-red-500/30 bg-red-500/10 text-red-200">{attack.outcome}</Badge>
                          </div>
                          <div className="space-y-1">
                            {attack.team.monsters.map((monster, monsterIndex) => (
                              <div key={`${attack.battleId}-${monster}`} className="rounded bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
                                {formatMonsterName(monster, attack.team.monsterNames?.[monsterIndex])}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
