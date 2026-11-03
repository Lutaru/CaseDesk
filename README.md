# CaseDesk: Plataforma Centralizada de Gestión y Automatización de Casos Técnicos

> Sistema unificado de gestión de casos técnicos, análisis de causas raíz, diagnósticos de bases de datos y redacción de soluciones para incidentes de software empresarial (Contabilidad, Inventario, Facturación Electrónica, Seguridad).

---

## 1. Arquitectura y Stack Tecnológico

* **Backend:** **NestJS 11** (TypeScript, TypeORM, Passport-JWT, Swagger OpenAPI, Class-Validator, AES-256-GCM).
* **Base de Datos Plataforma:** **PostgreSQL 18** (Base de datos propia: `casedesk_db`).
* **Frontend:** **Angular 20 Standalone** (TypeScript, Angular Signals Store, Tailwind CSS, Lucide Icons).
* **Seguridad:** Cifrado simétrico AES-256-GCM para almacenamiento seguro de credenciales de bases de datos remotas.

---

## 2. Documentación y Estado del Proyecto

Para conocer en detalle la implementación actual y las siguientes fases de desarrollo, consulta los documentos de la carpeta `/docs`:

* [📄 **Contexto y Estado Actual de Implementación**](./docs/CONTEXTO_Y_ESTADO_ACTUAL.md): Detalle exhaustivo de la arquitectura, módulos implementados (Auth, RBAC, Clientes, Conexiones, Casos, Análisis Técnico, Soluciones, Respuestas al Cliente, Workspace multicaso en Angular) y casos reales precargados.
* [🗺️ **Roadmap y Tareas Pendientes**](./docs/ROADMAP_Y_PENDIENTES.md): Hoja de ruta para la automatización total de casos (ingestión automática de `D:\casosBack`, OCR de evidencias, autodiagnóstico asistido por IA, ejecución de consultas en sandbox y redactor de respuestas).

---

## 3. Estructura del Repositorio

```
D:\CaseDesk\
├── backend/                       # API REST modular con NestJS y TypeORM
│   ├── src/
│   │   ├── common/enums/          # Enums de estados, prioridades, motores BD
│   │   ├── database/seeds/        # Seed inicial de roles, permisos, admin y casos reales
│   │   ├── modules/
│   │   │   ├── cases/             # Entidades y lógica de Casos
│   │   │   ├── clients/           # Directorio de Clientes
│   │   │   ├── connections/       # Conexiones a BDs remotas cifradas (AES-256-GCM)
│   │   │   ├── technical-analysis/# Análisis técnico privado (causa raíz, queries SQL)
│   │   │   ├── solutions/         # Solución técnica y scripts de reversión (rollback)
│   │   │   ├── client-responses/  # Redactor de respuestas públicas para clientes
│   │   │   ├── attachments/       # Evidencias y archivos adjuntos
│   │   │   ├── timeline/          # Auditoría y línea de tiempo de eventos
│   │   │   ├── users/             # Gestión de usuarios y credenciales
│   │   │   └── roles/             # RBAC dinámico con permisos atómicos
│   │   ├── app.module.ts          # Configuración global y conexión PostgreSQL
│   │   └── main.ts                # Inicialización, Swagger y CORS
│   └── .env.example               # Plantilla de variables de entorno
│
├── frontend/                      # SPA en Angular 20 Standalone
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout/            # ShellComponent con workspace multicaso
│   │   │   ├── stores/            # WorkspaceTabsStore (Angular Signals)
│   │   │   ├── app.config.ts      # Proveedores globales (Router, HttpClient)
│   │   │   └── app.ts             # Componente raíz
│   │   └── styles.scss            # Estilos globales y Tailwind CSS
│
└── docs/                          # Documentación arquitectónica y hoja de ruta
    ├── CONTEXTO_Y_ESTADO_ACTUAL.md
    └── ROADMAP_Y_PENDIENTES.md
```

---

## 4. Instrucciones de Ejecución Local

### 4.1. Base de Datos (PostgreSQL)
Asegurarse de tener PostgreSQL en ejecución y crear la base de datos:
```sql
CREATE DATABASE casedesk_db;
```

### 4.2. Iniciar el Backend (NestJS)
```powershell
cd backend
cp .env.example .env
npm install
npm run start:dev
```
* **API Base:** `http://localhost:3001/api`
* **Swagger OpenAPI Docs:** `http://localhost:3001/api/docs`

### 4.3. Iniciar el Frontend (Angular)
```powershell
cd frontend
npm install
npm run start
```
* **Aplicación Web:** `http://localhost:4200`

---

## 5. Credenciales Iniciales de Acceso

* **Administrador:** `admin` / `admin123` (Acceso completo)
* **Desarrollador:** `juandev` / `dev123` (Casos, análisis técnico, scripts)
* **Soporte Técnico:** `laurasoporte` / `soporte123` (Triaje, creación y comunicación con clientes)
