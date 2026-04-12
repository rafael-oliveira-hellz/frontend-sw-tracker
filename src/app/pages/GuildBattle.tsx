import { format } from "date-fns";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, RefreshCcw, Shield, XCircle } from "lucide-react";
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

export default function GuildBattle() {
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

  const attacks = currentWeekRow?.guildWar.attacksUsed ?? [];
  const teams = currentWeekRow?.guildWar.teamsUsed ?? [];
  const wins = currentWeekRow?.guildWar.wins ?? 0;
  const losses = currentWeekRow?.guildWar.losses ?? 0;
  const trackedBattles = currentWeekRow?.guildWar.completed ?? 0;
  const trackedEntries = currentWeekRow?.guildWar.extra?.attacksTracked ?? 0;
  const expectedBattles = currentWeekRow?.guildWar.expected ?? 20;
  const progressValue = expectedBattles > 0 ? (Math.min(trackedBattles, expectedBattles) / expectedBattles) * 100 : 0;
  const summaryLabel = currentWeekRow?.guildWar.label ?? "Nenhuma batalha rastreada na semana selecionada";
  const summaryHint = currentWeekRow?.guildWar.hint ?? "Limite semanal de até 20 batalhas";

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
                  Atualizar ataques
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="clandestino-event-frame border-green-500/30 bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <div className="clandestino-page-header">
            <div className="clandestino-page-header__eyebrow">Janela semanal</div>
            <CardTitle className="clandestino-page-header__title text-3xl text-white">Batalha de Guilda</CardTitle>
            <CardDescription className="clandestino-page-header__description text-slate-300">
              Janela da semana de {activityOverview?.selectedWeek.label ?? "semana atual"} para {userData.user.username}, usando apenas os registros rastreados nessa semana.
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

            <div className="clandestino-event-inner bg-green-500/10">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-300">Janela da semana</span>
                <span className="font-bold text-white">{summaryLabel}</span>
              </div>
              <Progress value={progressValue} className="mb-3 h-3" />
              <p className="mb-3 text-sm text-slate-300">{summaryHint}</p>
              <p className="mb-3 text-sm text-slate-400">
                {trackedEntries}/4 entradas de GW registradas • {trackedBattles}/20 batalhas individuais rastreadas
              </p>
              <p className="mb-3 text-xs text-slate-500">
                O painel considera só o histórico rastreado dentro da semana selecionada, sem somar batalhas antigas da guilda. Cada entrada de GW pode conter até 5 batalhas.
              </p>
              {currentPunishment && (
                <DisciplineStatus
                  className="mb-3"
                  punishment={currentPunishment}
                  eventKey="guildWar"
                  labels={{
                    punished: "Suspenso em GW nesta semana",
                    cooldown: "Suspenso em GW nesta semana",
                    clear: "GW liberada nesta semana",
                  }}
                  showReason
                />
              )}
              {currentWeekRow?.guildWar.windows.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {currentWeekRow.guildWar.windows.map((window) => (
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
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded bg-slate-950/50 p-3">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="h-5 w-5" />
                    <span>Vitórias</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold text-white">{wins}</div>
                </div>
                <div className="rounded bg-slate-950/50 p-3">
                  <div className="flex items-center gap-2 text-red-300">
                    <XCircle className="h-5 w-5" />
                    <span>Derrotas</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold text-white">{losses}</div>
                </div>
              </div>
            </div>

            <section className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-300" />
                <h3 className="font-semibold text-white">Melhores composições da janela da semana</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {teams.length === 0 ? (
                  <Card className="clandestino-panel-card border-slate-700/60 md:col-span-2">
                    <CardContent className="pt-6 text-center text-slate-400">
                      Nenhuma composição de GW rastreada na janela da semana selecionada.
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
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
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

            <section className="border-t border-slate-800 pt-4">
              <h3 className="mb-3 font-semibold text-white">Histórico rastreado da semana</h3>
              <ScrollArea className="h-[28rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-3">
                <div className="space-y-2">
                  {attacks.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                      Nenhuma batalha de GW foi encontrada na janela da semana selecionada.
                    </p>
                  ) : (
                    attacks.map((attack, index) => {
                      const isWin = attack.outcome === "win";
                      return (
                        <div
                          key={`${attack.battleId}-${index}`}
                          className={`flex items-center justify-between rounded p-3 ${isWin ? "bg-emerald-500/10" : "bg-red-500/10"}`}
                        >
                          <div className="flex items-center gap-3">
                            {isWin ? (
                              <CheckCircle className="h-5 w-5 text-emerald-300" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-300" />
                            )}
                            <div>
                              <div className="font-medium text-white">{attack.targetLabel}</div>
                              <div className="text-sm text-slate-400">
                                {attack.occurredAt ? format(new Date(attack.occurredAt * 1000), "dd/MM/yyyy HH:mm") : "Data indisponível"}
                              </div>
                              <div className="text-xs text-slate-500">{formatTeamLabel(attack.team)}</div>
                            </div>
                          </div>
                          <span className={`font-semibold ${isWin ? "text-emerald-300" : "text-red-300"}`}>
                            {attack.outcome}
                          </span>
                        </div>
                      );
                    })
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
