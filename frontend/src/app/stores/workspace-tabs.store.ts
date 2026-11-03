import { Injectable, signal, computed } from '@angular/core';

export interface CaseDetail {
  code: string;
  title: string;
  client: string;
  system: string;
  module: string;
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  priorityColor: string;
  status: string;
  statusColor: string;
  createdDate: string;
  dbConnection: {
    engine: string;
    server: string;
    database: string;
    env: string;
    latency: number;
  };
  attachments: Array<{
    name: string;
    size: string;
    uploader: string;
    icon: string;
  }>;
  analysis: {
    rootCause: string;
    procedures: string;
    tables: string;
    sqlQuery: string;
  };
  solution: {
    summary: string;
    sqlScript: string;
    rollback: string;
  };
  clientResponse: {
    summary: string;
    cause: string;
    actions: string;
  };
  timeline: Array<{
    title: string;
    time: string;
    color: string;
  }>;
}

export interface WorkspaceTab {
  id: string; // 'dashboard', 'case-00226', 'case-00130', etc.
  title: string;
  subtitle?: string;
  type: 'dashboard' | 'case';
  caseData?: CaseDetail;
}

// Catálogo de Casos con datos ricos y reales
const CASES_CATALOG: Record<string, CaseDetail> = {
  'case-00226': {
    code: 'CASO-00226',
    title: 'Descuadre entre Reporte FT003 (Circular 016 CXC) y Libro Anexo de Balance CXC',
    client: 'Fiduciaria La Previsora / Mutual Ser EPS',
    system: 'Contabilidad',
    module: 'Circular 016',
    priority: 'ALTA',
    priorityColor: 'bg-red-100 text-red-700',
    status: 'ANALIZANDO',
    statusColor: 'bg-amber-100 text-amber-900 border-amber-300',
    createdDate: '28/10/2026',
    dbConnection: {
      engine: 'Microsoft SQL Server (1433)',
      server: '10.120.1.4\\SISMA',
      database: 'SismaContabilidad',
      env: 'Producción',
      latency: 14,
    },
    attachments: [
      { name: 'DIFERENCIAS FT003 Y ANEXO.xlsx', size: '1.2 MB', uploader: 'Laura Soporte', icon: '📊' },
      { name: 'Sp_Rpt_Cricular016.sql', size: '24.3 KB', uploader: 'Juan Dev', icon: '📄' },
    ],
    analysis: {
      rootCause: `Se detectaron dos causas estructurales de descuadre:
1. En FT003 se exige 'WHERE pc.atributos = 2' (Clientes), mientras el Anexo suma todas las subcuentas de la 13 (ej. 1310, 1315, 1380 o 1305 mal parametrizadas).
2. En saldo_facturas se exige 'WHERE numero_factura IS NOT NULL AND numero_factura <> ""'. Comprobantes manuales o notas sin factura no entran a FT003.`,
      procedures: 'Sp_Rpt_Cricular016, saldo_facturas, saldo_general_fecha',
      tables: 'causacion, plan_de_cuenta, Terceros, saldo_facturas_acumulado',
      sqlQuery: `-- PASO 1: Cuentas de la 13 sin atributo de Cliente (atributos <> 2)
SELECT pc.cuenta, pc.descripcion, pc.atributos, SUM(c.transaccion) AS saldo_neto
FROM causacion c
INNER JOIN plan_de_cuenta pc ON pc.cuenta = c.cuenta
WHERE c.cuenta LIKE '13%' AND ISNULL(pc.atributos, 0) <> 2
GROUP BY pc.cuenta, pc.descripcion, pc.atributos
HAVING SUM(c.transaccion) <> 0;`,
    },
    solution: {
      summary: 'Se concilian los terceros con atributo diferente a 2 y se parametrizan las subcuentas de cartera de clientes. Adicionalmente se crea script de reclasificación para facturas con número vacío.',
      sqlScript: `-- Actualización de cuentas sin atributo de cliente
UPDATE plan_de_cuenta 
SET atributos = 2 
WHERE cuenta = '13050501' AND atributos IS NULL;`,
      rollback: "RESTORE DATABASE SismaContabilidad FROM DISK = 'D:\\Backups\\pre_fix_00226.bak';",
    },
    clientResponse: {
      summary: 'Se evaluaron las diferencias entre el informe de Circular 016 (FT003) y el Libro Anexo de Balance a la misma fecha de corte.',
      cause: 'El informe FT003 solo considera cuentas parametrizadas como Cartera de Clientes y documentos con factura asignada, mientras que el Libro Anexo incluye la totalidad de las cuentas contables de la clase 13.',
      actions: 'Se recomienda verificar la parametrización de las subcuentas de clientes y asociar siempre el número de factura correspondiente en comprobantes manuales.',
    },
    timeline: [
      { title: 'Juan Dev cambió estado a "ANALIZANDO"', time: 'Hoy, 14:40', color: 'bg-blue-500' },
      { title: 'Laura Soporte creó el caso y adjuntó Excel', time: 'Hoy, 14:15', color: 'bg-emerald-500' },
    ],
  },

  'case-00130': {
    code: 'CASO-00130',
    title: 'Descuadre de -$3.287M en saldos iniciales 2025 por arrastre de anulados',
    client: 'SOMEDYT S.A.S.',
    system: 'Contabilidad',
    module: 'Cierre Anual',
    priority: 'CRITICA',
    priorityColor: 'bg-red-200 text-red-800',
    status: 'SOLUCIONADO',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    createdDate: '24/10/2026',
    dbConnection: {
      engine: 'Microsoft SQL Server (1433)',
      server: '10.120.1.4\\SISMA',
      database: 'SismaContabilidad',
      env: 'Producción',
      latency: 11,
    },
    attachments: [
      { name: 'comparativo_cierre_2024_2025.xlsx', size: '890 KB', uploader: 'Carlos Soporte', icon: '📊' },
      { name: 'solucion_cierre_anulado.sql', size: '12.4 KB', uploader: 'Juan Dev', icon: '📄' },
    ],
    analysis: {
      rootCause: `El procedimiento Sp_CierreAnio generó los saldos iniciales de 2025 (periodo '202500') leyendo de la vista 'saldo_general_fecha', en la cual el filtro de documentos anulados estaba comentado.
En consecuencia, se arrastraron 83.279 movimientos anulados del año 2024 a la apertura de 2025, generando una diferencia de -$3.287.397.822,07.`,
      procedures: 'Sp_CierreAnio, saldo_general_fecha_anulados',
      tables: 'saldo_general_acumulado, causacion, cierre_anual',
      sqlQuery: `-- Diagnóstico: Movimientos anulados arrastrados al cierre 202500
SELECT COUNT(*) AS total_anulados, SUM(transaccion) AS impacto_en_saldo
FROM causacion
WHERE YEAR(fecha) = 2024 AND (anulado = 1 OR id_consecutivo_rev IS NOT NULL);`,
    },
    solution: {
      summary: 'Se actualizó el SP Sp_CierreAnio para utilizar estrictamente saldo_general_fecha_anulados y se reprocesó el cierre anual de 2024. Los saldos quedaron 100% conciliados.',
      sqlScript: `-- Reemplazo de vista en Sp_CierreAnio
-- Cambiar saldo_general_fecha por saldo_general_fecha_anulados
EXEC dbo.Sp_CierreAnio @anio = 2024, @reprocesar = 1;`,
      rollback: '-- No requerido, el reproceso es idempotente y recalcula saldo_general_acumulado.',
    },
    clientResponse: {
      summary: 'Aclaración y solución sobre la diferencia de saldo entre el cierre 2024 y apertura 2025.',
      cause: 'Su balance de 2024 siempre ha sido exacto. La rutina de cierre arrastró registros anulados hacia la apertura 2025.',
      actions: 'Se corrigió la rutina de cierre contable y se recalculó la apertura de 2025. Los saldos quedan idénticos peso a peso ($0,00 de diferencia).',
    },
    timeline: [
      { title: 'Juan Dev marcó el caso como "SOLUCIONADO"', time: 'Ayer, 18:20', color: 'bg-emerald-500' },
      { title: 'Ejecutado script de recálculo de cierre 2024', time: 'Ayer, 17:50', color: 'bg-blue-500' },
      { title: 'Carlos Soporte creó el caso', time: '24/10/2026', color: 'bg-slate-400' },
    ],
  },

  'case-18253': {
    code: 'CASO-18253',
    title: 'Bloqueo al anular entrada de mercancía EM0000002475 por redondeo de centavos',
    client: 'Cliente Hospital Regional',
    system: 'Inventario',
    module: 'Entrada Mercancía',
    priority: 'MEDIA',
    priorityColor: 'bg-yellow-100 text-yellow-800',
    status: 'EN DESARROLLO',
    statusColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    createdDate: '26/10/2026',
    dbConnection: {
      engine: 'Microsoft SQL Server (1433)',
      server: '10.120.1.8\\ZEUS',
      database: 'ZeusSalud_Inventario',
      env: 'Producción',
      latency: 18,
    },
    attachments: [
      { name: 'captura_error_anulacion.png', size: '420 KB', uploader: 'Andres Soporte', icon: '🖼️' },
    ],
    analysis: {
      rootCause: `El SP valida estrictamente 'costo_total_actual < costo_total_entrada'.
Al dividir el valor total de la entrada entre las unidades recibidas, el costo unitario generó 3 decimales pero se almacenó con 2 decimales en dbo.costo.
Al recalcular el costo total, faltaron $0.02 pesos, disparando un falso positivo de bloqueo a pesar de que la mercancía está intacta en bodega.`,
      procedures: 'Sp_entrada_mercancia_expres',
      tables: 'entrada, entrada_detalle, costo, articulo',
      sqlQuery: `-- Comparar costo actual en bodega vs costo de entrada
SELECT c.costo_promedio_actual * e.existencia AS costo_bodega, ed.costo_total AS costo_entrada
FROM entrada_detalle ed
INNER JOIN costo c ON c.id_articulo = ed.id_articulo
WHERE ed.numero_documento = 'EM0000002475';`,
    },
    solution: {
      summary: 'Incorporar tolerancia de $1.00 peso en la validación de costos del SP cuando las existencias en bodega están completas.',
      sqlScript: `-- Ajuste en Sp_entrada_mercancia_expres:
-- IF (costo_total_entrada - costo_total_actual) > 1.0 AND existencias < cantidad_entrada
--    RAISERROR('No se puede anular...', 16, 1);`,
      rollback: '-- Restaurar la versión anterior de Sp_entrada_mercancia_expres',
    },
    clientResponse: {
      summary: 'Se identificó la causa del bloqueo al anular la entrada EM0000002475.',
      cause: 'Se debió a un desfase de 2 centavos generado por redondeo automático en el costo promedio.',
      actions: 'El equipo de desarrollo está ajustando la validación del procedimiento para permitir la anulación cuando las existencias físicas están completas.',
    },
    timeline: [
      { title: 'Juan Dev pasó a "EN DESARROLLO"', time: 'Hoy, 10:30', color: 'bg-indigo-500' },
      { title: 'Andres Soporte reportó el incidente', time: '26/10/2026', color: 'bg-slate-400' },
    ],
  },
};

@Injectable({
  providedIn: 'root',
})
export class WorkspaceTabsStore {
  // Lista de pestañas abiertas
  private tabsSignal = signal<WorkspaceTab[]>([
    {
      id: 'dashboard',
      title: 'Panel General',
      type: 'dashboard',
    },
    {
      id: 'case-00226',
      title: 'CASO-00226',
      subtitle: 'Mutual Ser - Descuadre FT003',
      type: 'case',
      caseData: CASES_CATALOG['case-00226'],
    },
    {
      id: 'case-00130',
      title: 'CASO-00130',
      subtitle: 'SOMEDYT - Cierre Anual',
      type: 'case',
      caseData: CASES_CATALOG['case-00130'],
    },
  ]);

  // ID de la pestaña actualmente visible
  private activeTabIdSignal = signal<string>('case-00226');

  // Computed signals
  readonly tabs = computed(() => this.tabsSignal());
  readonly activeTabId = computed(() => this.activeTabIdSignal());
  readonly activeTab = computed(() =>
    this.tabsSignal().find((t) => t.id === this.activeTabIdSignal()),
  );

  // Datos del caso activo actual (dinámico)
  readonly activeCase = computed<CaseDetail | null>(() => {
    const tabId = this.activeTabIdSignal();
    if (tabId === 'dashboard') return null;

    // Buscar en la pestaña o en el catálogo
    const tab = this.tabsSignal().find((t) => t.id === tabId);
    if (tab?.caseData) return tab.caseData;
    if (CASES_CATALOG[tabId]) return CASES_CATALOG[tabId];

    // Fallback genérico para cualquier caso nuevo
    return {
      code: tab?.title || tabId.toUpperCase(),
      title: tab?.subtitle || 'Caso Técnico en Gestión',
      client: 'Cliente Asociado',
      system: 'Contabilidad / Inventario',
      module: 'General',
      priority: 'MEDIA',
      priorityColor: 'bg-yellow-100 text-yellow-800',
      status: 'REGISTRADO',
      statusColor: 'bg-slate-100 text-slate-800 border-slate-300',
      createdDate: 'Hoy',
      dbConnection: {
        engine: 'Microsoft SQL Server (1433)',
        server: '10.120.1.4\\SISMA',
        database: 'BD_Cliente',
        env: 'Producción',
        latency: 15,
      },
      attachments: [],
      analysis: {
        rootCause: 'Pendiente de diagnóstico técnico inicial.',
        procedures: 'Sin procedimientos asignados aún.',
        tables: 'Sin tablas asignadas aún.',
        sqlQuery: '-- Ingrese consulta de diagnóstico',
      },
      solution: {
        summary: 'Pendiente de propuesta y desarrollo de solución.',
        sqlScript: '-- Script de solución',
        rollback: '-- Script de reversión',
      },
      clientResponse: {
        summary: 'El caso se encuentra en revisión por el equipo técnico.',
        cause: 'En diagnóstico.',
        actions: 'En proceso de atención.',
      },
      timeline: [
        { title: 'Caso abierto en plataforma', time: 'Reciente', color: 'bg-blue-500' },
      ],
    };
  });

  openTab(tabParams: { id: string; title: string; subtitle?: string; type: 'dashboard' | 'case' }) {
    const existing = this.tabsSignal().find((t) => t.id === tabParams.id);
    if (!existing) {
      const fullCaseData = CASES_CATALOG[tabParams.id];
      const newTab: WorkspaceTab = {
        ...tabParams,
        caseData: fullCaseData,
      };
      this.tabsSignal.update((current) => [...current, newTab]);
    }
    this.activeTabIdSignal.set(tabParams.id);
  }

  closeTab(tabId: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (tabId === 'dashboard') return;

    const currentTabs = this.tabsSignal();
    const index = currentTabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const newTabs = currentTabs.filter((t) => t.id !== tabId);
    this.tabsSignal.set(newTabs);

    // Si la pestaña cerrada era la activa, activar la anterior o dashboard
    if (this.activeTabIdSignal() === tabId) {
      const nextTab = newTabs[Math.max(0, index - 1)];
      this.activeTabIdSignal.set(nextTab ? nextTab.id : 'dashboard');
    }
  }

  setActiveTab(tabId: string) {
    this.activeTabIdSignal.set(tabId);
  }
}
