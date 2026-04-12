import { AlertCircle, AlertTriangle, Loader2, RefreshCcw, Shield, ShieldCheck, Swords } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_GUILD_CURRENT_STATE_ENDPOINT,
  fetchGuildCurrentState,
  GUILD_IMPORT_COMPLETED_EVENT,
  readLastGuildId,
  type DefenseDeckSummaryDto,
  type GuildCurrentMemberStateDto,
  type GuildCurrentStateDto,
  type TeamUsageSummaryDto,
} from "../../lib/guildImport";
import { formatTeamLabel } from "../../lib/monsterCatalog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

const formatPercent = (value?: number) => `${(value ?? 0).toFixed(1)}%`;

const formatDefenseLocation = (defense: DefenseDeckSummaryDto) =>
  defense.context === "guildWar"
    ? `Rodada ${defense.round ?? "-"}`
    : `Base ${defense.assignedBase ?? "-"}`;

function TeamChip({ team }: { team: TeamUsageSummaryDto }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-sm font-medium text-white">{formatTeamLabel(team.team)}</p>
      <p className="mt-1 text-xs text-slate-400">
        {team.totalBattles} usos • WR {formatPercent(team.winRate)}
      </p>
    </div>
  );
}

function DefenseChip({ defense }: { defense: DefenseDeckSummaryDto }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-sm font-medium text-white">{formatTeamLabel(defense.team)}</p>
      <p className="mt-1 text-xs text-slate-400">
        {formatDefenseLocation(defense)} • WR {formatPercent(defense.winRate)}
      </p>
      {defense.equipmentAudit?.status === "incomplete" ? (
        <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-100">
          <div className="flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Equipamento incompleto
          </div>
          <p className="mt-1">{defense.equipmentAudit.summary}</p>
        </div>
      ) : null}
      {defense.equipmentAudit?.status === "unknown" ? (
        <p className="mt-2 text-xs text-slate-500">{defense.equipmentAudit.summary}</p>
      ) : null}
    </div>
  );
}

function MemberCurrentStateCard({ member }: { member: GuildCurrentMemberStateDto }) {
  const coverage = Object.entries(member.coverage).filter(([, enabled]) => enabled);
  const topGuildWarTeams = member.guildWar.teams.slice(0, 2);
  const topSiegeTeams = member.siege.teams.slice(0, 2);
  const guildWarDefenses = member.guildWar.defenses.slice(0, 3);
  const siegeDefenses = member.siege.defenses.slice(0, 3);

  return (
    <Card className="border border-slate-700/60 bg-slate-900/50">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base text-white">{member.member.wizardName}</CardTitle>
          {member.member.isCurrentUser && (
            <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-200">Você</Badge>
          )}
          {member.labyrinth.isMvp && (
            <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-200">MVP Lab</Badge>
          )}
        </div>
        <CardDescription className="text-slate-400">
          Atualizado em {formatDateTime(member.updatedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-slate-500">Guild War</p>
            <p>{member.guildWar.attacks.length} ataques</p>
            <p>{member.guildWar.defenses.length} defesas</p>
          </div>
          <div>
            <p className="text-slate-500">Siege</p>
            <p>{member.siege.attacks.length} ataques</p>
            <p>{member.siege.defenses.length} defesas</p>
          </div>
          <div>
            <p className="text-slate-500">Labirinto</p>
            <p>Score: {member.labyrinth.score ?? 0}</p>
            <p>Rank: {member.labyrinth.rank ?? "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">Subjugação</p>
            <p>Score: {member.subjugation.clearScore ?? 0}</p>
            <p>Rank: {member.subjugation.rank ?? "-"}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-200">
              <Swords className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium">Melhores times de ataque</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-slate-500">Guild War</p>
                <div className="space-y-2">
                  {topGuildWarTeams.length > 0 ? (
                    topGuildWarTeams.map((team) => (
                      <TeamChip key={`${member.wizardId}-gw-${team.team.signature}`} team={team} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Sem time atual</p>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">Siege</p>
                <div className="space-y-2">
                  {topSiegeTeams.length > 0 ? (
                    topSiegeTeams.map((team) => (
                      <TeamChip key={`${member.wizardId}-siege-${team.team.signature}`} team={team} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Sem time atual</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-200">
              <Shield className="h-4 w-4 text-sky-300" />
              <span className="text-sm font-medium">Decks de defesa atuais</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-slate-500">Guild War</p>
                <div className="space-y-2">
                  {guildWarDefenses.length > 0 ? (
                    guildWarDefenses.map((defense, index) => (
                      <DefenseChip key={`${member.wizardId}-gw-defense-${index}`} defense={defense} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Sem defesa atual</p>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">Siege</p>
                <div className="space-y-2">
                  {siegeDefenses.length > 0 ? (
                    siegeDefenses.map((defense, index) => (
                      <DefenseChip
                        key={`${member.wizardId}-siege-defense-${index}`}
                        defense={defense}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Sem defesa atual</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {coverage.length > 0 ? (
            coverage.map(([key]) => (
              <Badge key={key} className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                {key}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-500">Sem cobertura detectada.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function GuildCurrentStatePanel() {
  const [endpoint, setEndpoint] = useState(DEFAULT_GUILD_CURRENT_STATE_ENDPOINT);
  const [guildId, setGuildId] = useState(readLastGuildId() ?? "");
  const [currentState, setCurrentState] = useState<GuildCurrentStateDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentState = useCallback(async (preferredGuildId?: string | number) => {
    setIsLoading(true);
    setError(null);

    try {
      const nextGuildId = preferredGuildId ?? guildId;
      const state = await fetchGuildCurrentState(endpoint, nextGuildId || undefined);
      setCurrentState(state);
      if (state.guildId !== undefined) {
        setGuildId(String(state.guildId));
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Falha inesperada ao carregar o estado atual.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, guildId]);

  useEffect(() => {
    void loadCurrentState();
  }, [loadCurrentState]);

  useEffect(() => {
    const handleImportCompleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ guildId?: number }>;
      void loadCurrentState(customEvent.detail?.guildId);
    };

    window.addEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);

    return () => {
      window.removeEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);
    };
  }, [loadCurrentState]);

  const summary = useMemo(() => {
    if (!currentState) {
      return {
        members: 0,
        guildWarDefenses: 0,
        siegeDefenses: 0,
        attackTeams: 0,
      };
    }

    return currentState.members.reduce(
      (accumulator, member) => {
        accumulator.members += 1;
        accumulator.guildWarDefenses += member.guildWar.defenses.length;
        accumulator.siegeDefenses += member.siege.defenses.length;
        accumulator.attackTeams += member.guildWar.teams.length + member.siege.teams.length;
        return accumulator;
      },
      { members: 0, guildWarDefenses: 0, siegeDefenses: 0, attackTeams: 0 },
    );
  }, [currentState]);

  return (
    <Card className="border-2 border-cyan-500/30 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <CardTitle className="text-white">Estado atual da guilda</CardTitle>
            <CardDescription className="text-slate-300">
              Leitura da visão consolidada mais recente salva no backend.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_14rem_auto]">
          <div className="space-y-2">
            <Label htmlFor="current-state-endpoint" className="text-slate-200">
              Endpoint do estado atual
            </Label>
            <Input
              id="current-state-endpoint"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="border-slate-700 bg-slate-800/70 text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-state-guild-id" className="text-slate-200">
              Guild ID
            </Label>
            <Input
              id="current-state-guild-id"
              value={guildId}
              onChange={(event) => setGuildId(event.target.value)}
              placeholder="Opcional"
              className="border-slate-700 bg-slate-800/70 text-slate-100"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => void loadCurrentState()}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 hover:from-cyan-400 hover:to-sky-500 lg:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar estado
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Guilda</p>
            <p className="text-sm font-semibold text-white">
              {currentState?.guildName ?? "Não identificada"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Última atualização</p>
            <p className="text-sm font-semibold text-white">{formatDateTime(currentState?.updatedAt)}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Membros</p>
            <p className="text-sm font-semibold text-white">{summary.members}</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Defesas GW + Siege</p>
            <p className="text-sm font-semibold text-white">
              {summary.guildWarDefenses + summary.siegeDefenses}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400">Composições rastreadas</p>
            <p className="text-sm font-semibold text-white">{summary.attackTeams}</p>
          </div>
        </div>

        <ScrollArea className="h-[38rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
          <div className="space-y-4">
            {currentState?.members.length ? (
              currentState.members.map((member) => (
                <MemberCurrentStateCard key={member.wizardId} member={member} />
              ))
            ) : !isLoading ? (
              <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                Nenhum estado atual disponível ainda.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default GuildCurrentStatePanel;
