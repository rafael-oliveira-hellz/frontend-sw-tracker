export type UserRole = "member" | "senior" | "vice-leader" | "leader";

export interface User {
  id: string;
  username: string;
  summonerNumber: string;
  guildName: string;
  role: UserRole;
  guildId?: number;
  wizardId?: number;
  importedFromGuild?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
