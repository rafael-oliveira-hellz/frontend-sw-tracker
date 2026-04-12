import { AlertCircle, AlertTriangle, ArrowLeft, Loader2, RefreshCcw, Shield, Star } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DisciplineStatus } from "../components/shared/DisciplineStatus";
import { ScrollArea } from "../components/ui/scroll-area";
import { useData } from "../context/DataContext";
import { formatMonsterName } from "../lib/monsterCatalog";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";
import { useWeeklyPunishments } from "../lib/useWeeklyPunishments";

const MAX_GUILD_WAR_DEFENSES = 10;
const MAX_SIEGE_DEFENSES = 10;

const formatDefenseWinRate = (value?: number, totalBattles?: number) =>
  value === undefined || !totalBattles ? "sem histórico" : `${value.toFixed(1)}%`;

const hasDefenseHistory = (totalBattles?: number, wins?: number, losses?: number, draws?: number) =>
  Boolean(totalBattles || wins || losses || draws);

const formatDefenseRecord = (wins?: number, losses?: number, draws?: number, totalBattles?: number) =>
  `W ${wins ?? 0} • L ${losses ?? 0} • D ${draws ?? 0} • ${totalBattles ?? 0} batalhas`;

const getDefensePerformanceTone = (winRate?: number, totalBattles?: number) => {
  if (winRate === undefined || !totalBattles) {
    return {
      badge: "border-slate-500/30 bg-slate-500/10 text-slate-200",
      record: "text-slate-300",
    };
  }

  if (winRate >= 80) {
    return {
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      record: "text-emerald-300",
    };
  }

  if (winRate >= 50) {
    return {
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-200",
      record: "text-amber-300",
    };
  }

  return {
    badge: "border-red-500/30 bg-red-500/10 text-red-200",
    record: "text-red-300",
  };
};

export default function Defenses() {
  const { userData } = useData();
  const { currentMember, isLoading, error, refresh } = useGuildCurrentState({
    currentUserName: userData?.user.username,
  });
  const { punishments } = useWeeklyPunishments();

  if (!userData) return null;

  const guildWarDefenses = (currentMember?.guildWar.defenses ?? []).slice(0, MAX_GUILD_WAR_DEFENSES);
  const siegeDefenses = (currentMember?.siege.defenses ?? []).slice(0, MAX_SIEGE_DEFENSES);
  const currentPunishment =
    currentMember
      ? punishments.find((punishment) => punishment.wizardId === currentMember.wizardId) ?? null
      : null;
  const activeDefenseAlerts = currentMember
    ? [...currentMember.guildWar.defenses, ...currentMember.siege.defenses].filter(
        (defense) => (defense.complianceAudit?.issuesCount ?? 0) > 0,
      )
    : [];

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <Button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 hover:from-cyan-400 hover:to-sky-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar defesas
              </>
            )}
          </Button>
        </div>

        <div>
          <h1 className="mb-2 text-3xl text-white">Defesas atuais</h1>
          <p className="text-slate-300">
            Leitura do estado atual sincronizado no backend para <span className="font-semibold text-amber-300">{userData.user.username}</span>.
          </p>
          {currentPunishment && (
            <DisciplineStatus
              className="mt-3"
              punishment={currentPunishment}
              labels={{
                punished: "De castigo na avaliação mais recente",
                cooldown: "Em carência de punição",
                clear: "Sem punição recente",
              }}
              showReason
            />
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activeDefenseAlerts.length > 0 && (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <AlertTitle>Alerta de defesa</AlertTitle>
            <AlertDescription>
              {activeDefenseAlerts.length} defesa(s) com composição/equipamento fora da regra. Prazo para ajuste até{" "}
              {activeDefenseAlerts[0]?.complianceAudit?.warningDeadlineAt
                ? new Date(activeDefenseAlerts[0].complianceAudit.warningDeadlineAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
                : "segunda-feira 12:00 de Brasília"}
              .
            </AlertDescription>
          </Alert>
        )}

        {!currentMember && !isLoading && !error && (
          <Alert className="border-slate-700 bg-slate-900/50 text-slate-100">
            <Shield className="h-4 w-4" />
            <AlertTitle>Nenhum deck atual encontrado</AlertTitle>
            <AlertDescription>
              Ainda não há um estado atual sincronizado com defesas para o seu membro.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-700/60 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Guild War</CardTitle>
              <CardDescription className="text-slate-400">Até 10 decks atuais por membro</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {guildWarDefenses.length}/{MAX_GUILD_WAR_DEFENSES}
            </CardContent>
          </Card>
          <Card className="border-slate-700/60 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Siege</CardTitle>
              <CardDescription className="text-slate-400">Até 10 decks atuais por membro</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {siegeDefenses.length}/{MAX_SIEGE_DEFENSES}
            </CardContent>
          </Card>
          <Card className="border-slate-700/60 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Cobertura</CardTitle>
              <CardDescription className="text-slate-400">Estado atual sincronizado</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-200">
              GW: {currentMember?.coverage.guildWarDefenses ? "sim" : "não"} • Siege: {currentMember?.coverage.siegeDefenses ? "sim" : "não"}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl text-white">
              <Star className="h-6 w-6 text-yellow-400" />
              Defesas de Guild War
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {guildWarDefenses.length === 0 ? (
                <Card className="border-slate-700/60 bg-slate-900/50 md:col-span-2">
                  <CardContent className="pt-6 text-center text-slate-400">
                    Nenhuma defesa de Guild War encontrada no estado atual sincronizado.
                  </CardContent>
                </Card>
              ) : (
                guildWarDefenses.map((defense, defenseIndex) => {
                  const tone = getDefensePerformanceTone(defense.winRate, defense.totalBattles);

                  return (
                    <Card key={`gw-defense-${defenseIndex}`} className="border-2 border-emerald-500/30 bg-slate-900/60">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-white">Deck #{defenseIndex + 1}</CardTitle>
                            <CardDescription className="text-slate-400">
                              Rodada {defense.round ?? defenseIndex + 1} • Deck ID {defense.deckId ?? "-"} • Origem {defense.source}
                            </CardDescription>
                          </div>
                          <Badge className={tone.badge}>
                            WR {formatDefenseWinRate(defense.winRate, defense.totalBattles)}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {!defense.totalBattles
                            ? "O WR da defesa de GW só aparece quando a importação traz dados consolidados de desempenho do deck."
                            : "WR consolidado do deck de defesa de Guild War."}
                        </div>
                        {hasDefenseHistory(
                          defense.totalBattles,
                          defense.wins,
                          defense.losses,
                          defense.draws,
                        ) ? (
                          <div className={`text-xs font-medium ${tone.record}`}>
                            {formatDefenseRecord(
                              defense.wins,
                              defense.losses,
                              defense.draws,
                              defense.totalBattles,
                            )}
                          </div>
                        ) : null}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {defense.complianceAudit?.issuesCount ? (
                          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-50">
                            <p className="font-medium">Alerta de composição/equipamento</p>
                            <div className="mt-2 space-y-2">
                              {defense.complianceAudit.issues.map((issue) => (
                                <div key={`gw-defense-${defenseIndex}-${issue.code}-${issue.summary}`}>{issue.summary}</div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {defense.team.monsters.map((monster, monsterIndex) => (
                          <div
                            key={`gw-defense-${defenseIndex}-${monster}`}
                            className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                          >
                            {formatMonsterName(monster, defense.team.monsterNames?.[monsterIndex])}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl text-white">Defesas de Siege</h2>
            <ScrollArea className="h-[28rem] rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {siegeDefenses.length === 0 ? (
                  <Card className="border-slate-700/60 bg-slate-900/50 md:col-span-2">
                    <CardContent className="pt-6 text-center text-slate-400">
                      Nenhuma defesa de Siege encontrada no estado atual sincronizado.
                    </CardContent>
                  </Card>
                ) : (
                  siegeDefenses.map((defense, defenseIndex) => {
                    const tone = getDefensePerformanceTone(defense.winRate, defense.totalBattles);

                    return (
                      <Card key={`siege-defense-${defenseIndex}`} className="border-2 border-red-500/30 bg-slate-900/60">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-white">Deck #{defenseIndex + 1}</CardTitle>
                              <CardDescription className="text-slate-400">
                                Base {defense.assignedBase ?? "-"} • Deck ID {defense.deckId ?? "-"} • Rating {defense.ratingId ?? currentMember?.member.ratingId ?? "-"}
                              </CardDescription>
                            </div>
                            <Badge className={tone.badge}>
                              WR {formatDefenseWinRate(defense.winRate, defense.totalBattles)}
                            </Badge>
                          </div>
                          {hasDefenseHistory(
                            defense.totalBattles,
                            defense.wins,
                            defense.losses,
                            defense.draws,
                          ) ? (
                            <div className={`text-xs font-medium ${tone.record}`}>
                              {formatDefenseRecord(
                                defense.wins,
                                defense.losses,
                                defense.draws,
                                defense.totalBattles,
                              )}
                            </div>
                          ) : null}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {defense.complianceAudit?.issuesCount ? (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-50">
                              <p className="font-medium">Alerta de composição/equipamento</p>
                              <div className="mt-2 space-y-2">
                                {defense.complianceAudit.issues.map((issue) => (
                                  <div key={`siege-defense-${defenseIndex}-${issue.code}-${issue.summary}`}>{issue.summary}</div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {defense.team.monsters.map((monster, monsterIndex) => (
                            <div
                              key={`siege-defense-${defenseIndex}-${monster}`}
                              className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                            >
                              {formatMonsterName(monster, defense.team.monsterNames?.[monsterIndex])}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </section>
        </div>
      </div>
    </div>
  );
}
