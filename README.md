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
El servidor arrancará en: **`http://localhost:3000`**

### 2. Acceso a las Interfaces Web
- 🏠 **Portal de Clientes**: [http://localhost:3000](http://localhost:3000)
- 🎛️ **Centro de Despacho (Admin Concierge)**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
- 📲 **Simulador de Proveedor**: [http://localhost:3000/provider.html](http://localhost:3000/provider.html)

---

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
