import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type GuildWeekContextValue = {
  selectedWeekKey: string;
  setSelectedWeekKey: (weekKey: string) => void;
};

const GuildWeekContext = createContext<GuildWeekContextValue | undefined>(undefined);

export function GuildWeekProvider({ children }: { children: ReactNode }) {
  const [selectedWeekKey, setSelectedWeekKey] = useState("");

  const value = useMemo(
    () => ({
      selectedWeekKey,
      setSelectedWeekKey,
    }),
    [selectedWeekKey],
  );

  return <GuildWeekContext.Provider value={value}>{children}</GuildWeekContext.Provider>;
}

export function useGuildWeek() {
  const context = useContext(GuildWeekContext);
  if (!context) {
    throw new Error("useGuildWeek must be used within a GuildWeekProvider");
  }

  return context;
}
