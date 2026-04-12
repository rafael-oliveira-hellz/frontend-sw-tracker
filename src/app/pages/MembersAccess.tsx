import { AlertCircle, ArrowLeft, KeyRound, Loader2, RefreshCcw, Search, ShieldCheck, UserCog, UserPlus, Users, Wand2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DisciplineStatus, resolveDisciplineCopy } from "../components/shared/DisciplineStatus";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useData } from "../context/DataContext";
import {
  fetchAdminAuthUsers,
  resetAdminUserPassword,
  resyncImportedUsers,
  type AuthUserDto,
} from "../lib/auth";
import { GUILD_IMPORT_COMPLETED_EVENT } from "../lib/guildImport";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";
import { useWeeklyPunishments } from "../lib/useWeeklyPunishments";

type LoginFilter = "all" | "imported" | "missing";
type RoleFilter = "all" | "leader" | "vice-leader" | "senior" | "member" | "leadership";

const roleLabelMap: Record<string, string> = {
  leader: "Líder",
  "vice-leader": "Vice-líder",
  senior: "Sênior",
  member: "Membro",
};

const formatRoleLabel = (role?: string) => roleLabelMap[role ?? "member"] ?? "Membro";

export default function MembersAccess() {
  const { userData, isAdmin, accessToken } = useData();
  const { currentState, isLoading: isLoadingCurrentState, error: currentStateError, refresh } = useGuildCurrentState();
  const [authUsers, setAuthUsers] = useState<AuthUserDto[]>([]);
  const [isLoadingAuthUsers, setIsLoadingAuthUsers] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [isResyncingImportedUsers, setIsResyncingImportedUsers] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loginFilter, setLoginFilter] = useState<LoginFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [latestOnly, setLatestOnly] = useState(false);
  const { punishments: weeklyPunishments, refresh: refreshWeeklyPunishments } = useWeeklyPunishments();

  const loadAuthUsers = useCallback(async () => {
    if (!accessToken || !isAdmin()) {
      return;
    }

    setIsLoadingAuthUsers(true);
    setAuthError(null);

    try {
      const users = await fetchAdminAuthUsers(accessToken);
      setAuthUsers(users);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Falha ao carregar os acessos sincronizados.");
    } finally {
      setIsLoadingAuthUsers(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void loadAuthUsers();
  }, [loadAuthUsers]);

  useEffect(() => {
    const handleImportCompleted = () => {
      void loadAuthUsers();
      void refreshWeeklyPunishments();
    };

    window.addEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);

    return () => {
      window.removeEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);
    };
  }, [loadAuthUsers, refreshWeeklyPunishments]);

  const rows = useMemo(() => {
    const members = currentState?.members ?? [];
    const authUsersByWizardId = new Map<number, AuthUserDto>();
    const authUsersByUsername = new Map<string, AuthUserDto>();
    const latestPunishmentByWizardId = new Map<number, (typeof weeklyPunishments)[number]>();

    for (const authUser of authUsers) {
      if (authUser.wizardId !== undefined) {
        authUsersByWizardId.set(authUser.wizardId, authUser);
      }
      authUsersByUsername.set(authUser.username.toLowerCase(), authUser);
    }

    for (const punishment of weeklyPunishments) {
      if (!latestPunishmentByWizardId.has(punishment.wizardId)) {
        latestPunishmentByWizardId.set(punishment.wizardId, punishment);
      }
    }

    return members
      .map((member) => {
        const authUser =
          authUsersByWizardId.get(member.wizardId) ??
          authUsersByUsername.get(member.member.wizardName.toLowerCase()) ??
          null;
        const effectiveRole = authUser?.role ?? member.member.guildRole ?? "member";
        const punishment = latestPunishmentByWizardId.get(member.wizardId);

        return {
          wizardId: member.wizardId,
          wizardName: member.member.wizardName,
          effectiveRole,
          guildId: authUser?.guildId ?? member.member.guildId,
          authWizardId: authUser?.wizardId,
          hasImportedLogin: Boolean(authUser?.importedFromGuild),
          authUserId: authUser?.id,
          lastImportRunId: member.importRunId,
          lastSeenAt: member.updatedAt,
          summonerNumber: authUser?.summonerNumber ?? String(member.wizardId),
          punishment,
        };
      })
      .sort((left, right) => left.wizardName.localeCompare(right.wizardName));
  }, [authUsers, currentState, weeklyPunishments]);

  const latestImportRunId = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }

    return [...rows].sort(
      (left, right) => new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime(),
    )[0]?.lastImportRunId ?? null;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (normalizedSearch) {
        const searchTarget = `${row.wizardName} ${row.summonerNumber}`.toLowerCase();
        if (!searchTarget.includes(normalizedSearch)) {
          return false;
        }
      }

      if (loginFilter === "imported" && !row.hasImportedLogin) {
        return false;
      }

      if (loginFilter === "missing" && row.hasImportedLogin) {
        return false;
      }

      if (roleFilter === "leadership") {
        if (!["leader", "vice-leader", "senior"].includes(row.effectiveRole)) {
          return false;
        }
      } else if (roleFilter !== "all" && row.effectiveRole !== roleFilter) {
        return false;
      }

      if (latestOnly && latestImportRunId && row.lastImportRunId !== latestImportRunId) {
        return false;
      }

      return true;
    });
  }, [latestImportRunId, latestOnly, loginFilter, roleFilter, rows, search]);

  const handleRefreshAll = async () => {
    await refresh();
    await loadAuthUsers();
    await refreshWeeklyPunishments();
  };

  const handleResetPassword = async (authUserId: string) => {
    if (!accessToken) {
      return;
    }

    setResettingUserId(authUserId);
    setResetMessage(null);
    setAuthError(null);

    try {
      const updatedUser = await resetAdminUserPassword(authUserId, accessToken);
      setAuthUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setResetMessage(`Senha padrão resetada com sucesso para ${updatedUser.username}.`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Falha ao resetar a senha.");
    } finally {
      setResettingUserId(null);
    }
  };

  const handleResyncImportedUsers = async () => {
    if (!accessToken) {
      return;
    }

    setIsResyncingImportedUsers(true);
    setResetMessage(null);
    setAuthError(null);

    try {
      const sync = await resyncImportedUsers(accessToken);
      await refresh();
      await loadAuthUsers();
      await refreshWeeklyPunishments();
      setResetMessage(
        `Acessos importados ressincronizados com sucesso. ${sync.upserted} conta(s) atualizada(s)/criada(s) e ${sync.removed} removida(s).`,
      );
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Falha ao ressincronizar os acessos importados.",
      );
    } finally {
      setIsResyncingImportedUsers(false);
    }
  };

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

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/admin">
            <Button variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao admin
            </Button>
          </Link>

          <div className="clandestino-toolbar">
            <Button
              type="button"
              onClick={() => void handleResyncImportedUsers()}
              disabled={isResyncingImportedUsers || !accessToken}
              className="clandestino-action-button border-emerald-500/40 bg-gradient-to-b from-emerald-900/95 to-teal-950/95 !text-emerald-50 hover:border-emerald-400/70 hover:from-emerald-800 hover:to-teal-900"
            >
              {isResyncingImportedUsers ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ressincronizando
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Ressincronizar acessos importados
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => void handleRefreshAll()}
              disabled={isLoadingCurrentState || isLoadingAuthUsers || isResyncingImportedUsers}
              className="clandestino-action-button clandestino-action-button--refresh !text-cyan-50"
            >
              {(isLoadingCurrentState || isLoadingAuthUsers) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar acessos
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="border-2 border-cyan-500/30 bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2">
                <UserCog className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="clandestino-page-header">
                <div className="clandestino-page-header__eyebrow">Acessos sincronizados</div>
                <CardTitle className="clandestino-page-header__title text-white">Membros e acessos</CardTitle>
                <CardDescription className="clandestino-page-header__description text-slate-300">
                  A importação da guilda é a fonte de verdade das contas e do cargo sincronizado. Aqui você acompanha se o login já foi sincronizado, em qual importação o membro apareceu por último e pode reaplicar a senha padrão.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Membros no estado atual</p>
                <p className="text-lg font-semibold text-white">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Logins sincronizados</p>
                <p className="text-lg font-semibold text-white">{rows.filter((row) => row.hasImportedLogin).length}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Pendentes de sincronização</p>
                <p className="text-lg font-semibold text-white">{rows.filter((row) => !row.hasImportedLogin).length}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Busca</p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nome ou número do invocador"
                    className="border-slate-700 bg-slate-800/70 pl-9 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Login</p>
                <Select value={loginFilter} onValueChange={(value) => setLoginFilter(value as LoginFilter)}>
                  <SelectTrigger className="border-slate-700 bg-slate-800/70 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="imported">Só com login sincronizado</SelectItem>
                    <SelectItem value="missing">Só pendentes de sincronização</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Cargo</p>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                  <SelectTrigger className="border-slate-700 bg-slate-800/70 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="leadership">Só líderes, vice e sênior</SelectItem>
                    <SelectItem value="leader">Só líderes</SelectItem>
                    <SelectItem value="vice-leader">Só vice-líderes</SelectItem>
                    <SelectItem value="senior">Só sênior</SelectItem>
                    <SelectItem value="member">Só membros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Última importação</p>
                <Button
                  type="button"
                  variant={latestOnly ? "default" : "outline"}
                  onClick={() => setLatestOnly((current) => !current)}
                  className={
                    latestOnly
                      ? "clandestino-action-button clandestino-action-button--admin !text-amber-50 w-full"
                      : "w-full border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-700"
                  }
                >
                  {latestOnly ? "Filtrando última importação" : "Só quem apareceu na última"}
                </Button>
              </div>
            </div>

            {(currentStateError || authError) && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha ao carregar</AlertTitle>
                <AlertDescription>{currentStateError ?? authError}</AlertDescription>
              </Alert>
            )}

            {resetMessage && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-50">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <AlertTitle>Ação concluída</AlertTitle>
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-xl border border-slate-700/60 bg-slate-950/20 p-4 text-sm text-slate-300">
              O reset usa a senha padrão configurada no backend para membros importados e encerra as sessões atuais do usuário para forçar novo login.
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-950/20 p-4 text-sm text-slate-300">
              Apagar alguém apenas da collection <span className="font-mono text-slate-100">auth</span> remove o login, mas não remove o membro do estado atual da guilda. Para ele deixar de aparecer aqui, a próxima visão consolidada precisa vir sem esse membro, ou precisamos criar uma camada manual de exclusão separada da importação.
            </div>

            <ScrollArea className="h-[38rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <div className="mb-3 text-xs text-slate-400">
                {filteredRows.length} membro(s) exibido(s)
              </div>
              <div className="space-y-3">
                {filteredRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                    Nenhum membro corresponde aos filtros atuais.
                  </div>
                ) : (
                  filteredRows.map((row) => (
                    <Card key={row.wizardId} className="border border-slate-800 bg-slate-900/50">
                      <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-white">{row.wizardName}</p>
                              <Badge className="clandestino-badge border-sky-500/30 bg-sky-500/10 text-sky-200">
                                {formatRoleLabel(row.effectiveRole)}
                              </Badge>
                              {row.hasImportedLogin ? (
                                <Badge className="clandestino-badge clandestino-badge--success">
                                  Login sincronizado
                                </Badge>
                              ) : (
                                <Badge className="clandestino-badge clandestino-badge--warning">
                                  Pendente de sincronização
                                </Badge>
                              )}
                              {latestImportRunId && row.lastImportRunId === latestImportRunId && (
                                <Badge className="clandestino-badge border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">
                                  Última importação
                                </Badge>
                              )}
                              <DisciplineStatus punishment={row.punishment} hideWhenClear />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                                <p className="text-xs text-slate-500">Cargo sincronizado</p>
                                <p className="text-sm text-white">
                                  {row.hasImportedLogin
                                    ? formatRoleLabel(row.effectiveRole)
                                    : `${formatRoleLabel(row.effectiveRole)} (sem login sincronizado)`}
                                </p>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                                <p className="text-xs text-slate-500">Última importação</p>
                                <p className="text-sm text-white">{row.lastImportRunId}</p>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                                <p className="text-xs text-slate-500">Última aparição</p>
                                <p className="text-sm text-white">{new Date(row.lastSeenAt).toLocaleString("pt-BR")}</p>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                                <p className="text-xs text-slate-500">Disciplina</p>
                                <p className="text-sm text-white">
                                  {resolveDisciplineCopy(row.punishment, {
                                    labels: {
                                      punished: "Suspenso",
                                      cooldown: "Suspenso",
                                      clear: "Sem punição recente",
                                    },
                                  }).label}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {row.punishment?.weekKey
                                    ? `Semana ${row.punishment.weekKey}`
                                    : "Nenhuma avaliação recente"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex min-w-64 flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                            <div className="flex items-center gap-2 text-slate-200">
                              <Users className="h-4 w-4 text-cyan-300" />
                              <span className="text-sm">Invocador #{row.summonerNumber}</span>
                            </div>

                            <Button
                              type="button"
                              disabled={!row.authUserId || resettingUserId === row.authUserId || isResyncingImportedUsers}
                              onClick={() => row.authUserId && void handleResetPassword(row.authUserId)}
                              className="clandestino-action-button clandestino-action-button--admin !text-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {resettingUserId === row.authUserId ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Resetando
                                </>
                              ) : (
                                <>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Resetar senha padrão
                                </>
                              )}
                            </Button>

                            {!row.hasImportedLogin && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <UserPlus className="h-4 w-4" />
                                Este membro ainda não foi sincronizado como conta de acesso a partir das importações da guilda.
                              </div>
                            )}

                            <details className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
                              <summary className="cursor-pointer select-none font-medium text-slate-300">
                                Ver dados técnicos
                              </summary>
                              <div className="mt-3 space-y-1 font-mono">
                                <div>wizardId: {row.wizardId}</div>
                                <div>authWizardId: {row.authWizardId ?? "indisponível"}</div>
                                <div>guildId: {row.guildId ?? "indisponível"}</div>
                                <div>authUserId: {row.authUserId ?? "sem login sincronizado"}</div>
                                <div>importRunId: {row.lastImportRunId}</div>
                              </div>
                            </details>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
