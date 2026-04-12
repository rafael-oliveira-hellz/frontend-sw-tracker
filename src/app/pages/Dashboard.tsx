import React, { useEffect, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Compass,
  Loader2,
  LogOut,
  RefreshCcw,
  Shield,
  Skull,
  Swords,
  Star,
  UserCog,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import logo from "../../assets/logo.jpeg";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DisciplineStatus } from "../components/shared/DisciplineStatus";
import { useData } from "../context/DataContext";
import { useGuildWeek } from "../context/GuildWeekContext";
import { buildGuildActivityOverview } from "../lib/guildActivity";
import { formatTeamLabel } from "../lib/monsterCatalog";
import { useWeeklyPunishments } from "../lib/useWeeklyPunishments";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";

export default function Dashboard() {
  const { userData, logout, isAdmin } = useData();
  const { selectedWeekKey, setSelectedWeekKey } = useGuildWeek();
  const { currentState, currentMember, isLoading, error, refresh } = useGuildCurrentState({
    currentUserName: userData?.user.username,
    currentWizardId: userData?.user.wizardId,
  });
  const navigate = useNavigate();
  const activityOverview = useMemo(
    () => buildGuildActivityOverview(currentState, { weekKey: selectedWeekKey, historyStart: "2026-04-05" }),
    [currentState, selectedWeekKey],
  );
  const { punishments } = useWeeklyPunishments(selectedWeekKey || undefined);
  const currentWeekRow =
    activityOverview?.members.find((member) => member.wizardId === currentMember?.wizardId) ?? null;
  const currentPunishment = useMemo(
    () =>
      currentMember
        ? punishments.find((punishment) => punishment.wizardId === currentMember.wizardId) ?? null
        : null,
    [currentMember, punishments],
  );
  const activeDefenseAlerts = useMemo(
    () =>
      currentMember
        ? [...currentMember.guildWar.defenses, ...currentMember.siege.defenses].filter(
            (defense) => (defense.complianceAudit?.issuesCount ?? 0) > 0,
          )
        : [],
    [currentMember],
  );

  useEffect(() => {
    if (activityOverview && !selectedWeekKey) {
      setSelectedWeekKey(activityOverview.selectedWeek.key);
    }
  }, [activityOverview, selectedWeekKey, setSelectedWeekKey]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!userData) {
    return null;
  }

  const roleLabel =
    userData.user.role === "leader"
      ? "Líder"
      : userData.user.role === "vice-leader"
        ? "Vice-líder"
        : userData.user.role === "senior"
          ? "Sênior"
          : "Membro";

  const labyrinthUsed = currentMember?.labyrinth.score ? 1 : 0;
  const siegeUsed = currentWeekRow?.siege.completed ?? 0;
  const guildBattleUsed = currentWeekRow?.guildWar.extra?.warsCompleted ?? 0;
  const subjugationUsed = currentMember?.subjugation.clearScore ? 1 : 0;
  const defensesTotal =
    (currentMember?.guildWar.defenses.length ?? 0) + (currentMember?.siege.defenses.length ?? 0);
  const siegeHint = currentWeekRow?.siege.hint ?? "Limite semanal de até 60 ataques";
  const guildWarHint = currentWeekRow?.guildWar.hint ?? "Limite semanal de até 20 batalhas";
  const siegeWindowSummary = currentWeekRow?.siege.windows
    .map((window) => `${window.label}: ${window.completed}/${window.expected}`)
    .join(" • ");
  const guildWarWindowSummary = currentWeekRow?.guildWar.windows
    .map((window) => `${window.label}: ${window.completed}/${window.expected}`)
    .join(" • ");

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={logo}
              alt="Logo Clã D9stino"
              className="hidden h-20 w-20 rounded-2xl border border-amber-400/30 object-cover shadow-[0_0_30px_rgba(89,192,255,0.16)] sm:block"
            />
            <div className="clandestino-page-header">
            <div className="clandestino-page-header__eyebrow">Painel pessoal sincronizado</div>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="clandestino-brand-title clandestino-page-header__title text-2xl font-bold sm:text-3xl lg:text-4xl">
                Bem-vindo, {userData.user.username}!
              </h1>
              {userData.user.role !== "member" && (
                <Badge className="clandestino-badge w-fit bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg">
                  {roleLabel}
                </Badge>
              )}
            </div>
            <p className="clandestino-page-header__description text-sm sm:text-base">
              Guilda: <span className="font-semibold text-yellow-400">{currentMember?.guildName ?? userData.user.guildName}</span>
            </p>
            <p className="text-xs text-slate-400 sm:text-sm">
              A home mostra os seus detalhes por área de evento da guilda. Estado atual: {currentMember ? "sincronizado com o backend" : "aguardando snapshot consolidado"}
            </p>
            </div>
          </div>
          <div className="clandestino-toolbar w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => void refresh()}
              disabled={isLoading}
              className="clandestino-action-button clandestino-action-button--refresh !text-cyan-50 flex-1 sm:flex-initial"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Atualizar
            </Button>
            {isAdmin() && (
              <Link to="/admin" className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  className="clandestino-action-button clandestino-action-button--admin !text-amber-50 w-full"
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button
              onClick={() => void handleLogout()}
              variant="outline"
              className="clandestino-action-button clandestino-action-button--logout !text-slate-50 flex-1 sm:flex-initial"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {activityOverview && (
          <Card className="border border-slate-700/60 bg-slate-900/50">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-cyan-300" />
                <div>
                  <CardTitle className="text-white">Semana sincronizada da guilda</CardTitle>
                  <CardDescription className="text-slate-300">
                    A mesma janela da semana será usada no dashboard, no painel semanal e no calendário de eventos.
                  </CardDescription>
                </div>
              </div>
              <div className="max-w-sm space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Semana analisada</p>
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
            </CardHeader>
          </Card>
        )}

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
            <AlertTitle>Correção pendente nas defesas</AlertTitle>
            <AlertDescription>
              {activeDefenseAlerts.length} defesa(s) com alerta de composição/equipamento. Ajuste até{" "}
              {activeDefenseAlerts[0]?.complianceAudit?.warningDeadlineAt
                ? new Date(activeDefenseAlerts[0].complianceAudit.warningDeadlineAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
                : "segunda-feira 12:00 de Brasília"}
              .
            </AlertDescription>
          </Alert>
        )}

        {currentPunishment?.markedForRemoval ? (
          <Alert className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-50">
            <AlertTriangle className="h-4 w-4 text-fuchsia-300" />
            <AlertTitle>Marcado para remoção</AlertTitle>
            <AlertDescription>
              {currentPunishment.removalReasonSummary ??
                "Sua semana atual já está marcada para remoção pela combinação de punição ativa e ausência nos conteúdos obrigatórios."}
            </AlertDescription>
          </Alert>
        ) : null}

        {currentWeekRow && (
          <Card className="border-2 border-amber-500/30 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Resumo da semana atual</CardTitle>
              <CardDescription className="text-slate-300">
                Janela da semana de {activityOverview?.selectedWeek.label ?? currentWeekRow.weekKey} • leitura baseada no estado atual sincronizado
              </CardDescription>
              {currentPunishment && (
                <DisciplineStatus
                  className="mt-3"
                  punishment={currentPunishment}
                  labels={{
                    punished: "De castigo nesta semana",
                    cooldown: "Em carência de punição",
                    clear: "Sem punição nesta semana",
                  }}
                  showReason
                />
              )}
            </CardHeader>
            <div className="grid gap-3 px-6 pb-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Batalha de Guilda</p>
                <p className="mt-1 text-sm font-semibold text-white">{currentWeekRow.guildWar.label}</p>
                <p className="mt-1 text-xs text-slate-500">{currentWeekRow.guildWar.hint}</p>
                {currentWeekRow.guildWar.teamsUsed[0] && (
                  <p className="mt-1 text-xs text-slate-500">
                    Composição: {formatTeamLabel(currentWeekRow.guildWar.teamsUsed[0].team)}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Batalha de Assalto</p>
                <p className="mt-1 text-sm font-semibold text-white">{currentWeekRow.siege.label}</p>
                <p className="mt-1 text-xs text-slate-500">{currentWeekRow.siege.hint}</p>
                {currentWeekRow.siege.teamsUsed[0] && (
                  <p className="mt-1 text-xs text-slate-500">
                    Composição: {formatTeamLabel(currentWeekRow.siege.teamsUsed[0].team)}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Labirinto</p>
                <p className="mt-1 text-sm font-semibold text-white">{currentWeekRow.labyrinth.label}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Subjugação</p>
                <p className="mt-1 text-sm font-semibold text-white">{currentWeekRow.subjugation.label}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <Link to="/labyrinth" className="group">
            <Card className="h-full border-2 border-blue-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/20">
              <CardHeader className="clandestino-overview-card">
                <div className="clandestino-overview-card__top">
                  <div className="clandestino-overview-card__icon bg-blue-500/20 transition-colors group-hover:bg-blue-500/30">
                    <Compass className="h-8 w-8 text-blue-400 sm:h-10 sm:w-10" />
                  </div>
                  <div className="clandestino-overview-card__metric">
                    <div className="clandestino-overview-card__title">{labyrinthUsed}/1</div>
                    <div className="clandestino-overview-card__subtitle">status</div>
                  </div>
                </div>
                <div className="clandestino-overview-card__body">
                  <CardTitle className="text-lg text-white sm:text-xl">Labirinto</CardTitle>
                  <CardDescription className="clandestino-overview-card__caption">Estado atual sincronizado do ciclo</CardDescription>
                  <DisciplineStatus
                    className="mt-3"
                    punishment={currentPunishment}
                    eventKey="labyrinth"
                    labels={{
                      punished: "Labirinto bloqueado por castigo",
                      cooldown: "Labirinto em carência",
                      clear: "Labirinto liberado",
                    }}
                  />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/siege-battle" className="group">
            <Card className="h-full border-2 border-red-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-400/60 hover:shadow-xl hover:shadow-red-500/20">
              <CardHeader className="clandestino-overview-card">
                <div className="clandestino-overview-card__top">
                  <div className="clandestino-overview-card__icon bg-red-500/20 transition-colors group-hover:bg-red-500/30">
                    <Swords className="h-8 w-8 text-red-400 sm:h-10 sm:w-10" />
                  </div>
                  <div className="clandestino-overview-card__metric">
                    <div className="clandestino-overview-card__title">{siegeUsed}</div>
                    <div className="clandestino-overview-card__subtitle">ataques rastreados na semana</div>
                  </div>
                </div>
                <div className="clandestino-overview-card__body">
                  <CardTitle className="text-lg text-white sm:text-xl">Batalha de Assalto</CardTitle>
                  <CardDescription className="clandestino-overview-card__caption">{siegeHint}</CardDescription>
                  <DisciplineStatus
                    className="mt-3"
                    punishment={currentPunishment}
                    eventKey="siege"
                    labels={{
                      punished: "Assalto bloqueado por castigo",
                      cooldown: "Assalto em carência",
                      clear: "Assalto liberado",
                    }}
                  />
                  {siegeWindowSummary && (
                    <p className="clandestino-overview-card__hint">{siegeWindowSummary}</p>
                  )}
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/guild-battle" className="group">
            <Card className="h-full border-2 border-green-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-400/60 hover:shadow-xl hover:shadow-green-500/20">
              <CardHeader className="clandestino-overview-card">
                <div className="clandestino-overview-card__top">
                  <div className="clandestino-overview-card__icon bg-green-500/20 transition-colors group-hover:bg-green-500/30">
                    <Shield className="h-8 w-8 text-green-400 sm:h-10 sm:w-10" />
                  </div>
                  <div className="clandestino-overview-card__metric">
                    <div className="clandestino-overview-card__title">{guildBattleUsed}/2</div>
                    <div className="clandestino-overview-card__subtitle">GW concluídas na semana</div>
                  </div>
                </div>
                <div className="clandestino-overview-card__body">
                  <CardTitle className="text-lg text-white sm:text-xl">Batalha de Guilda</CardTitle>
                  <CardDescription className="clandestino-overview-card__caption">{guildWarHint}</CardDescription>
                  <DisciplineStatus
                    className="mt-3"
                    punishment={currentPunishment}
                    eventKey="guildWar"
                    labels={{
                      punished: "GW bloqueada por castigo",
                      cooldown: "GW em carência",
                      clear: "GW liberada",
                    }}
                  />
                  {guildWarWindowSummary && (
                    <p className="clandestino-overview-card__hint">{guildWarWindowSummary}</p>
                  )}
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/monster-subjugation" className="group">
            <Card className="h-full border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/60 hover:shadow-xl hover:shadow-purple-500/20">
              <CardHeader className="clandestino-overview-card">
                <div className="clandestino-overview-card__top">
                  <div className="clandestino-overview-card__icon bg-purple-500/20 transition-colors group-hover:bg-purple-500/30">
                    <Skull className="h-8 w-8 text-purple-400 sm:h-10 sm:w-10" />
                  </div>
                  <div className="clandestino-overview-card__metric">
                    <div className="clandestino-overview-card__title">{subjugationUsed}/1</div>
                    <div className="clandestino-overview-card__subtitle">status</div>
                  </div>
                </div>
                <div className="clandestino-overview-card__body">
                  <CardTitle className="text-lg text-white sm:text-xl">Subjugação de Monstros</CardTitle>
                  <CardDescription className="clandestino-overview-card__caption">Estado atual sincronizado do ciclo</CardDescription>
                  <DisciplineStatus
                    className="mt-3"
                    punishment={currentPunishment}
                    eventKey="subjugation"
                    labels={{
                      punished: "Subjugação bloqueada por castigo",
                      cooldown: "Subjugação em carência",
                      clear: "Subjugação liberada",
                    }}
                  />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/defenses" className="group">
            <Card className="h-full border-2 border-yellow-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/60 hover:shadow-xl hover:shadow-yellow-500/20">
              <CardHeader className="clandestino-overview-card">
                <div className="clandestino-overview-card__top">
                  <div className="clandestino-overview-card__icon bg-yellow-500/20 transition-colors group-hover:bg-yellow-500/30">
                    <Star className="h-8 w-8 text-yellow-400 sm:h-10 sm:w-10" />
                  </div>
                  <div className="clandestino-overview-card__metric">
                    <div className="clandestino-overview-card__title">{defensesTotal}</div>
                    <div className="clandestino-overview-card__subtitle">defesas</div>
                  </div>
                </div>
                <div className="clandestino-overview-card__body">
                  <CardTitle className="text-lg text-white sm:text-xl">Defesas</CardTitle>
                  <CardDescription className="clandestino-overview-card__caption">Decks do estado atual sincronizado</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
