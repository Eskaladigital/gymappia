# 💪 PACGYM — App de Entrenamiento Personal a Distancia

**Next.js 14 · TypeScript · Supabase · OpenAI GPT-4o · PWA**

---

## 📋 Plan de desarrollo (Roadmap)

### 🔴 Crítico para producción
| # | Tarea | Estado |
|---|-------|--------|
| 1 | Middleware de autenticación (/admin y /mi-plan protegidos) | ✅ Hecho |
| 2 | Página de callback /auth/callback para Supabase | ✅ Hecho |
| 3 | Iconos PWA reales (192x192 y 512x512) | ✅ Hecho |

### 🟡 Diferenciadores
| # | Tarea | Estado |
|---|-------|--------|
| 4 | Botón "💬 Pregunta a tu coach" en /mi-plan → chat IA | ✅ Hecho |
| 5 | Vídeo YouTube embebido en cada ejercicio | ✅ Hecho |
| 6 | Modo entrenamiento en vivo (fullscreen + temporizador) | ✅ Hecho |
| 7 | Notificaciones push (recordatorio día de entrenar) | ✅ Hecho |
| 8 | Dashboard de progreso con gráficas | ✅ Hecho |
| 9 | Mensajería admin → cliente en sesiones | ✅ Hecho |
| 10 | Compartir logro en Instagram/WhatsApp | ✅ Hecho |

### 🟢 Quick wins de UX
| # | Tarea | Estado |
|---|-------|--------|
| 11 | Onboarding de bienvenida animado post-registro | ✅ Hecho |
| 12 | Sustitución inteligente de ejercicio ("🔄 No puedo hacer esto") | ✅ Hecho |
| 13 | Foto de progreso semanal (cliente sube, admin ve) | ✅ Hecho |
| 14 | Estimación calórica por sesión | ✅ Hecho |

---

## 🗺️ Flujo completo de la app

```
CLIENTE (sin login)
──────────────────────────────────────────────────────────────
1. /              → Landing PACGYM
2. /start         → Formulario público 6 pasos (sin login)
3.  └─ Fake AI loading → 8 mensajes de "pensamiento IA" (14s)
4.  └─ "¡Tu plan está listo!" → vista previa borrosa + CTA registro
                    (lead guardado en Supabase como status: pending)
5. /auth/register → Registro con email pre-rellenado
6. /auth/login    → Login

CLIENTE (registrado)
──────────────────────────────────────────────────────────────
7. /mi-plan       → Home del cliente:
                    · Si pending  → "Plan en revisión por el coach"
                    · Si activo   → Calendario semanal + gamificación

ADMIN (entrenador)
──────────────────────────────────────────────────────────────
8.  /admin                         → Lista clientes (pending / activos)
9.  /admin/packs                   → Gestión de packs de entrenamiento
10. /admin/clientes/[id]           → Ficha completa + plan + seguimiento
11. /admin/clientes/[id]/configurar → 🎛️ Configurador inteligente:
                                       · IA analiza perfil y propone config
                                       · Admin ajusta sliders de módulos
                                       · Admin elige pack o ajusta sesión
                                       · Admin genera plan con GPT-4o real
```

---

## 🚀 Instalación

```bash
cd "app calendario entrenamient"
npm install
npm run dev     # http://localhost:3000
```

---

## ⚙️ Configuración

### 1. Variables de entorno — `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=opcional  # Para vídeos embebidos en ejercicios (sin key: abre búsqueda en nueva pestaña)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=opcional  # Push: genera con npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=opcional
CRON_SECRET=opcional  # Para proteger /api/push-reminder (cron diario)
```

### 2. Base de datos Supabase

Abre el **SQL Editor** de tu proyecto Supabase y ejecuta en orden:

1. `supabase-schema.sql` — tablas principales
2. `supabase-schema-v3.sql` — coach_messages, progress_photos
3. `supabase-schema-push.sql` — push_subscriptions (para recordatorios)

**Storage:** En Supabase Dashboard → Storage, crea un bucket público `progress-photos` para las fotos de progreso.

**Push:** Genera claves VAPID con `npx web-push generate-vapid-keys` y configura un cron que llame a `POST /api/push-reminder` cada día (ej. Vercel Cron con `CRON_SECRET`).

Tablas que se crean:
- `clients` — perfiles y leads (status: pending / active)
- `training_plans` — planes generados con la config usada (JSONB)
- `training_packs` — packs personalizados creados por el admin
- `session_logs` — registro de sesiones completadas
- `user_stats` — gamificación: puntos, racha, logros
- `profiles` — roles de usuario (admin / client)

### 3. URLs de redirección (Supabase Auth)

En **Authentication → URL Configuration** añade:
- **Site URL**: `http://localhost:3000` (dev) / `https://tu-dominio.com` (prod)
- **Redirect URLs**: `http://localhost:3000/auth/callback` y `https://tu-dominio.com/auth/callback`

### 4. Crear el usuario admin

En Supabase Auth, crea el usuario manualmente y luego ejecuta:

```sql
INSERT INTO profiles (id, email, role)
VALUES ('uuid-del-usuario-admin', 'admin@pacgym.com', 'admin');
```

---

## 📱 Rutas de la aplicación

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing PACGYM |
| `/start` | Público | Formulario 6 pasos + fake AI loading |
| `/auth/register` | Público | Registro post-formulario (email pre-rellenado) |
| `/auth/login` | Público | Inicio de sesión |
| `/auth/callback` | Público | Callback de Supabase tras confirmar email |
| `/mi-plan` | 🔒 Cliente | Calendario semanal + gamificación + logros |
| `/mi-plan/chat` | 🔒 Cliente | Chat con coach IA |
| `/admin` | 🔒 Admin | Lista de todos los clientes (pending/activos) |
| `/admin/packs` | Admin | Biblioteca de packs de entrenamiento |
| `/admin/clientes/[id]` | Admin | Ficha + plan + seguimiento del cliente |
| `/admin/clientes/[id]/configurar` | Admin | 🎛️ Configurador inteligente |

---

## 🎛️ Configurador de entrenamiento

El sistema más sofisticado de la app. Accesible desde la ficha de cada cliente.

### Cómo funciona

```
1. Admin pulsa "Analizar perfil con IA"
      ↓
   GPT-4o analiza el perfil del cliente y devuelve:
   · Valores sugeridos para cada módulo (0-100)
   · Parámetros de sesión óptimos
   · Pack recomendado (si aplica)
   · Razonamiento en texto natural
   · Alertas por lesiones o condiciones especiales ⚠️

2. Admin revisa y ajusta manualmente:
   · Sliders de 8 módulos de entrenamiento
   · Botón 🔒 para "congelar" módulos que la IA no debe tocar
   · Parámetros de sesión (duración, RPE, progresión, etc.)
   · Notas libres para la IA

3. Admin pulsa "Generar plan con IA"
      ↓
   GPT-4o genera el plan completo siguiendo exactamente la configuración
   → Plan guardado en Supabase
   → Cliente pasa a status: active
```

### Módulos disponibles (sliders 0-100)

| Módulo | Icono | Descripción |
|--------|-------|-------------|
| Fuerza | 🏋️ | Peso libre, máquinas, calistenia para fuerza máxima |
| Hipertrofia | 💪 | Volumen e intensidad para ganar masa muscular |
| Cardio | 🏃 | Trabajo aeróbico continuo o en intervalos |
| HIIT | ⚡ | Alta intensidad a intervalos |
| Movilidad | 🧘 | Stretching, yoga, rango articular |
| Funcional | 🔄 | Movimientos multiarticulares de la vida diaria |
| Core | 🎯 | Abdomen, lumbar, estabilizadores profundos |
| Potencia | 💥 | Trabajo explosivo: saltos, sprints, olímpicos |

### Parámetros de sesión configurables

- **Duración media** (20-120 min)
- **Descanso entre series** (20-180 seg)
- **RPE objetivo** (1-10, con etiqueta verbal)
- **Semanas de duración** (1-12)
- **Días por semana** (1-7)
- **Tipo de progresión**: Lineal / Ondulada / Por bloques
- **Enfoque técnico** (0=rendimiento puro ↔ 100=técnica perfecta)
- **Variedad de ejercicios** (0=ejercicios fijos ↔ 100=mucha variedad)

---

## 📦 Packs de entrenamiento

Plantillas preconfiguradas que se aplican en un clic. La IA también puede sugerir el más adecuado automáticamente.

### Packs del sistema (incluidos por defecto)

| Pack | Icono | Perfil ideal |
|------|-------|-------------|
| Principiante Total | 🌱 | Sin experiencia previa. Énfasis en técnica y movilidad |
| Pérdida de Grasa | 🔥 | Maximizar gasto calórico manteniendo músculo |
| Ganancia Muscular | 💪 | Hipertrofia con progresión de cargas |
| Adulto Mayor | 🧓 | +60 años. Funcional, equilibrio, sin impacto |
| Embarazada | 🤰 | Prenatal seguro. Sin HIIT, sin potencia |
| Atleta de Rendimiento | 🏆 | Fuerza explosiva y resistencia de alto nivel |
| Cardio & Bienestar | 🌈 | Moverse, reducir estrés, sentirse bien |

### Packs personalizados

El admin puede crear sus propios packs desde el configurador (pestaña "Packs") y guardarlos para reutilizarlos con otros clientes. Se almacenan en la tabla `training_packs` de Supabase.

---

## 🎮 Gamificación (vista del cliente)

El cliente acumula en `/mi-plan`:

- **Puntos por sesión**: 50 pts base + 10-50 pts según sensación (1-5 emojis)
- **Racha**: días consecutivos entrenados (se muestra en grande)
- **Barra de progreso**: sesiones completadas / total del plan
- **Logros desbloqueables**:

| Logro | Condición | Puntos |
|-------|-----------|--------|
| 🎯 Primera sesión | 1 sesión completada | 50 pts |
| 🔥 Semana perfecta | Racha de 7 días | 100 pts |
| 💎 Mes de hierro | Racha de 30 días | 500 pts |
| ⚡ En marcha | 10 sesiones completadas | 150 pts |
| 🏆 Veterano | 50 sesiones completadas | 500 pts |

---

## 🔌 API Routes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/leads` | POST | Guarda formulario público sin auth (service role) |
| `/api/link-user` | POST | Vincula lead con usuario registrado |
| `/api/suggest-config` | POST | IA analiza perfil y devuelve configuración sugerida |
| `/api/generate-plan` | POST | Genera plan con GPT-4o usando la config del admin |
| `/api/packs` | GET/POST/DELETE | CRUD de packs personalizados |
| `/api/clients` | GET | Lista clientes del entrenador |
| `/api/youtube-search` | GET | Busca vídeo de ejercicio (opcional: YOUTUBE_API_KEY) |
| `/api/suggest-exercise` | POST | IA sugiere ejercicio alternativo (lesiones, equipamiento) |
| `/api/progress-photo` | GET/POST | Fotos de progreso semanal (cliente sube, admin ve) |
| `/api/push-subscribe` | POST | Registrar suscripción push del cliente |
| `/api/push-reminder` | POST | Envía recordatorios (llamar desde cron diario) |

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                           → Landing PACGYM
│   ├── start/page.tsx                     → Formulario público + fake AI
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── mi-plan/page.tsx                   → Home cliente (calendario + gamificación)
│   ├── admin/
│   │   ├── page.tsx                       → Dashboard admin
│   │   ├── packs/page.tsx                 → Biblioteca de packs
│   │   └── clientes/[id]/
│   │       ├── page.tsx                   → Ficha + plan + seguimiento
│   │       └── configurar/page.tsx        → 🎛️ Configurador inteligente
│   └── api/
│       ├── leads/route.ts
│       ├── link-user/route.ts
│       ├── suggest-config/route.ts
│       ├── generate-plan/route.ts
│       ├── packs/route.ts
│       └── clients/route.ts
├── lib/
│   ├── openai.ts                          → Generación de planes con GPT-4o
│   ├── utils.ts                           → Labels, helpers
│   └── supabase/
│       ├── client.ts                      → Cliente browser
│       └── server.ts                      → Cliente server (SSR)
└── types/index.ts                         → Todos los tipos TypeScript
                                             + BASE_MODULES + SYSTEM_PACKS
```

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|-----------|-----|
| **Next.js 14** (App Router) | Framework full-stack |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos utility-first |
| **Supabase** | PostgreSQL + Auth + RLS |
| **OpenAI GPT-4o** | Sugerencia de config + generación de planes |
| **next-pwa** | Progressive Web App (offline, instalable) |

---

## 🔒 Seguridad

### Middleware de autenticación
- `/admin` y `/mi-plan` (y subrutas) requieren login
- Sin sesión → redirección a `/auth/login?redirect=...`
- Solo usuarios con `role: admin` en `profiles` pueden acceder a `/admin`
- `/auth/callback` es pública (Supabase redirige aquí tras confirmar email)

### Row Level Security (Supabase)

Todas las tablas tienen RLS activado en Supabase:
- Los **clientes** solo ven sus propios datos
- El formulario público puede insertar leads con `user_id = null`
- Las **API routes con service_role** (leads, generate-plan, link-user, packs) bypasean RLS de forma controlada
- Los **packs** son visibles si `es_publico = true` o fueron creados por el admin autenticado

---

## ▶️ Scripts

```bash
npm run dev      # Desarrollo (PWA desactivada)
npm run build    # Build de producción
npm start        # Servidor de producción (PWA activa)
npm run lint     # Linter
```
