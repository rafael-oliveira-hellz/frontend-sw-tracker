import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_GUILD_CURRENT_STATE_ENDPOINT,
  fetchGuildCurrentState,
  GUILD_IMPORT_COMPLETED_EVENT,
  readLastGuildId,
  type GuildCurrentMemberStateDto,
  type GuildCurrentStateDto,
} from "./guildImport";

type UseGuildCurrentStateOptions = {
  endpoint?: string;
  preferredGuildId?: string | number;
  currentUserName?: string;
  currentWizardId?: number;
};

export function useGuildCurrentState(options: UseGuildCurrentStateOptions = {}) {
  const [currentState, setCurrentState] = useState<GuildCurrentStateDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = options.endpoint ?? DEFAULT_GUILD_CURRENT_STATE_ENDPOINT;
  const preferredGuildId = options.preferredGuildId && !readLastGuildId()
    ? options.preferredGuildId
    : undefined;

  const load = useCallback(async (guildIdOverride?: string | number) => {
    setIsLoading(true);
    setError(null);

    try {
      const state = await fetchGuildCurrentState(endpoint, guildIdOverride ?? preferredGuildId);
      setCurrentState(state);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar os dados atuais da guilda.");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, preferredGuildId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleImportCompleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ guildId?: number }>;
      void load(customEvent.detail?.guildId);
    };

    window.addEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);

    return () => {
      window.removeEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);
    };
  }, [load]);

  const currentMember: GuildCurrentMemberStateDto | null = currentState?.members.find((member) => {
    if (options.currentWizardId !== undefined && member.wizardId === options.currentWizardId) {
      return true;
    }

    if (member.member.isCurrentUser) {
      return true;
    }

    if (!options.currentUserName) {
      return false;
    }

    return member.member.wizardName.toLowerCase() === options.currentUserName.toLowerCase();
  }) ?? null;

  return {
    currentState,
    currentMember,
    isLoading,
    error,
    refresh: load,
  };
}
