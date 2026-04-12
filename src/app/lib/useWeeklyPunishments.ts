import { useCallback, useEffect, useState } from "react";

import { useData } from "../context/DataContext";
import {
  fetchGuildWeeklyPunishments,
  type GuildWeeklyPunishmentDto,
} from "./guildImport";

export function useWeeklyPunishments(weekKey?: string) {
  const { accessToken, isAdmin } = useData();
  const [punishments, setPunishments] = useState<GuildWeeklyPunishmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken || !isAdmin()) {
      setPunishments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const next = await fetchGuildWeeklyPunishments(accessToken, weekKey);
      setPunishments(next);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Falha ao carregar as punições semanais.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAdmin, weekKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    punishments,
    isLoading,
    error,
    refresh,
  };
}
