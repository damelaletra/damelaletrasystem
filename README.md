# 🇨🇺 DAME LA LETRA (DML) — Louisville, KY

> **Red de Concierge y Conexión Directa de Servicios Locales en Louisville, Kentucky.**  
> *"DML elimina pasos: 'Necesito esto' ➔ 'Dame un momento' ➔ 'Listo'."*

---

## 📁 Estructura del Proyecto

```
Dame la letra/
├── .agents/               # Skills oficiales de Stripe y automatizaciones
├── .env                   # Variables de entorno (Twilio, Stripe, Gemini, Supabase)
├── .env.example           # Plantilla de variables de entorno
├── api/                   # Serverless handlers para Vercel / Cloud
│   └── index.js
├── data/                  # Base de datos SQLite local y almacenamiento
├── docs/                  # Documentación de arquitectura y guías
│   ├── ARCHITECTURE_PLAN.md   # Especificación maestra del producto y arquitectura
│   └── STRIPE_WALKTHROUGH.md  # Arquitectura y validación de Stripe
├── node_modules/          # Dependencias instaladas
├── public/                # Portales web interactivos
│   ├── index.html         # Portal del Cliente (Zero-Friction UI)
│   ├── admin.html         # Despacho en Vivo de Operadores (Concierge)
│   └── provider.html      # Simulador y Portal de Proveedores
├── scripts/               # Scripts de utilidad y mantenimiento
├── src/                   # Núcleo del motor DML
│   ├── core/
│   │   ├── channelManager.js    # Capa de canales (WhatsApp, SMS Twilio, Web)
│   │   ├── database.js          # Persistencia relacional y seed
│   │   ├── eligibilityEngine.js # Motor determinista de elegibilidad
│   │   ├── matchingEngine.js    # Motor de ranking y cascada anti-spam
│   │   ├── semanticEngine.js    # NLP de dialectos (cubano, spanglish, Louisville)
│   │   ├── stateMachine.js      # Máquina de estados de 13 fases
│   │   └── stripeService.js     # Integración oficial Stripe (Billing, Payments, Invoicing, Connect)
│   └── index.js
├── supabase/              # Migraciones y esquemas para producción PostgreSQL
├── test/                  # Suites de pruebas automatizadas
│   ├── stripe.test.js     # Test suite de los 4 productos Stripe
│   └── suite.js           # Test suite de ciclo de vida, NLP y Twilio
├── package.json
├── server.js              # Servidor Express local
└── vercel.json            # Configuración de despliegue en Vercel
```

---

## 🚀 Cómo Iniciar el Proyecto

### 1. Iniciar Servidor Local
```bash
npm run dev
```
El servidor arrancará en: **`http://localhost:4500`**

### 2. Acceso a las Interfaces Web
- 📰 **Portada / Periódico Digital (Landing Page)**: [http://localhost:4500](http://localhost:4500)
- 🎛️ **Centro de Despacho (Admin Concierge)**: [http://localhost:4500/admin.html](http://localhost:4500/admin.html)
- 📲 **Simulador de Proveedor**: [http://localhost:4500/provider.html](http://localhost:4500/provider.html)
- 🧪 **Simulador Integral de Pruebas**: [http://localhost:4500/simulator.html](http://localhost:4500/simulator.html)

## 🧪 Ejecutar Pruebas Automatizadas

### Suite General de Ciclo de Vida y NLP:
```bash
npm test
```

### Suite de Stripe (Billing, Payments, Invoicing, Connect):
```bash
node test/stripe.test.js
```

---

## 💳 Integración de Monetización (Stripe)
1. **Stripe Billing**: Membresías mensuales de proveedores ($49.99/mes fundador).
2. **Stripe Payments**: Cobro por lead/conexión exitosa ($10.00 USD).
3. **Stripe Invoicing**: Facturación consolidada mensual con ventana de pago.
4. **Stripe Connect (Accounts v2)**: Onboarding directo a cuentas bancarias de los técnicos.

---

## 🚀 ROADMAP FASE 2 (Actualizaciones Futuras Confirmadas)

1. **"Call Bridging" y "Call Whispering" (Central Telefónica IA)**
   - El cliente llama por teléfono (Voz).
   - El sistema contacta a los proveedores en background por teléfono de forma secuencial.
   - Si el Proveedor A no responde, se cuelga y llama al Proveedor B (sin que el cliente lo note).
   - Al contestar el Proveedor B, el sistema le "susurra" que tiene un lead de Dame La Letra. Si acepta, se hace el "Puente" y hablan directamente.
2. **Soporte de Audios (Voz a Texto nativo)**
   - Recepción de Notas de Voz por WhatsApp / SMS.
   - Transcripción instantánea mediante Whisper / Twilio y extracción semántica automática.
3. **Filtro de Urgencia Dinámico (Swarm Mode)**
   - Si un trabajo es de urgencia (ej. goma explotada en I-65), el modo Cascada cambia a "Broadcast" (contacta a 3 grúas a la vez para salvar la vida del cliente lo antes posible).

---

## 💎 ROADMAP FASE 3: Ecosistema y Monetización (Software Invisible)

**Filosofía Central:** DML *NO* es una App. Es "Software Invisible" (Zero-Friction). Cero descargas, cero logins, cero curvas de aprendizaje. Todo ocurre de forma natural en el canal nativo del usuario.

1. **Bolsa de Empleo Local (DML Jobs)**
   - Integración nativa de búsqueda de empleados. Un restaurante envía: "Necesito mesero". Un usuario escribe: "Busco trabajo de mesero". La cascada los empareja.
2. **Consultas de Información Diaria (Retención de Usuarios)**
   - Los usuarios pueden preguntar por el precio del dólar, clima o eventos locales. Esto genera el "Hábito" diario sin costo, manteniendo a DML como el contacto fijado en WhatsApp.
3. **Comercio Conversacional (Ticketing & Eventos)**
   - Venta de boletos para conciertos/eventos directamente por chat mediante Stripe Payment Links. Generación de comisión ($5/ticket) sin infraestructura física.
4. **Alianzas B2B (Listados Premium Paywall)**
   - Complejos de apartamentos pueden publicar disponibilidad.
   - Propietarios individuales pagan un "Paywall" único de $25 para publicar rentas (filtra a estafadores y mantiene la plataforma limpia).
5. **Modelos de "Bounty" (High-Ticket)**
   - Cobro por adquisición (Referral fee) para Dealers de Autos, Bienes Raíces o Seguros ($100+ por lead cerrado rastreado con códigos de promoción DML).
6. **Publicidad Contextual (Google Ads para WhatsApp)**
   - Si un usuario pregunta "¿A cómo está el dólar?", la IA responde y de forma natural recomienda a una Agencia de Envíos aliada (que paga membresía premium).

---

## 🚀 ROADMAP FASE 4: Casos de Uso Avanzados (Brainstorming)

1. **"El Menú del Día" (Takeout Curation)**
   - Restaurantes envían sus especiales del día. DML responde a la pregunta "¿Qué hay de almuerzo?" con las mejores opciones locales, generando ventas sin cobrar el 30% de UberEats.
2. **"El Mandadero" (Micro-tareas y Filas)**
   - Un mercado informal para "Hacer la fila del DMV", llevar un documento, etc. Monetizando el tiempo libre de la comunidad.
3. **Lead Gen Premium (Abogados y Realtors)**
   - "El Abogado Responde": DML captura preguntas legales/inmobiliarias de la comunidad y se las pasa en exclusiva a firmas que pagan $500+/mes (Categoría Diamante) por tener el primer contacto con esos leads de alto valor.
4. **CRM Proactivo (Recordatorios de Mantenimiento)**
   - DML recuerda a los usuarios que arreglaron su aire hace 6 meses que es hora del mantenimiento de invierno, generando trabajo de la nada para los técnicos y cerrando el ciclo de vida del cliente.
5. **Nightlife & VIP Lists**
   - Integración con promotores de clubes para colocar usuarios en listas VIP vía WhatsApp (Cobro por CPA/Bounty cuando la persona entra al local).
