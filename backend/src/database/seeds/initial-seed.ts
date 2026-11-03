import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/roles/entities/permission.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Client } from '../../modules/clients/entities/client.entity';
import { ClientDbConnection } from '../../modules/connections/entities/client-db-connection.entity';
import { Case } from '../../modules/cases/entities/case.entity';
import { CaseTechnicalAnalysis } from '../../modules/technical-analysis/entities/case-technical-analysis.entity';
import { CaseSolution } from '../../modules/solutions/entities/case-solution.entity';
import { CaseClientResponse } from '../../modules/client-responses/entities/case-client-response.entity';
import { CaseTimeline } from '../../modules/timeline/entities/case-timeline.entity';
import {
  CasePriority,
  CaseStatus,
  CaseType,
  ClientResponseStatus,
  DatabaseEngine,
  EnvironmentType,
  SystemRole,
} from '../../common/enums';
import { encryptCredentials } from '../../common/utils/crypto.util';

export async function runInitialSeed(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🌱 Ejecutando seed integral para CaseDesk...');

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const clientRepo = dataSource.getRepository(Client);
  const connRepo = dataSource.getRepository(ClientDbConnection);
  const caseRepo = dataSource.getRepository(Case);
  const analysisRepo = dataSource.getRepository(CaseTechnicalAnalysis);
  const solutionRepo = dataSource.getRepository(CaseSolution);
  const responseRepo = dataSource.getRepository(CaseClientResponse);
  const timelineRepo = dataSource.getRepository(CaseTimeline);

  // 1. Permisos del sistema
  const permissionsData = [
    { id: 'cases:create', module: 'CASOS', description: 'Crear nuevos casos' },
    { id: 'cases:view_all', module: 'CASOS', description: 'Ver todos los casos del sistema' },
    { id: 'cases:view_assigned', module: 'CASOS', description: 'Ver casos asignados o propios' },
    { id: 'cases:edit_technical', module: 'CASOS', description: 'Editar análisis interno y scripts técnicos' },
    { id: 'cases:change_status_dev', module: 'CASOS', description: 'Avanzar estados de desarrollo y pruebas' },
    { id: 'cases:publish_response', module: 'CASOS', description: 'Aprobar y publicar respuesta al cliente' },
    { id: 'cases:close_cancel', module: 'CASOS', description: 'Cerrar o cancelar casos' },
    { id: 'clients:manage', module: 'CLIENTES', description: 'Crear y editar clientes' },
    { id: 'clients:view', module: 'CLIENTES', description: 'Consultar directorio de clientes' },
    { id: 'connections:manage', module: 'CONEXIONES', description: 'Registrar y modificar conexiones de BD' },
    { id: 'connections:test', module: 'CONEXIONES', description: 'Ejecutar pruebas de conexión a BDs de clientes' },
    { id: 'attachments:upload', module: 'ADJUNTOS', description: 'Subir evidencias y archivos adjuntos' },
    { id: 'attachments:view_internal', module: 'ADJUNTOS', description: 'Ver evidencias internas y scripts' },
    { id: 'users:manage', module: 'USUARIOS', description: 'Administrar usuarios, roles y permisos' },
    { id: 'audit:view', module: 'AUDITORIA', description: 'Consultar bitácora y timeline de eventos' },
  ];

  for (const p of permissionsData) {
    const exists = await permissionRepo.findOneBy({ id: p.id });
    if (!exists) {
      await permissionRepo.save(permissionRepo.create(p));
    }
  }

  const allPermissions = await permissionRepo.find();

  // 2. Roles del sistema
  let adminRole = await roleRepo.findOneBy({ name: SystemRole.ADMIN });
  if (!adminRole) {
    adminRole = roleRepo.create({
      name: SystemRole.ADMIN,
      description: 'Acceso total y configuración de la plataforma',
      isSystemRole: true,
      permissions: allPermissions,
    });
    await roleRepo.save(adminRole);
  }

  let devRole = await roleRepo.findOneBy({ name: SystemRole.DEVELOPER });
  if (!devRole) {
    devRole = roleRepo.create({
      name: SystemRole.DEVELOPER,
      description: 'Acceso a casos, análisis técnico interno, scripts y pruebas',
      isSystemRole: true,
      permissions: allPermissions.filter((p) =>
        [
          'cases:create',
          'cases:view_all',
          'cases:view_assigned',
          'cases:edit_technical',
          'cases:change_status_dev',
          'clients:view',
          'connections:test',
          'attachments:upload',
          'attachments:view_internal',
          'audit:view',
        ].includes(p.id),
      ),
    });
    await roleRepo.save(devRole);
  }

  let supportRole = await roleRepo.findOneBy({ name: SystemRole.SUPPORT });
  if (!supportRole) {
    supportRole = roleRepo.create({
      name: SystemRole.SUPPORT,
      description: 'Recepción, triaje, seguimiento y comunicación con clientes',
      isSystemRole: true,
      permissions: allPermissions.filter((p) =>
        [
          'cases:create',
          'cases:view_all',
          'cases:view_assigned',
          'cases:publish_response',
          'cases:close_cancel',
          'clients:view',
          'attachments:upload',
          'attachments:view_internal',
          'audit:view',
        ].includes(p.id),
      ),
    });
    await roleRepo.save(supportRole);
  }

  // 3. Usuarios base
  let adminUser = await userRepo.findOneBy({ username: 'admin' });
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    adminUser = userRepo.create({
      username: 'admin',
      email: 'admin@casedesk.local',
      firstName: 'Administrador',
      lastName: 'CaseDesk',
      passwordHash,
      isActive: true,
      roles: [adminRole],
    });
    await userRepo.save(adminUser);
  }

  let devUser = await userRepo.findOneBy({ username: 'juandev' });
  if (!devUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('dev123', salt);
    devUser = userRepo.create({
      username: 'juandev',
      email: 'juan.dev@casedesk.local',
      firstName: 'Juan',
      lastName: 'Desarrollador',
      passwordHash,
      isActive: true,
      roles: [devRole],
    });
    await userRepo.save(devUser);
  }

  let supportUser = await userRepo.findOneBy({ username: 'laurasoporte' });
  if (!supportUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('soporte123', salt);
    supportUser = userRepo.create({
      username: 'laurasoporte',
      email: 'laura.soporte@casedesk.local',
      firstName: 'Laura',
      lastName: 'Soporte',
      passwordHash,
      isActive: true,
      roles: [supportRole],
    });
    await userRepo.save(supportUser);
  }

  // 4. Clientes Reales
  let client1 = await clientRepo.findOneBy({ code: 'CLI-001' });
  if (!client1) {
    client1 = clientRepo.create({
      code: 'CLI-001',
      businessName: 'Fiduciaria La Previsora / Mutual Ser EPS',
      taxId: '806008394-1',
      contactName: 'Ing. Mauricio Gómez',
      contactEmail: 'mgomez@mutualser.org',
      contactPhone: '+57 310 445 9901',
      notes: 'Cliente de alta criticidad en reportes regulatorios SuperSalud.',
      isActive: true,
    });
    await clientRepo.save(client1);
  }

  let client2 = await clientRepo.findOneBy({ code: 'CLI-002' });
  if (!client2) {
    client2 = clientRepo.create({
      code: 'CLI-002',
      businessName: 'SOMEDYT S.A.S.',
      taxId: '806016797-1',
      contactName: 'Carlos Martínez',
      contactEmail: 'cmartinez@somedyt.com',
      contactPhone: '+57 300 123 4567',
      notes: 'IPS con operaciones clínicas continuas 24/7.',
      isActive: true,
    });
    await clientRepo.save(client2);
  }

  let client3 = await clientRepo.findOneBy({ code: 'CLI-003' });
  if (!client3) {
    client3 = clientRepo.create({
      code: 'CLI-003',
      businessName: 'Cliente Hospital Regional',
      taxId: '890480110-4',
      contactName: 'Dra. Patricia Ortiz',
      contactEmail: 'portiz@hospitalregional.gov.co',
      contactPhone: '+57 315 889 0012',
      notes: 'Hospital público de nivel 3.',
      isActive: true,
    });
    await clientRepo.save(client3);
  }

  // 5. Conexiones a BD con Cifrado AES-256-GCM
  const existingConn1 = await connRepo.findOneBy({ name: 'SQL Server Mutual Ser (1433)' });
  if (!existingConn1) {
    const enc1 = encryptCredentials('ReadOnlyPass_2026!');
    const [iv1, tag1, cipher1] = enc1.split(':');
    const conn1 = connRepo.create({
      name: 'SQL Server Mutual Ser (1433)',
      engine: DatabaseEngine.MSSQL,
      host: '10.120.1.4',
      port: 1433,
      instanceName: 'SISMA',
      databaseName: 'SismaContabilidad',
      username: 'usr_casedesk_ro',
      encryptedPasswordHex: cipher1,
      encryptionIvHex: iv1,
      encryptionAuthTagHex: tag1,
      environment: EnvironmentType.PRODUCCION,
      isReadOnly: true,
      lastTestedAt: new Date(),
      lastTestStatus: true,
      lastTestMessage: 'Conexión verificada exitosamente en modo Solo Lectura.',
      clientId: client1.id,
      client: client1,
    });
    await connRepo.save(conn1);
  }

  const existingConn2 = await connRepo.findOneBy({ name: 'SQL Server SOMEDYT (1433)' });
  if (!existingConn2) {
    const enc2 = encryptCredentials('ReadOnlySomedyt_2026!');
    const [iv2, tag2, cipher2] = enc2.split(':');
    const conn2 = connRepo.create({
      name: 'SQL Server SOMEDYT (1433)',
      engine: DatabaseEngine.MSSQL,
      host: '10.120.1.4',
      port: 1433,
      instanceName: 'SISMA',
      databaseName: 'SismaContabilidad',
      username: 'usr_somedyt_ro',
      encryptedPasswordHex: cipher2,
      encryptionIvHex: iv2,
      encryptionAuthTagHex: tag2,
      environment: EnvironmentType.PRODUCCION,
      isReadOnly: true,
      lastTestedAt: new Date(),
      lastTestStatus: true,
      lastTestMessage: 'Conexión verificada exitosamente en modo Solo Lectura.',
      clientId: client2.id,
      client: client2,
    });
    await connRepo.save(conn2);
  }

  // 6. Casos Técnicos y Diagnósticos
  // CASO-00226
  let case226 = await caseRepo.findOneBy({ code: 'CASO-00226' });
  if (!case226) {
    case226 = caseRepo.create({
      code: 'CASO-00226',
      title: 'Descuadre entre Reporte FT003 (Circular 016 CXC) y Libro Anexo de Balance CXC',
      descriptionRaw:
        'Se detectó un descuadre de -$198M entre el informe de Circular 016 (FT003) y el Libro Anexo de Balance de Cartera. Se requiere conciliar las subcuentas y el origen de los saldos.',
      affectedSystem: 'Contabilidad',
      affectedModule: 'Circular 016',
      caseType: CaseType.ERROR,
      priority: CasePriority.ALTA,
      status: CaseStatus.ANALIZANDO,
      clientId: client1.id,
      client: client1,
      createdById: supportUser.id,
      assignedToId: devUser.id,
    });
    await caseRepo.save(case226);

    const an226 = analysisRepo.create({
      caseId: case226.id,
      version: 1,
      rootCauseSummary: `Se detectaron dos causas estructurales de descuadre:
1. En FT003 se exige 'WHERE pc.atributos = 2' (Clientes), mientras el Anexo suma todas las subcuentas de la 13 (ej. 1310, 1315, 1380 o 1305 mal parametrizadas).
2. En saldo_facturas se exige 'WHERE numero_factura IS NOT NULL AND numero_factura <> ""'. Comprobantes manuales o notas sin factura no entran a FT003.`,
      reproductionSteps: 'Generar FT003 a corte 31/12/2025 y comparar contra Libro Anexo Cuenta 13.',
      affectedObjects: {
        tables: ['causacion', 'plan_de_cuenta', 'Terceros', 'saldo_facturas_acumulado'],
        storedProcedures: ['Sp_Rpt_Cricular016', 'saldo_facturas', 'saldo_general_fecha'],
      },
      diagnosticQueriesSql: `-- PASO 1: Cuentas de la 13 sin atributo de Cliente (atributos <> 2)
SELECT pc.cuenta, pc.descripcion, pc.atributos, SUM(c.transaccion) AS saldo_neto
FROM causacion c
INNER JOIN plan_de_cuenta pc ON pc.cuenta = c.cuenta
WHERE c.cuenta LIKE '13%' AND ISNULL(pc.atributos, 0) <> 2
GROUP BY pc.cuenta, pc.descripcion, pc.atributos
HAVING SUM(c.transaccion) <> 0;`,
      hypothesesAndFindings: 'Cuentas 13050501 creadas sin atributo de cliente.',
      risksAndDependencies: 'La reclasificación debe hacerse fuera de horario laboral de facturación.',
      lastModifiedById: devUser.id,
    });
    await analysisRepo.save(an226);

    const sol226 = solutionRepo.create({
      caseId: case226.id,
      solutionSummary:
        'Se concilian los terceros con atributo diferente a 2 y se parametrizan las subcuentas de cartera de clientes. Adicionalmente se crea script de reclasificación para facturas con número vacío.',
      solutionScriptSql: `-- Actualización de cuentas sin atributo de cliente
UPDATE plan_de_cuenta 
SET atributos = 2 
WHERE cuenta = '13050501' AND atributos IS NULL;`,
      rollbackProcedure: "RESTORE DATABASE SismaContabilidad FROM DISK = 'D:\\Backups\\pre_fix_00226.bak';",
      validationEnvironment: 'PRODUCCION',
      testedById: devUser.id,
    });
    await solutionRepo.save(sol226);

    const resp226 = responseRepo.create({
      caseId: case226.id,
      issueSummaryClient:
        'Se evaluaron las diferencias entre el informe de Circular 016 (FT003) y el Libro Anexo de Balance a la misma fecha de corte.',
      causeExplainedClient:
        'El informe FT003 solo considera cuentas parametrizadas como Cartera de Clientes y documentos con factura asignada, mientras que el Libro Anexo incluye la totalidad de las cuentas contables de la clase 13.',
      actionTakenClient:
        'Se recomienda verificar la parametrización de las subcuentas de clientes y asociar siempre el número de factura correspondiente en comprobantes manuales.',
      status: ClientResponseStatus.BORRADOR,
    });
    await responseRepo.save(resp226);

    const tl226 = timelineRepo.create({
      caseId: case226.id,
      eventType: 'ESTADO_CAMBIADO',
      fromValue: CaseStatus.REGISTRADO,
      toValue: CaseStatus.ANALIZANDO,
      description: 'Juan Dev inició el análisis técnico del procedimiento Sp_Rpt_Cricular016.',
      performedById: devUser.id,
      isInternalOnly: false,
    });
    await timelineRepo.save(tl226);
  }

  // CASO-00130
  let case130 = await caseRepo.findOneBy({ code: 'CASO-00130' });
  if (!case130) {
    case130 = caseRepo.create({
      code: 'CASO-00130',
      title: 'Descuadre de -$3.287M en saldos iniciales 2025 por arrastre de anulados',
      descriptionRaw:
        'La rutina de cierre anual 2024 generó saldos iniciales 2025 arrastrando transacciones anuladas, produciendo una diferencia masiva.',
      affectedSystem: 'Contabilidad',
      affectedModule: 'Cierre Anual',
      caseType: CaseType.ERROR,
      priority: CasePriority.CRITICA,
      status: CaseStatus.SOLUCIONADO,
      clientId: client2.id,
      client: client2,
      createdById: supportUser.id,
      assignedToId: devUser.id,
    });
    await caseRepo.save(case130);

    const an130 = analysisRepo.create({
      caseId: case130.id,
      version: 1,
      rootCauseSummary:
        'El procedimiento Sp_CierreAnio leyó de la vista saldo_general_fecha con filtro de anulados comentado, arrastrando 83.279 movimientos anulados.',
      reproductionSteps: 'Comparar saldo final 31/12/2024 contra apertura 202500.',
      diagnosticQueriesSql: `SELECT COUNT(*) AS total_anulados, SUM(transaccion) AS impacto_en_saldo
FROM causacion
WHERE YEAR(fecha) = 2024 AND (anulado = 1 OR id_consecutivo_rev IS NOT NULL);`,
      lastModifiedById: devUser.id,
    });
    await analysisRepo.save(an130);

    const sol130 = solutionRepo.create({
      caseId: case130.id,
      solutionSummary:
        'Se actualizó Sp_CierreAnio para utilizar estrictamente saldo_general_fecha_anulados y se reprocesó el cierre 2024. Saldo 100% cuadrado.',
      solutionScriptSql: 'EXEC dbo.Sp_CierreAnio @anio = 2024, @reprocesar = 1;',
      rollbackProcedure: '-- No requerido, reproceso idempotente.',
      validationEnvironment: 'PRODUCCION',
      testedById: devUser.id,
    });
    await solutionRepo.save(sol130);

    const resp130 = responseRepo.create({
      caseId: case130.id,
      issueSummaryClient:
        'Aclaración y solución sobre la diferencia de saldo entre el cierre 2024 y apertura 2025.',
      causeExplainedClient:
        'Su balance de 2024 siempre ha sido exacto. La rutina de cierre arrastró registros anulados hacia la apertura 2025.',
      actionTakenClient:
        'Se corrigió la rutina de cierre contable y se recalculó la apertura de 2025. Los saldos quedan idénticos peso a peso ($0,00 de diferencia).',
      status: ClientResponseStatus.PUBLICADO,
      publishedById: devUser.id,
      publishedAt: new Date(),
    });
    await responseRepo.save(resp130);
  }

  console.log('✨ Seed integral completado con éxito.');
}
