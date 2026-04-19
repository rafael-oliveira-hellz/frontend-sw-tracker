import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Compass,
  History,
  KeyRound,
  Layers3,
  Loader2,
  ShieldAlert,
  Shield,
  Skull,
  Swords,
  Users,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useData } from "../context/DataContext";
import { GUILD_IMPORT_COMPLETED_EVENT } from "../lib/guildImport";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";
import { useWeeklyPunishments } from "../lib/useWeeklyPunishments";

const GuildActivityOverviewPanel = lazy(() => import("../components/admin/GuildActivityOverviewPanel"));
const GuildDefenseEquipmentAuditPanel = lazy(
  () => import("../components/admin/GuildDefenseEquipmentAuditPanel"),
);
const GuildLeadershipRankingPanel = lazy(() => import("../components/admin/GuildLeadershipRankingPanel"));
const GuildCurrentStatePanel = lazy(() => import("../components/admin/GuildCurrentStatePanel"));
const GuildEventsCalendarPanel = lazy(() => import("../components/admin/GuildEventsCalendarPanel"));
const GuildImportPanel = lazy(() => import("../components/admin/GuildImportPanel"));

type AdminTabKey = "operations" | "events" | "current-state" | "imports";

const ADMIN_TABS: Array<{ key: AdminTabKey; label: string }> = [
  { key: "operations", label: "Operação" },
  { key: "events", label: "Eventos" },
  { key: "current-state", label: "Estado atual" },
  { key: "imports", label: "Importação" },
];

const hasLabyrinthParticipation = (member: { labyrinth: { score?: number; contributionRate?: number; isMvp?: boolean } }) =>
  Boolean(
    (member.labyrinth.score ?? 0) > 0 ||
      (member.labyrinth.contributionRate ?? 0) > 0 ||
      member.labyrinth.isMvp,
  );

const hasSubjugationParticipation = (member: { subjugation: { clearScore?: number; contributeRatio?: number } }) =>
  Boolean(
    (member.subjugation.clearScore ?? 0) > 0 ||
      (member.subjugation.contributeRatio ?? 0) > 0,
  );

function AdminPanelSkeleton({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border border-slate-700/60 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            <CardDescription className="text-slate-300">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-950/40" />
      </CardContent>
    </Card>
  );
}

export default function AdminPanel() {
  const { userData, isAdmin } = useData();
  const { currentState, isLoading, error, refresh } = useGuildCurrentState();
  const { punishments } = useWeeklyPunishments();
  const [activeTab, setActiveTab] = useState<AdminTabKey>("operations");
  const [shouldFocusWeeklyOverview, setShouldFocusWeeklyOverview] = useState(false);

  useEffect(() => {
    const handleImportCompleted = () => {
      setActiveTab("operations");
      setShouldFocusWeeklyOverview(true);
    };

    window.addEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);

    return () => {
      window.removeEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "operations" || !shouldFocusWeeklyOverview) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById("guild-weekly-overview");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setShouldFocusWeeklyOverview(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeTab, shouldFocusWeeklyOverview]);

  if (!userData || !isAdmin()) {
    return (
      <div className="clandestino-shell flex items-center justify-center p-4">
        <Card className="border-2 border-red-500/30 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-400">Acesso negado</CardTitle>
            <CardDescription className="text-slate-300">
              Apenas líderes e vice-líderes podem acessar esta área.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const members = currentState?.members ?? [];
  const markedForRemovalCount = useMemo(
    () => punishments.filter((punishment) => punishment.markedForRemoval).length,
    [punishments],
  );

  const summary = useMemo(() => {
    return members.reduce(
      (accumulator, member) => {
        accumulator.totalParticipants += 1;
        if (hasLabyrinthParticipation(member)) accumulator.labyrinthParticipation += 1;
        if (member.coverage.siegeAttacks || member.coverage.siegeDefenses) accumulator.siegeParticipation += 1;
        if (member.coverage.guildWarAttacks || member.coverage.guildWarDefenses) accumulator.guildBattleParticipation += 1;
        if (hasSubjugationParticipation(member)) accumulator.subjugationParticipation += 1;
        return accumulator;
      },
      {
        totalParticipants: 0,
        labyrinthParticipation: 0,
        siegeParticipation: 0,
        guildBattleParticipation: 0,
        subjugationParticipation: 0,
      },
    );
  }, [members]);

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link to="/">
          <Button variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao dashboard
          </Button>
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="clandestino-page-header">
            <div className="clandestino-page-header__eyebrow">Centro de comando</div>
            <h1 className="clandestino-page-header__title mb-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
              Painel de Administração
            </h1>
            <p className="clandestino-page-header__description text-sm sm:text-base">
              Leitura operacional da guilda com base no estado atual, nas janelas da semana, no histórico consolidado do backend e nas contas sincronizadas automaticamente pelas importações.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-400 sm:h-5 sm:w-5" />
              <span className="text-sm font-semibold text-white sm:text-base">
                {summary.totalParticipants} membros ativos
              </span>
            </div>
          </div>

          <div className="clandestino-toolbar">
            <Button
              type="button"
              onClick={() => void refresh()}
              disabled={isLoading}
              className="clandestino-action-button clandestino-action-button--refresh !text-cyan-50"
            >
              <Layers3 className="mr-2 h-4 w-4" />
              Atualizar métricas
            </Button>
            <Link to="/admin/current-state">
              <Button className="clandestino-action-button clandestino-action-button--refresh !text-cyan-50">
                <Layers3 className="mr-2 h-4 w-4" />
                Ver estado atual
              </Button>
            </Link>
            <Link to="/admin/import-history">
              <Button className="clandestino-action-button border-violet-500/40 bg-gradient-to-b from-violet-900/95 to-fuchsia-950/95 !text-violet-50 hover:border-violet-400/70 hover:from-violet-800 hover:to-fuchsia-900">
                <History className="mr-2 h-4 w-4" />
                Ver histórico
              </Button>
            </Link>
            <Link to="/admin/members-access">
              <Button className="clandestino-action-button clandestino-action-button--admin !text-amber-50">
                <KeyRound className="mr-2 h-4 w-4" />
                Ver membros e acessos
              </Button>
            </Link>
            <Link to="/admin/punishments">
              <Button className="clandestino-action-button border-red-500/40 bg-gradient-to-b from-red-900/95 to-rose-950/95 !text-red-50 hover:border-red-400/70 hover:from-red-800 hover:to-rose-900">
                <ShieldAlert className="mr-2 h-4 w-4" />
                Ver punições
              </Button>
            </Link>
            <Link to="/events">
              <Button className="clandestino-action-button border-indigo-500/40 bg-gradient-to-b from-indigo-900/95 to-violet-950/95 !text-indigo-50 hover:border-indigo-400/70 hover:from-indigo-800 hover:to-violet-900">
                <CalendarDays className="mr-2 h-4 w-4" />
                Ver eventos
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {markedForRemovalCount > 0 ? (
          <Alert className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-50">
            <AlertCircle className="h-4 w-4 text-fuchsia-300" />
            <AlertTitle>Membros marcados para remoção</AlertTitle>
            <AlertDescription>
              {markedForRemovalCount} membro(s) estão marcados para remoção na avaliação semanal atual.
              Abra a página de punições para ver os motivos detalhados.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="clandestino-stat-card border-blue-500/30 backdrop-blur-sm">
            <CardHeader className="clandestino-stat-card__header">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-400 sm:h-5 sm:w-5" />
                <CardTitle className="text-xs text-white sm:text-sm lg:text-base">Labirinto</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="clandestino-stat-card__value">
                {summary.labyrinthParticipation}/{summary.totalParticipants}
              </div>
              <p className="clandestino-stat-card__hint">membros com cobertura no ciclo</p>
            </CardContent>
          </Card>

          <Card className="clandestino-stat-card border-red-500/30 backdrop-blur-sm">
            <CardHeader className="clandestino-stat-card__header">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-red-400 sm:h-5 sm:w-5" />
                <CardTitle className="text-xs text-white sm:text-sm lg:text-base">Assalto</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="clandestino-stat-card__value">
                {summary.siegeParticipation}/{summary.totalParticipants}
              </div>
              <p className="clandestino-stat-card__hint">membros com dados na semana</p>
            </CardContent>
          </Card>

          <Card className="clandestino-stat-card border-green-500/30 backdrop-blur-sm">
            <CardHeader className="clandestino-stat-card__header">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400 sm:h-5 sm:w-5" />
                <CardTitle className="text-xs text-white sm:text-sm lg:text-base">Guilda</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="clandestino-stat-card__value">
                {summary.guildBattleParticipation}/{summary.totalParticipants}
              </div>
              <p className="clandestino-stat-card__hint">membros com dados na semana</p>
            </CardContent>
          </Card>

          <Card className="clandestino-stat-card border-purple-500/30 backdrop-blur-sm">
            <CardHeader className="clandestino-stat-card__header">
              <div className="flex items-center gap-2">
                <Skull className="h-4 w-4 text-purple-400 sm:h-5 sm:w-5" />
                <CardTitle className="text-xs text-white sm:text-sm lg:text-base">Subjugação</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="clandestino-stat-card__value">
                {summary.subjugationParticipation}/{summary.totalParticipants}
              </div>
              <p className="clandestino-stat-card__hint">membros com dados no ciclo</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700/60 bg-slate-900/50 p-2">
          {ADMIN_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "operations" && (
          <div className="space-y-6">
            <Card className="border border-slate-700/60 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Leitura operacional</CardTitle>
                <CardDescription className="text-slate-300">
                  Use a visão semanal para acompanhar os totais rastreados na semana, comparar cada janela com a referência por rodada, ver quem fechou as duas GW, quem ficou abaixo de 80% em assalto e quem não atacou em uma janela específica. As contas e cargos também seguem a importação mais recente da guilda.
                </CardDescription>
              </CardHeader>
            </Card>

            <Suspense
              fallback={
                <AdminPanelSkeleton
                  title="Auditoria de equipamento"
                  description="Carregando os alertas de runas e artefatos das defesas."
                />
              }
            >
              <GuildDefenseEquipmentAuditPanel currentState={currentState} />
            </Suspense>

            <Suspense
              fallback={
                <AdminPanelSkeleton
                  title="Visão semanal e por evento"
                  description="Carregando o consolidado semanal da guilda."
                />
              }
            >
              <GuildActivityOverviewPanel currentState={currentState} />
            </Suspense>

            <Suspense
              fallback={
                <AdminPanelSkeleton
                  title="Rankings de liderança"
                  description="Carregando as janelas críticas da semana."
                />
              }
            >
              <GuildLeadershipRankingPanel currentState={currentState} />
            </Suspense>
          </div>
        )}

        {activeTab === "events" && (
          <Suspense
            fallback={
              <AdminPanelSkeleton
                title="Eventos do mês"
                description="Carregando o calendário operacional da guilda."
              />
            }
          >
            <GuildEventsCalendarPanel currentState={currentState} />
          </Suspense>
        )}

        {activeTab === "current-state" && (
          <Suspense
            fallback={
              <AdminPanelSkeleton
                title="Estado atual da guilda"
                description="Carregando o snapshot mesclado mais recente."
              />
            }
          >
            <GuildCurrentStatePanel />
          </Suspense>
        )}

        {activeTab === "imports" && (
          <Suspense
            fallback={
              <AdminPanelSkeleton
                title="Importação"
                description="Carregando o fluxo de upload e preview."
              />
            }
          >
            <GuildImportPanel />
          </Suspense>
        )}
      </div>
    </div>
  );
}
