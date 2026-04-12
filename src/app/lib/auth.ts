const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");

export type UserRole = "member" | "senior" | "vice-leader" | "leader";

export interface AuthUserDto {
  id: string;
  username: string;
  summonerNumber: string;
  guildName: string;
  role: UserRole;
  guildId?: number;
  wizardId?: number;
  importedFromGuild?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  };
}

export interface LoginRequestDto {
  usernameOrNumber: string;
  password: string;
}

export interface RefreshRequestDto {
  refreshToken: string;
}

export interface LogoutRequestDto {
  refreshToken?: string;
}

export interface AuthenticateRequestDto {
  accessToken?: string;
}

export interface AuthResponseDto {
  success: boolean;
  session?: AuthSessionDto;
  user?: AuthUserDto;
  users?: AuthUserDto[];
  error?: string;
  message?: string;
}

export interface AdminUsersResponseDto extends AuthResponseDto {
  users?: AuthUserDto[];
}

export interface ResetPasswordResponseDto extends AuthResponseDto {
  user?: AuthUserDto;
}

export interface ResyncImportedUsersResponseDto extends AuthResponseDto {
  sync?: {
    upserted: number;
    removed: number;
    defaultPasswordApplied: boolean;
    requestedBy: string;
    source: {
      importRunId: string;
      snapshotId: string;
      guildId?: number;
      guildName?: string;
      users: number;
    };
  };
}

export const DEFAULT_AUTH_LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login`;
export const DEFAULT_AUTH_LOGOUT_ENDPOINT = `${API_BASE_URL}/api/auth/logout`;
export const DEFAULT_AUTH_ME_ENDPOINT = `${API_BASE_URL}/api/auth/me`;
export const DEFAULT_AUTH_REFRESH_ENDPOINT = `${API_BASE_URL}/api/auth/refresh`;
export const DEFAULT_AUTH_AUTHENTICATE_ENDPOINT = `${API_BASE_URL}/api/auth/authenticate`;
export const DEFAULT_AUTH_ADMIN_USERS_ENDPOINT = `${API_BASE_URL}/api/auth/admin/users`;
export const DEFAULT_AUTH_ADMIN_RESET_PASSWORD_ENDPOINT = `${API_BASE_URL}/api/auth/admin/reset-password`;
export const DEFAULT_AUTH_ADMIN_RESYNC_IMPORTED_USERS_ENDPOINT = `${API_BASE_URL}/api/auth/admin/resync-imported-users`;

const parseAuthResponse = async (response: Response) => {
  const payload = (await response.json()) as AuthResponseDto;
  if (!response.ok) {
    throw new Error(payload.message ?? "Falha na autenticação.");
  }

  return payload;
};

export async function loginAuth(
  request: LoginRequestDto,
  endpoint = DEFAULT_AUTH_LOGIN_ENDPOINT,
): Promise<AuthSessionDto> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await parseAuthResponse(response);
  if (!payload.session) {
    throw new Error("Login concluído sem sessão retornada.");
  }

  return payload.session;
}

export async function logoutAuth(
  request: LogoutRequestDto,
  accessToken?: string,
  endpoint = DEFAULT_AUTH_LOGOUT_ENDPOINT,
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  });

  await parseAuthResponse(response);
}

export async function fetchAuthMe(
  accessToken: string,
  endpoint = DEFAULT_AUTH_ME_ENDPOINT,
): Promise<AuthUserDto> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await parseAuthResponse(response);
  if (!payload.user) {
    throw new Error("Usuário não retornado em /me.");
  }

  return payload.user;
}

export async function refreshAuthSession(
  request: RefreshRequestDto,
  endpoint = DEFAULT_AUTH_REFRESH_ENDPOINT,
): Promise<AuthSessionDto> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await parseAuthResponse(response);
  if (!payload.session) {
    throw new Error("Refresh concluído sem sessão retornada.");
  }

  return payload.session;
}

export async function authenticateAccessToken(
  request: AuthenticateRequestDto,
  endpoint = DEFAULT_AUTH_AUTHENTICATE_ENDPOINT,
): Promise<AuthUserDto> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(request.accessToken ? { Authorization: `Bearer ${request.accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  });

  const payload = await parseAuthResponse(response);
  if (!payload.user) {
    throw new Error("Usuário não retornado em /authenticate.");
  }

  return payload.user;
}

export async function fetchAdminAuthUsers(
  accessToken: string,
  endpoint = DEFAULT_AUTH_ADMIN_USERS_ENDPOINT,
): Promise<AuthUserDto[]> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as AdminUsersResponseDto;
  if (!response.ok) {
    throw new Error(payload.message ?? "Falha ao carregar os acessos da guilda.");
  }

  return payload.users ?? [];
}

export async function resetAdminUserPassword(
  userId: string,
  accessToken: string,
  endpoint = DEFAULT_AUTH_ADMIN_RESET_PASSWORD_ENDPOINT,
): Promise<AuthUserDto> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId }),
  });

  const payload = (await response.json()) as ResetPasswordResponseDto;
  if (!response.ok || !payload.user) {
    throw new Error(payload.message ?? "Falha ao resetar a senha do usuário.");
  }

  return payload.user;
}

export async function resyncImportedUsers(
  accessToken: string,
  endpoint = DEFAULT_AUTH_ADMIN_RESYNC_IMPORTED_USERS_ENDPOINT,
): Promise<NonNullable<ResyncImportedUsersResponseDto["sync"]>> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  const payload = (await response.json()) as ResyncImportedUsersResponseDto;
  if (!response.ok || !payload.sync) {
    throw new Error(payload.message ?? "Falha ao ressincronizar os acessos importados.");
  }

  return payload.sync;
}
