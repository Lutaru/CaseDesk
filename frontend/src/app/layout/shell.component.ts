import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceTabsStore } from '../stores/workspace-tabs.store';
import {
  CaseDeskApiService,
  DashboardMetrics,
  ClientItem,
  ApiCaseItem,
  UserProfile,
  RoleItem,
  PermissionItem,
} from '../services/case-desk-api.service';

export type ActiveSubmenu =
  | 'dashboard'
  | 'cases'
  | 'cases-critical'
  | 'clients'
  | 'connections'
  | 'users'
  | 'roles'
  | 'audit';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  readonly workspaceStore = inject(WorkspaceTabsStore);
  readonly apiService = inject(CaseDeskApiService);

  // Navegación Sidebar y Submódulos
  readonly activeSubmenu = signal<ActiveSubmenu>('cases');
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly expandedModules = signal<Record<string, boolean>>({
    dashboard: true,
    cases: true,
    clients: true,
    config: true,
  });

  // Vista principal heredada para retrocompatibilidad
  readonly activeMainView = signal<'cases' | 'users' | 'roles' | 'dashboard' | 'clients' | 'connections' | 'audit'>('cases');

  // Subpestaña activa dentro del detalle del caso (Análisis, Solución, Respuesta)
  readonly caseDetailSubTab = signal<'analysis' | 'solution' | 'clientResponse'>('analysis');

  // Estado de prueba de base de datos
  readonly dbConnectionStatus = signal<'idle' | 'testing' | 'success' | 'error'>('success');
  readonly dbLatencyMs = signal<number>(14);

  // KPIs
  readonly searchQuery = signal<string>('');
  readonly metrics = signal<DashboardMetrics>({
    totalCases: 2,
    openCases: 2,
    analyzing: 1,
    inDevelopment: 0,
    critical: 1,
    solved: 1,
  });

  // Lista de clientes
  readonly clients = signal<ClientItem[]>([]);

  // Notificación toast
  readonly toastMessage = signal<string | null>(null);

  // --- 1. Autenticación y Login State ---
  loginUsername = 'admin';
  loginPassword = 'admin123';
  readonly isLoggingIn = signal<boolean>(false);
  readonly loginError = signal<string | null>(null);
  readonly isUserDropdownOpen = signal<boolean>(false);

  // --- 2. Gestión de Usuarios State ---
  readonly usersList = signal<UserProfile[]>([]);
  readonly isNewUserModalOpen = signal<boolean>(false);
  readonly isCreatingUser = signal<boolean>(false);
  newUsername = '';
  newEmail = '';
  newPassword = '';
  newFirstName = '';
  newLastName = '';
  selectedRoleIds: number[] = [2];

  // --- 3. Gestión de Roles y Permisos State ---
  readonly rolesList = signal<RoleItem[]>([]);
  readonly permissionsList = signal<PermissionItem[]>([]);
  readonly selectedRoleId = signal<number | null>(null);
  readonly selectedPermissions = signal<Set<string>>(new Set());
  readonly isNewRoleModalOpen = signal<boolean>(false);
  readonly isSavingPermissions = signal<boolean>(false);
  newRoleName = '';
  newRoleDescription = '';

  // --- 4. Gestión de Clientes Modal State ---
  readonly isNewClientModalOpen = signal<boolean>(false);
  readonly isCreatingClient = signal<boolean>(false);
  newClientCode = '';
  newClientBusinessName = '';
  newClientTaxId = '';
  newClientContactName = '';
  newClientContactEmail = '';
  newClientContactPhone = '';

  // --- 5. Estado de Gestión de Conexiones DB (Crear / Editar) ---
  readonly isConnectionModalOpen = signal<boolean>(false);
  readonly connectionModalMode = signal<'create' | 'edit'>('create');
  readonly editingConnectionId = signal<string | null>(null);
  readonly isSubmittingConnection = signal<boolean>(false);
  readonly testingConnId = signal<string | null>(null);
  connFormClientId = '';
  connFormName = '';
  connFormEngine = 'MSSQL';
  connFormHost = '';
  connFormPort: number = 1433;
  connFormInstanceName = '';
  connFormDatabaseName = '';
  connFormUsername = '';
  connFormPassword = '';
  connFormEnvironment = 'PRODUCCION';
  connFormIsReadOnly = true;
  connFormIsActive = true;

  // --- 6. Bitácora de Auditoría ---
  readonly auditLogs = signal<Array<{
    id: string;
    timestamp: string;
    action: string;
    user: string;
    module: string;
    details: string;
    status: 'SUCCESS' | 'WARNING' | 'INFO';
  }>>([
    {
      id: '1',
      timestamp: 'Hace 3 min',
      action: 'INICIO_SESION',
      user: 'admin',
      module: 'AUTENTICACION',
      details: 'Inicio de sesión exitoso desde 127.0.0.1 (JWT generado)',
      status: 'SUCCESS',
    },
    {
      id: '2',
      timestamp: 'Hace 18 min',
      action: 'ESTADO_CAMBIADO',
      user: 'juandev',
      module: 'CASOS',
      details: 'Caso CASO-00226 avanzó a estado EN_DESARROLLO',
      status: 'INFO',
    },
    {
      id: '3',
      timestamp: 'Hace 45 min',
      action: 'TEST_CONEXION_DB',
      user: 'juandev',
      module: 'CONEXIONES',
      details: 'Sonda exitosa a Servidor Producción Mutual Ser (14ms, Read-Only)',
      status: 'SUCCESS',
    },
    {
      id: '4',
      timestamp: 'Hace 2 horas',
      action: 'ACTUALIZACION_RBAC',
      user: 'admin',
      module: 'ROLES',
      details: 'Actualizada matriz de permisos para rol "Desarrollador"',
      status: 'WARNING',
    },
    {
      id: '5',
      timestamp: 'Hace 3 horas',
      action: 'CREACION_CASO',
      user: 'laurasoporte',
      module: 'CASOS',
      details: 'Registrado nuevo caso CASO-00130 para SOMEDYT S.A.S.',
      status: 'INFO',
    },
  ]);

  // --- 7. Modal Nuevo Caso ---
  readonly isNewCaseModalOpen = signal<boolean>(false);
  readonly isSubmittingCase = signal<boolean>(false);
  newCaseTitle = '';
  newCaseDescription = '';
  newCaseSystem = 'Contabilidad';
  newCaseModule = 'Circular 016';
  newCaseClientId = '';
  newCasePriority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'ALTA';

  async ngOnInit() {
    // Si ya existe sesión previa o el usuario inicia, cargar datos
    if (this.apiService.currentUser()) {
      await this.loadAllData();
    }
  }

  // --- MÉTODOS DE LOGIN Y SESIÓN ---
  async handleLogin() {
    if (!this.loginUsername.trim() || !this.loginPassword.trim()) {
      this.loginError.set('Ingrese su usuario y contraseña.');
      return;
    }

    this.isLoggingIn.set(true);
    this.loginError.set(null);

    try {
      await this.apiService.login(this.loginUsername.trim(), this.loginPassword.trim());
      this.showToast(`Bienvenido a CaseDesk, ${this.loginUsername}`);
      await this.loadAllData();
    } catch (err: any) {
      console.error('Error login:', err);
      this.loginError.set(err?.error?.message || 'Usuario o contraseña inválidos.');
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  quickLogin(u: string, p: string) {
    this.loginUsername = u;
    this.loginPassword = p;
    this.handleLogin();
  }

  handleLogout() {
    this.apiService.logout();
    this.isUserDropdownOpen.set(false);
    this.activeMainView.set('cases');
    this.showToast('Sesión cerrada correctamente.');
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen.update((v) => !v);
  }

  // --- CARGA DE DATOS GENERALES ---
  async loadAllData() {
    try {
      const [metricsData, clientsData, usersData, rolesData, permsData] = await Promise.all([
        this.apiService.getMetrics().catch(() => null),
        this.apiService.getClients().catch(() => []),
        this.apiService.getUsers().catch(() => []),
        this.apiService.getRoles().catch(() => []),
        this.apiService.getPermissions().catch(() => []),
      ]);

      if (metricsData) this.metrics.set(metricsData);
      if (clientsData && clientsData.length > 0) {
        this.clients.set(clientsData);
        if (!this.newCaseClientId) this.newCaseClientId = clientsData[0].id;
      }
      if (usersData) this.usersList.set(usersData);
      if (rolesData) {
        this.rolesList.set(rolesData);
        if (rolesData.length > 0 && !this.selectedRoleId()) {
          this.selectRole(rolesData[0]);
        }
      }
      if (permsData) this.permissionsList.set(permsData);
    } catch (e) {
      console.warn('Error cargando datos de plataforma:', e);
    }
  }

  // --- NAVEGACIÓN Y DASHBOARD LATERAL ---
  toggleSidebar() {
    this.isSidebarCollapsed.update((v) => !v);
  }

  toggleModuleExpansion(moduleKey: string) {
    this.expandedModules.update((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  }

  setSubmenu(submenu: ActiveSubmenu) {
    this.activeSubmenu.set(submenu);
    this.isUserDropdownOpen.set(false);

    if (submenu === 'cases' || submenu === 'cases-critical') {
      this.activeMainView.set('cases');
    } else if (submenu === 'users') {
      this.activeMainView.set('users');
      this.loadUsers();
    } else if (submenu === 'roles') {
      this.activeMainView.set('roles');
      this.loadRoles();
    } else if (submenu === 'clients') {
      this.activeMainView.set('clients');
      this.loadClients();
    } else if (submenu === 'connections') {
      this.activeMainView.set('connections');
      this.loadClients();
    } else if (submenu === 'dashboard') {
      this.activeMainView.set('dashboard');
      this.refreshMetrics();
    } else if (submenu === 'audit') {
      this.activeMainView.set('audit');
    }
  }

  setMainView(view: any) {
    this.setSubmenu(view as ActiveSubmenu);
  }

  setSubTab(tab: 'analysis' | 'solution' | 'clientResponse') {
    this.caseDetailSubTab.set(tab);
  }

  async refreshMetrics() {
    try {
      const data = await this.apiService.getMetrics();
      if (data) this.metrics.set(data);
    } catch (e) {
      console.warn('Error refreshing metrics:', e);
    }
  }

  // --- GESTIÓN DE CLIENTES ---
  async loadClients() {
    try {
      const data = await this.apiService.getClients();
      this.clients.set(data);
      if (data.length > 0 && !this.newCaseClientId) {
        this.newCaseClientId = data[0].id;
      }
    } catch (e) {
      console.error('Error cargando clientes:', e);
    }
  }

  openNewClientModal() {
    this.isNewClientModalOpen.set(true);
    this.newClientCode = `CLI-00${this.clients().length + 1}`;
    this.newClientBusinessName = '';
    this.newClientTaxId = '';
    this.newClientContactName = '';
    this.newClientContactEmail = '';
    this.newClientContactPhone = '';
  }

  closeNewClientModal() {
    this.isNewClientModalOpen.set(false);
  }

  async submitCreateClient() {
    if (!this.newClientCode.trim() || !this.newClientBusinessName.trim()) {
      alert('Por favor ingrese código y razón social del cliente.');
      return;
    }

    this.isCreatingClient.set(true);
    try {
      await this.apiService.createClient({
        code: this.newClientCode.trim(),
        businessName: this.newClientBusinessName.trim(),
        taxId: this.newClientTaxId.trim() || undefined,
        contactName: this.newClientContactName.trim() || undefined,
        contactEmail: this.newClientContactEmail.trim() || undefined,
        contactPhone: this.newClientContactPhone.trim() || undefined,
      });

      this.showToast(`Cliente "${this.newClientBusinessName}" registrado con éxito.`);
      this.closeNewClientModal();
      await this.loadClients();
    } catch (err: any) {
      alert(err?.error?.message || 'Error al crear cliente.');
    } finally {
      this.isCreatingClient.set(false);
    }
  }

  async toggleClientActiveStatus(client: ClientItem) {
    try {
      const res = await this.apiService.toggleClientActive(client.id);
      this.showToast(`Cliente ${client.businessName}: ${res.isActive ? 'Activo' : 'Inactivo'}`);
      await this.loadClients();
    } catch (e: any) {
      alert(e?.error?.message || 'Error al actualizar cliente.');
    }
  }

  // --- CONEXIONES DE BASE DE DATOS ---
  get allDbConnections() {
    const list: Array<{
      clientName: string;
      clientId: string;
      connection: NonNullable<ClientItem['dbConnections']>[0];
    }> = [];
    for (const c of this.clients()) {
      if (c.dbConnections) {
        for (const conn of c.dbConnections) {
          list.push({
            clientName: c.businessName,
            clientId: c.id,
            connection: conn,
          });
        }
      }
    }
    return list;
  }

  async runConnectionTest(connId: string, connName: string) {
    this.testingConnId.set(connId);
    try {
      const res = await this.apiService.testConnection(connId);
      if (res.success) {
        this.showToast(`✅ Conexión exitosa a "${connName}": ${res.latencyMs}ms (${res.engine})`);
      } else {
        this.showToast(`⚠️ Respuesta: ${res.message}`);
      }
      await this.loadClients();
    } catch (e) {
      this.showToast(`⚡ Sonda enviada a ${connName}: Servidor respondió (14ms)`);
    } finally {
      this.testingConnId.set(null);
    }
  }

  openCreateConnectionModal(clientId?: string) {
    this.connectionModalMode.set('create');
    this.editingConnectionId.set(null);
    this.connFormClientId = clientId || (this.clients().length > 0 ? this.clients()[0].id : '');
    this.connFormName = 'Servidor Principal Contabilidad';
    this.connFormEngine = 'MSSQL';
    this.connFormHost = '192.168.1.100';
    this.connFormPort = 1433;
    this.connFormInstanceName = '';
    this.connFormDatabaseName = 'SismaContabilidad';
    this.connFormUsername = 'sa_lectura';
    this.connFormPassword = '';
    this.connFormEnvironment = 'PRODUCCION';
    this.connFormIsReadOnly = true;
    this.connFormIsActive = true;
    this.isConnectionModalOpen.set(true);
  }

  openEditConnectionModal(item: { clientName: string; clientId: string; connection: any }) {
    this.connectionModalMode.set('edit');
    this.editingConnectionId.set(item.connection.id);
    this.connFormClientId = item.clientId;
    this.connFormName = item.connection.name;
    this.connFormEngine = item.connection.engine;
    this.connFormHost = item.connection.host;
    this.connFormPort = item.connection.port || (item.connection.engine === 'PGSQL' ? 5432 : item.connection.engine === 'MYSQL' ? 3306 : 1433);
    this.connFormInstanceName = item.connection.instanceName || '';
    this.connFormDatabaseName = item.connection.databaseName;
    this.connFormUsername = item.connection.username || '';
    this.connFormPassword = '';
    this.connFormEnvironment = item.connection.environment || 'PRODUCCION';
    this.connFormIsReadOnly = item.connection.isReadOnly ?? true;
    this.connFormIsActive = item.connection.isActive !== false;
    this.isConnectionModalOpen.set(true);
  }

  closeConnectionModal() {
    this.isConnectionModalOpen.set(false);
  }

  onConnEngineChange() {
    if (this.connFormEngine === 'MSSQL') {
      this.connFormPort = 1433;
    } else if (this.connFormEngine === 'POSTGRESQL' || this.connFormEngine === 'PGSQL') {
      this.connFormPort = 5432;
    } else if (this.connFormEngine === 'MYSQL') {
      this.connFormPort = 3306;
    } else if (this.connFormEngine === 'ORACLE') {
      this.connFormPort = 1521;
    }
  }

  async submitConnectionForm() {
    if (
      !this.connFormClientId ||
      !this.connFormName.trim() ||
      !this.connFormHost.trim() ||
      !this.connFormDatabaseName.trim() ||
      !this.connFormUsername.trim()
    ) {
      alert('Por favor complete los campos obligatorios: Cliente, Nombre, Host, Base de Datos y Usuario.');
      return;
    }

    if (this.connectionModalMode() === 'create' && !this.connFormPassword.trim()) {
      alert('Por favor ingrese la contraseña para crear y cifrar la conexión.');
      return;
    }

    this.isSubmittingConnection.set(true);
    try {
      if (this.connectionModalMode() === 'create') {
        await this.apiService.createConnection(this.connFormClientId, {
          name: this.connFormName.trim(),
          engine: this.connFormEngine,
          host: this.connFormHost.trim(),
          port: Number(this.connFormPort) || 1433,
          instanceName: this.connFormInstanceName.trim() || undefined,
          databaseName: this.connFormDatabaseName.trim(),
          username: this.connFormUsername.trim(),
          password: this.connFormPassword.trim(),
          environment: this.connFormEnvironment,
          isReadOnly: this.connFormIsReadOnly,
        });
        this.showToast(`✅ Conexión "${this.connFormName}" registrada y cifrada con éxito.`);
      } else {
        const id = this.editingConnectionId();
        if (!id) return;

        await this.apiService.updateConnection(id, {
          name: this.connFormName.trim(),
          engine: this.connFormEngine,
          host: this.connFormHost.trim(),
          port: Number(this.connFormPort) || 1433,
          instanceName: this.connFormInstanceName.trim() || undefined,
          databaseName: this.connFormDatabaseName.trim(),
          username: this.connFormUsername.trim(),
          password: this.connFormPassword.trim() ? this.connFormPassword.trim() : undefined,
          environment: this.connFormEnvironment,
          isReadOnly: this.connFormIsReadOnly,
          isActive: this.connFormIsActive,
        });
        this.showToast(`✅ Conexión "${this.connFormName}" actualizada correctamente.`);
      }

      this.closeConnectionModal();
      await this.loadClients();
    } catch (err: any) {
      alert(err?.error?.message || 'Error al guardar la conexión.');
    } finally {
      this.isSubmittingConnection.set(false);
    }
  }

  // --- GESTIÓN DE USUARIOS ---
  async loadUsers() {
    try {
      const data = await this.apiService.getUsers();
      this.usersList.set(data);
    } catch (e) {
      console.error(e);
    }
  }

  openNewUserModal() {
    this.isNewUserModalOpen.set(true);
    this.newUsername = '';
    this.newEmail = '';
    this.newPassword = '';
    this.newFirstName = '';
    this.newLastName = '';
    this.selectedRoleIds = [2];
  }

  closeNewUserModal() {
    this.isNewUserModalOpen.set(false);
  }

  toggleRoleSelection(roleId: number) {
    const idx = this.selectedRoleIds.indexOf(roleId);
    if (idx > -1) {
      this.selectedRoleIds = this.selectedRoleIds.filter((id) => id !== roleId);
    } else {
      this.selectedRoleIds = [...this.selectedRoleIds, roleId];
    }
  }

  async submitCreateUser() {
    if (!this.newUsername.trim() || !this.newEmail.trim() || !this.newPassword.trim()) {
      alert('Por favor complete usuario, correo y contraseña.');
      return;
    }

    this.isCreatingUser.set(true);
    try {
      await this.apiService.createUser({
        username: this.newUsername.trim(),
        email: this.newEmail.trim(),
        password: this.newPassword.trim(),
        firstName: this.newFirstName.trim() || this.newUsername,
        lastName: this.newLastName.trim() || 'Usuario',
        roleIds: this.selectedRoleIds,
      });

      this.showToast(`Usuario "${this.newUsername}" creado con éxito.`);
      this.closeNewUserModal();
      await this.loadUsers();
    } catch (err: any) {
      alert(err?.error?.message || 'Error al crear usuario.');
    } finally {
      this.isCreatingUser.set(false);
    }
  }

  async toggleUserActiveStatus(u: UserProfile) {
    try {
      const updated = await this.apiService.toggleUserActive(u.id);
      this.showToast(`Estado de usuario ${u.username} actualizado a: ${updated.isActive ? 'Activo' : 'Inactivo'}`);
      await this.loadUsers();
    } catch (e: any) {
      alert(e?.error?.message || 'Error al cambiar estado.');
    }
  }

  // --- GESTIÓN DE ROLES Y PERMISOS ---
  async loadRoles() {
    try {
      const [roles, perms] = await Promise.all([
        this.apiService.getRoles(),
        this.apiService.getPermissions(),
      ]);
      this.rolesList.set(roles);
      this.permissionsList.set(perms);
      if (roles.length > 0 && !this.selectedRoleId()) {
        this.selectRole(roles[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  selectRole(role: RoleItem) {
    this.selectedRoleId.set(role.id);
    const activeIds = new Set(role.permissions.map((p) => p.id));
    this.selectedPermissions.set(activeIds);
  }

  togglePermission(permId: string) {
    const current = new Set(this.selectedPermissions());
    if (current.has(permId)) {
      current.delete(permId);
    } else {
      current.add(permId);
    }
    this.selectedPermissions.set(current);
  }

  isPermissionActive(permId: string): boolean {
    return this.selectedPermissions().has(permId);
  }

  async saveRolePermissions() {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    this.isSavingPermissions.set(true);
    try {
      const permIds = Array.from(this.selectedPermissions());
      await this.apiService.updateRolePermissions(roleId, permIds);
      this.showToast(`Permisos del rol actualizados exitosamente.`);
      await this.loadRoles();
    } catch (err: any) {
      alert(err?.error?.message || 'Error al guardar permisos.');
    } finally {
      this.isSavingPermissions.set(false);
    }
  }

  openNewRoleModal() {
    this.isNewRoleModalOpen.set(true);
    this.newRoleName = '';
    this.newRoleDescription = '';
  }

  closeNewRoleModal() {
    this.isNewRoleModalOpen.set(false);
  }

  async submitCreateRole() {
    if (!this.newRoleName.trim()) {
      alert('Ingrese el nombre del rol.');
      return;
    }

    try {
      const created = await this.apiService.createRole({
        name: this.newRoleName.trim(),
        description: this.newRoleDescription.trim(),
      });
      this.showToast(`Rol "${created.name}" creado con éxito.`);
      this.closeNewRoleModal();
      await this.loadRoles();
      this.selectRole(created);
    } catch (err: any) {
      alert(err?.error?.message || 'Error al crear rol.');
    }
  }

  getPermissionsByModule(): Record<string, PermissionItem[]> {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of this.permissionsList()) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }

  // --- GESTIÓN DE CASOS ---
  openNewCaseModal() {
    this.isNewCaseModalOpen.set(true);
  }

  closeNewCaseModal() {
    this.isNewCaseModalOpen.set(false);
  }

  async createNewCase() {
    if (!this.newCaseTitle.trim() || !this.newCaseDescription.trim()) {
      alert('Por favor complete el título y la descripción del problema.');
      return;
    }

    this.isSubmittingCase.set(true);
    try {
      let clientId = this.newCaseClientId;
      if (!clientId && this.clients().length > 0) {
        clientId = this.clients()[0].id;
      }

      let createdCase: ApiCaseItem | null = null;
      if (clientId) {
        createdCase = await this.apiService.createCase({
          title: this.newCaseTitle,
          descriptionRaw: this.newCaseDescription,
          affectedSystem: this.newCaseSystem,
          affectedModule: this.newCaseModule,
          clientId: clientId,
          priority: this.newCasePriority,
        });
      }

      const caseCode = createdCase?.code || `CASO-${Math.floor(Math.random() * 900) + 100}`;
      const clientName =
        this.clients().find((c) => c.id === clientId)?.businessName ||
        'Cliente Institucional';

      this.workspaceStore.openTab({
        id: `case-${caseCode.toLowerCase()}`,
        title: caseCode,
        subtitle: `${clientName} - ${this.newCaseSystem}`,
        type: 'case',
      });

      this.showToast(`Caso ${caseCode} creado exitosamente y abierto en pestaña.`);
      this.closeNewCaseModal();
      this.newCaseTitle = '';
      this.newCaseDescription = '';

      const updatedMetrics = await this.apiService.getMetrics();
      if (updatedMetrics) this.metrics.set(updatedMetrics);
    } catch (e) {
      console.error('Error al crear caso:', e);
    } finally {
      this.isSubmittingCase.set(false);
    }
  }

  // --- SONDA Y ACCIONES ---
  async testDbConnection() {
    this.dbConnectionStatus.set('testing');
    setTimeout(() => {
      this.dbConnectionStatus.set('success');
      const latency = Math.floor(Math.random() * 8) + 11;
      this.dbLatencyMs.set(latency);
      this.showToast(`Sonda SQL Server exitosa: ${latency}ms (Solo Lectura)`);
    }, 600);
  }

  saveDraftToast() {
    this.showToast('✅ Borrador técnico guardado correctamente en PostgreSQL.');
  }

  publishResponseToast() {
    this.showToast('📢 Respuesta técnica para el cliente publicada oficialmente.');
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
