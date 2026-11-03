import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  authorizedClients?: Array<{ id: string; businessName: string }>;
}

export interface RoleItem {
  id: number;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: Array<{ id: string; module: string; description: string }>;
}

export interface PermissionItem {
  id: string;
  module: string;
  description: string;
}

export interface ApiCaseItem {
  id: string;
  code: string;
  title: string;
  descriptionRaw: string;
  affectedSystem: string;
  affectedModule: string;
  caseType: string;
  priority: string;
  status: string;
  createdAt: string;
  client?: {
    id: string;
    code: string;
    businessName: string;
    dbConnections?: Array<{
      id: string;
      name: string;
      engine: string;
      host: string;
      port: number;
      instanceName?: string;
      databaseName: string;
      environment: string;
      isReadOnly: boolean;
    }>;
  };
  technicalAnalysis?: {
    rootCauseSummary?: string;
    reproductionSteps?: string;
    affectedObjects?: {
      tables?: string[];
      storedProcedures?: string[];
    };
    diagnosticQueriesSql?: string;
  };
  solution?: {
    solutionSummary?: string;
    solutionScriptSql?: string;
    rollbackProcedure?: string;
  };
  clientResponse?: {
    issueSummaryClient?: string;
    causeExplainedClient?: string;
    actionTakenClient?: string;
    recommendations?: string;
    status?: string;
  };
  timeline?: Array<{
    eventType: string;
    description: string;
    createdAt: string;
    isInternalOnly: boolean;
  }>;
}

export interface DashboardMetrics {
  totalCases: number;
  openCases: number;
  analyzing: number;
  inDevelopment: number;
  critical: number;
  solved: number;
}

export interface DbConnectionItem {
  id: string;
  name: string;
  engine: string;
  host: string;
  port: number;
  instanceName?: string;
  databaseName: string;
  username?: string;
  environment: string;
  isReadOnly: boolean;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestStatus?: boolean;
  lastTestMessage?: string;
}

export interface ClientItem {
  id: string;
  code: string;
  businessName: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  dbConnections?: DbConnectionItem[];
}

@Injectable({
  providedIn: 'root',
})
export class CaseDeskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3001/api';

  // Usuario autenticado actual
  readonly currentUser = signal<UserProfile | null>(this.getStoredUser());
  private authToken: string | null = this.getStoredToken();

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('casedesk_token');
    } catch {
      return null;
    }
  }

  private getStoredUser(): UserProfile | null {
    try {
      const data = localStorage.getItem('casedesk_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.authToken) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    return headers;
  }

  async login(username: string, password: string): Promise<UserProfile> {
    const res = await firstValueFrom(
      this.http.post<{ accessToken: string; user: UserProfile }>(
        `${this.baseUrl}/auth/login`,
        { username, password },
      ),
    );

    this.authToken = res.accessToken;
    this.currentUser.set(res.user);

    try {
      localStorage.setItem('casedesk_token', res.accessToken);
      localStorage.setItem('casedesk_user', JSON.stringify(res.user));
    } catch (e) {
      console.warn('LocalStorage no disponible:', e);
    }

    return res.user;
  }

  logout() {
    this.authToken = null;
    this.currentUser.set(null);
    try {
      localStorage.removeItem('casedesk_token');
      localStorage.removeItem('casedesk_user');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // --- Usuarios (CRUD) ---
  async getUsers(): Promise<UserProfile[]> {
    return firstValueFrom(
      this.http.get<UserProfile[]>(`${this.baseUrl}/users`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async createUser(payload: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleIds?: number[];
    authorizedClientIds?: string[];
  }): Promise<UserProfile> {
    return firstValueFrom(
      this.http.post<UserProfile>(`${this.baseUrl}/users`, payload, {
        headers: this.getHeaders(),
      }),
    );
  }

  async toggleUserActive(userId: string): Promise<UserProfile> {
    return firstValueFrom(
      this.http.patch<UserProfile>(
        `${this.baseUrl}/users/${userId}/toggle-active`,
        {},
        { headers: this.getHeaders() },
      ),
    );
  }

  // --- Roles y Permisos (CRUD) ---
  async getRoles(): Promise<RoleItem[]> {
    return firstValueFrom(
      this.http.get<RoleItem[]>(`${this.baseUrl}/roles`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async createRole(payload: {
    name: string;
    description: string;
    permissionIds?: string[];
  }): Promise<RoleItem> {
    return firstValueFrom(
      this.http.post<RoleItem>(`${this.baseUrl}/roles`, payload, {
        headers: this.getHeaders(),
      }),
    );
  }

  async getPermissions(): Promise<PermissionItem[]> {
    return firstValueFrom(
      this.http.get<PermissionItem[]>(`${this.baseUrl}/roles/permissions`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async updateRolePermissions(
    roleId: number,
    permissionIds: string[],
  ): Promise<RoleItem> {
    return firstValueFrom(
      this.http.put<RoleItem>(
        `${this.baseUrl}/roles/${roleId}/permissions`,
        { permissionIds },
        { headers: this.getHeaders() },
      ),
    );
  }

  // --- Casos y Métricas ---
  async getMetrics(): Promise<DashboardMetrics> {
    return firstValueFrom(
      this.http.get<DashboardMetrics>(`${this.baseUrl}/cases/metrics/summary`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async getCases(search?: string): Promise<{ data: ApiCaseItem[]; total: number }> {
    let url = `${this.baseUrl}/cases?limit=50`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return firstValueFrom(
      this.http.get<{ data: ApiCaseItem[]; total: number }>(url, {
        headers: this.getHeaders(),
      }),
    );
  }

  async getCaseDetail(idOrCode: string): Promise<ApiCaseItem> {
    return firstValueFrom(
      this.http.get<ApiCaseItem>(
        `${this.baseUrl}/cases/${encodeURIComponent(idOrCode)}`,
        { headers: this.getHeaders() },
      ),
    );
  }

  async getClients(): Promise<ClientItem[]> {
    return firstValueFrom(
      this.http.get<ClientItem[]>(`${this.baseUrl}/clients`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async createClient(payload: {
    code: string;
    businessName: string;
    taxId?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }): Promise<ClientItem> {
    return firstValueFrom(
      this.http.post<ClientItem>(`${this.baseUrl}/clients`, payload, {
        headers: this.getHeaders(),
      }),
    );
  }

  async toggleClientActive(clientId: string): Promise<ClientItem> {
    return firstValueFrom(
      this.http.patch<ClientItem>(
        `${this.baseUrl}/clients/${clientId}/toggle-active`,
        {},
        { headers: this.getHeaders() },
      ),
    );
  }

  async createConnection(
    clientId: string,
    payload: {
      name: string;
      engine: string;
      host: string;
      port: number;
      instanceName?: string;
      databaseName: string;
      username: string;
      password: string;
      environment: string;
      isReadOnly: boolean;
    },
  ): Promise<DbConnectionItem> {
    return firstValueFrom(
      this.http.post<DbConnectionItem>(
        `${this.baseUrl}/clients/${clientId}/connections`,
        payload,
        { headers: this.getHeaders() },
      ),
    );
  }

  async updateConnection(
    connectionId: string,
    payload: {
      name?: string;
      engine?: string;
      host?: string;
      port?: number;
      instanceName?: string;
      databaseName?: string;
      username?: string;
      password?: string;
      environment?: string;
      isReadOnly?: boolean;
      isActive?: boolean;
    },
  ): Promise<DbConnectionItem> {
    return firstValueFrom(
      this.http.patch<DbConnectionItem>(
        `${this.baseUrl}/connections/${connectionId}`,
        payload,
        { headers: this.getHeaders() },
      ),
    );
  }

  async createCase(payload: {
    title: string;
    descriptionRaw: string;
    affectedSystem: string;
    affectedModule?: string;
    clientId: string;
    priority?: string;
  }): Promise<ApiCaseItem> {
    return firstValueFrom(
      this.http.post<ApiCaseItem>(`${this.baseUrl}/cases`, payload, {
        headers: this.getHeaders(),
      }),
    );
  }

  async updateCaseStatus(
    id: string,
    status: string,
    comment?: string,
  ): Promise<ApiCaseItem> {
    return firstValueFrom(
      this.http.patch<ApiCaseItem>(
        `${this.baseUrl}/cases/${id}/status`,
        { status, comment },
        { headers: this.getHeaders() },
      ),
    );
  }

  async testConnection(connectionId: string): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    engine: string;
    server: string;
    database: string;
  }> {
    return firstValueFrom(
      this.http.post<any>(
        `${this.baseUrl}/connections/${connectionId}/test`,
        {},
        { headers: this.getHeaders() },
      ),
    );
  }
}
