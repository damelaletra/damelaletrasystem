/* ==========================================================================
   DAME LA LETRA — DIGITAL EXPERIENCE EVOLUTION RUNTIME
   1. Global Bilingual Engine (ES | EN) synced with #tu-software (ts_lang)
   2. Safe Phase-1 Typography Split Re-hydration (.hero-title, .h2, .label)
   3. Flagship Interactive Operations & AI Console (#demo-vivo)
   4. 360° Strategic Case Anatomy (#anatomia)
   5. Honest System Classification & Case Architecture in #project-stage
   6. Deep-link Industry Selector (?ind=...) for /software#tu-software
   ========================================================================== */
(function () {
  "use strict";

  var d = document;
  var root = d.documentElement;

  /* ---------- 1. Language Resolution & Storage ---------- */
  function detectInitialLang() {
    try {
      var params = new URLSearchParams(window.location.search);
      var qLang = params.get("lang");
      if (qLang === "en" || qLang === "es") {
        localStorage.setItem("ts_lang", qLang);
        return qLang;
      }
      var saved = localStorage.getItem("ts_lang");
      if (saved === "en" || saved === "es") return saved;
    } catch (e) {}
    return "es";
  }

  var dmlLang = detectInitialLang();
  var syncingTs = false;

  function L(pair) {
    if (!pair) return "";
    if (typeof pair === "object") return dmlLang === "en" ? (pair.en || pair.es || "") : (pair.es || "");
    var idx = String(pair).indexOf("|");
    if (idx === -1) return String(pair);
    return dmlLang === "en" ? pair.slice(idx + 1) : pair.slice(0, idx);
  }

  function ce(tag, cls, txt) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  /* ---------- 2. Safe Phase-1 Typography Re-hydration ---------- */
  function walkTextNodes(node, cb) {
    var w = d.createTreeWalker(node, 4, null, false);
    var list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(cb);
  }

  function wrapCharsSettled(tn) {
    var s = tn.nodeValue;
    if (!s || !/\S/.test(s)) return;
    var frag = d.createDocumentFragment();
    s.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(d.createTextNode(part));
        return;
      }
      var w = ce("span", "w");
      for (var i = 0; i < part.length; i++) {
        var ch = ce("span", "ch", part.charAt(i));
        ch.style.setProperty("--d", "0ms");
        w.appendChild(ch);
      }
      frag.appendChild(w);
    });
    tn.parentNode.replaceChild(frag, tn);
  }

  function setSmartRichHtml(targetEl, rawHtml) {
    if (!targetEl) return;
    if (!targetEl.hasAttribute("data-tt-split")) {
      targetEl.innerHTML = rawHtml;
      return;
    }

    // Element was already split by Phase 1 initT(); rebuild settled split structure cleanly
    if (targetEl.classList.contains("h2") || targetEl.classList.contains("chap-pager-title")) {
      var tmp = ce("div");
      tmp.innerHTML = rawHtml;
      var plain = tmp.textContent.replace(/\s+/g, " ").trim();
      var sr = ce("span", "sr-only", plain);
      var vis = ce("span", "tt-vis");
      vis.setAttribute("aria-hidden", "true");
      while (tmp.firstChild) vis.appendChild(tmp.firstChild);

      var isPager = targetEl.classList.contains("chap-pager-title");
      walkTextNodes(vis, function (tn) {
        var s = tn.nodeValue;
        if (!s || !/\S/.test(s)) return;
        var inEm = !!(tn.parentNode && tn.parentNode.closest && tn.parentNode.closest("em"));
        var frag = d.createDocumentFragment();
        s.split(/(\s+)/).forEach(function (tk) {
          if (!tk) return;
          if (/^\s+$/.test(tk)) {
            frag.appendChild(d.createTextNode(tk));
            return;
          }
          var mk = ce("span", "w-mask");
          var wn = ce("span", "w-in");
          wn.style.setProperty("--d", "0ms");
          if (isPager && inEm) {
            for (var c = 0; c < tk.length; c++) {
              var sc = ce("span", "sc-ch", tk.charAt(c));
              sc.setAttribute("data-ch", tk.charAt(c));
              wn.appendChild(sc);
            }
          } else {
            wn.textContent = tk;
          }
          if (inEm) mk.style.setProperty("--ink-d", "0ms");
          mk.appendChild(wn);
          frag.appendChild(mk);
        });
        tn.parentNode.replaceChild(frag, tn);
      });

      targetEl.innerHTML = "";
      targetEl.appendChild(sr);
      targetEl.appendChild(vis);
      targetEl.classList.add("tt", "tt-in");
      return;
    }

    if (targetEl.classList.contains("label")) {
      var tmpL = ce("div");
      tmpL.innerHTML = rawHtml;
      var plainL = tmpL.textContent.replace(/\s+/g, " ").trim();
      var srL = ce("span", "sr-only", plainL);
      targetEl.innerHTML = "";
      targetEl.appendChild(srL);

      Array.prototype.slice.call(tmpL.childNodes).forEach(function (cn) {
        if (cn.nodeType === 3 && /\S/.test(cn.nodeValue)) {
          var wr = ce("span", "tt-txt");
          wr.setAttribute("aria-hidden", "true");
          wr.appendChild(cn.cloneNode(true));
          walkTextNodes(wr, wrapCharsSettled);
          targetEl.appendChild(wr);
        } else if (cn.nodeType === 1) {
          var clone = cn.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          if (clone.tagName === "I") walkTextNodes(clone, wrapCharsSettled);
          targetEl.appendChild(clone);
        }
      });
      targetEl.classList.add("tt", "tt-in");
      return;
    }

    targetEl.innerHTML = rawHtml;
  }

  function updateHeroTitle(lang) {
    var h1 = d.querySelector(".hero-title");
    if (!h1) return;
    var lines = lang === "en"
      ? ["We don't do", "more of", "the same."]
      : ["No hacemos", "más de", "lo mismo."];
    var fullLabel = lang === "en" ? "We don't do more of the same." : "No hacemos más de lo mismo.";
    var ringTxt = lang === "en" ? "Independent Studio · Software & Brand · " : "Estudio creativo · Independiente · ";

    h1.setAttribute("aria-label", fullLabel);
    var ringPath = h1.querySelector("textPath");
    if (ringPath) ringPath.textContent = ringTxt;

    var sr = h1.querySelector(".sr-only");
    if (sr) sr.textContent = fullLabel;

    var lns = h1.querySelectorAll(".ln");
    if (lns.length < 3) return;

    if (!h1.hasAttribute("data-tt-split")) {
      var s0 = lns[0].querySelector("span:not(.badge)");
      var s1 = lns[1].querySelector("span:not(.badge)");
      var s2 = lns[2].querySelector(".strike") || lns[2].querySelector("span");
      if (s0) s0.textContent = lines[0];
      if (s1) s1.textContent = lines[1];
      if (s2) s2.textContent = lines[2];
      return;
    }

    // Already split by Phase 1 initT()
    [0, 1, 2].forEach(function (idx) {
      var ln = lns[idx];
      var tg = ln.querySelector(".strike") || ln.querySelector("span:not(.badge):not(.hero-roller)");
      if (!tg) return;
      tg.textContent = lines[idx];
      walkTextNodes(tg, function (tn) {
        wrapCharsSettled(tn);
      });
    });
    h1.style.setProperty("--strike-delay", "0ms");
  }

  /* ---------- 3. Honest Project Classification & Bilingual Stage Data ---------- */
  var STAGE_META = {
    lucky: {
      cls: "live",
      kickerEn: "01 / E-Commerce · Canned Cocktails & Mobile Bar · 60fps Motion",
      descEn: "Custom Shopify flagship and creative direction for craft canned cocktails and mobile bar service. Shot at 60fps for mobile and desktop with interactive depth-of-field floating ingredients.",
      fxBtnEn: "Shake floating ingredients",
      urlLabelEn: "Visit luckyshakersupply.com ↗",
      problem: "Una marca de cócteles en lata necesitaba vender online y reservar eventos privados sin verse como una plantilla genérica de licorería.|A craft canned cocktail brand needed to sell online and book private bar events without looking like a generic liquor template.",
      arch: "Dirección de rodaje a 60fps + arquitectura Shopify a medida + física interactiva ligera en navegador.|60fps studio production + bespoke Shopify theme architecture + lightweight interactive browser physics."
    },
    newera: {
      cls: "live",
      kickerEn: "02 / Real Estate Platform · Live SVG Pattern · AI Suite",
      descEn: "Bilingual real estate brokerage in Kentucky: geometric crimson-and-gold identity, mobile & desktop property platform with live golden SVG line sparks, and an omnichannel AI automation suite (ARM).",
      fxBtnEn: "Trigger golden SVG sparks",
      urlLabelEn: "Visit neweraky.com ↗",
      problem: "Correduría bilingüe en crecimiento perdía velocidad entre la captación digital y el seguimiento real de sus agentes por WhatsApp.|Growing bilingual brokerage was losing momentum between web lead capture and real agent follow-up on WhatsApp.",
      arch: "Identidad física y digital + plataforma web con geometría SVG viva + Suite ARM omnicanal conectada al inventario.|Physical & digital brand system + live SVG web platform + omnichannel AI ARM suite tied to property inventory."
    },
    elys: {
      cls: "live",
      kickerEn: "Brand Identity · Packaging · Web Platform & Launch Film",
      descEn: "Complete identity system and custom web platform for a boutique charcuterie atelier in Louisville (elyscharcuterie.com): rose monogram in burgundy and gold, bespoke packaging, seasonal promotions, bilingual catalog, and admin console.",
      fxBtnEn: "Animate rose emblems",
      urlLabelEn: "Visit elyscharcuterie.com ↗",
      problem: "Transformar pedidos artesanales por DM en una marca gourmet de regalo corporativo y eventos con presencia boutique y sitio web propio.|Turn informal DM orders into a high-perceived-value gourmet gifting and events brand with its own flagship platform.",
      arch: "Identidad visual + sistema de empaque físico + plataforma web bilingüe (elyscharcuterie.com) con promociones dinámicas y pedidos directos.|Visual identity + physical packaging system + bilingual web platform (elyscharcuterie.com) with seasonal promos and direct ordering."
    },
    dp: {
      cls: "live",
      kickerEn: "Digital Platform · Cinema Promo · Luxury Photography",
      descEn: "Interactive editorial portfolio and launch film for a luxury wedding, quinceañera, and cinema studio in Louisville, Kentucky.",
      urlLabelEn: "Visit dphotographystudios.com ↗",
      problem: "Estudio audiovisual de alto nivel necesitaba una vitrina digital a la altura de sus producciones cinematográficas.|High-end cinema & portrait studio needed a digital flagship worthy of its production value.",
      arch: "Plataforma editorial rápida + narrativa audiovisual integrada + flujo directo de reserva.|High-speed editorial web platform + integrated cinema reel + direct booking flow."
    },
    trilion: {
      cls: "live",
      kickerEn: "Web Platform · Leadership, Sports & Education",
      descEn: "Web architecture and UX design for a leadership, athletics, and education academy: clear enrollment paths, mobile-first layout, and high-impact visual storytelling.",
      urlLabelEn: "Visit trilionacademy.com ↗",
      problem: "Organizar múltiples programas deportivos y formativos en una arquitectura clara para padres y estudiantes en móvil.|Organize multiple sports and leadership programs into a frictionless mobile enrollment experience.",
      arch: "Arquitectura de información por programa + diseño UI/UX mobile-first en producción.|Program-driven information architecture + mobile-first UI/UX in production."
    },
    labonita: {
      cls: "live",
      kickerEn: "Art Direction · 3D Campaign Film · 10K & 14K Gold Shopify",
      descEn: "Editorial art direction and bespoke Shopify store: classical marble sculpture, Reimagined 3D campaign films, karat-filtered catalog, and live daily gold-buying calculator.",
      fxBtnEn: "Trigger 14K gold sparks",
      urlLabelEn: "Visit labonitajewelry.com ↗",
      problem: "Diferenciar una joyería de oro real de 10K y 14K frente a catálogos genéricos y automatizar el cálculo diario de compra de oro.|Differentiate a real 10K/14K gold jeweler from cookie-cutter stores and automate live gold-buying quotes.",
      arch: "Universo visual en mármol y 3D + tienda Shopify por quilataje + calculadora de cotización en vivo.|3D classical marble art direction + karat-filtered Shopify store + live daily gold calculator."
    },
    primestone: {
      cls: "live",
      kickerEn: "Digital Flagship · Spatial UI · General Construction",
      descEn: "Spatial digital platform and interactive showcase for Prime Stone Builders LLC (primestonebuildersllc.com), engineered in panoramic Desktop (16:9) and vertical Mobile (9:16) formats.",
      urlLabelEn: "Visit primestonebuildersllc.com ↗",
      problem: "Posicionar una constructora residencial de alto crecimiento en Kentucky con una presencia digital inmersiva muy por encima del contratista promedio.|Position a high-growth general construction firm in Kentucky with an immersive digital presence far above local competitors.",
      arch: "Plataforma web en producción (primestonebuildersllc.com) + interfaz espacial 16:9/9:16 + sistema de cotización y portafolio de obras.|Production web platform (primestonebuildersllc.com) + spatial 16:9/9:16 UI + project showcase and quote capture."
    },
    gn: {
      cls: "live",
      kickerEn: "Real Estate Acquisition · Scroll-Driven 3D Hero · Lead Engine",
      descEn: "Direct property acquisition platform in Louisville, Kentucky (gninvestmentsky.com): cinematic scroll-driven 3D crest reveal, interior perspective storytelling, instant cash-offer intake, and admin pipeline.",
      urlLabelEn: "Visit gninvestmentsky.com ↗",
      problem: "Captar propietarios que necesitan vender su casa tal como está (As-Is) en Louisville transmitiendo solidez financiera y confianza inmediata.|Capture motivated homeowners selling as-is in Louisville while projecting immediate institutional trust and speed.",
      arch: "Experiencia web cinemática controlada por scroll (GSAP) + captura directa de propiedades + panel administrativo conectado a Supabase.|Scroll-choreographed web experience (GSAP) + direct seller intake flow + Supabase-backed admin pipeline."
    },
    consoliday: {
      cls: "live",
      kickerEn: "FinTech / InsurTech Web Platform · Commission Reconciliation",
      descEn: "Bilingual SaaS web platform built for insurance agencies and brokers (consoliday.com): automated commission reconciliation, multi-carrier financial clarity, Stripe subscriptions, and agency analytics.",
      urlLabelEn: "Visit consoliday.com ↗",
      problem: "Las agencias de seguros perdían decenas de horas conciliando estados de comisiones dispersos en hojas de Excel propensas a errores.|Insurance agencies spent dozens of hours reconciling carrier commission statements across error-prone spreadsheets.",
      arch: "Frontend React multi-idioma (ES/EN) + motor backend en Python y Supabase + pagos con Stripe y panel ejecutivo de agencias.|Bilingual React platform (ES/EN) + Python & Supabase reconciliation engine + Stripe billing and agency dashboard."
    },
    berta: {
      cls: "live",
      kickerEn: "Editorial & Podcast Platform · Bilingual Hub · Admin CMS",
      descEn: "Bilingual digital home for award-winning educator and host Berta Weyenberg (conbertaciones.com): integrated audio player for 96+ episodes (ConBERTAciones & Under the Umbrella), blog reflections, speaker booking, and custom CMS.",
      urlLabelEn: "Visit conbertaciones.com ↗",
      problem: "Unificar dos programas de audio, casi cien episodios bilingües, artículos y contrataciones de conferencias en una experiencia cálida y fácil de administrar.|Unify two shows, 96+ bilingual audio episodes, essays, and speaking inquiries into an accessible, self-managed hub.",
      arch: "Plataforma web bilingüe (ES/EN) con reproductor de episodios en vivo + agenda de conferencias + panel de administración propio.|Bilingual web platform (ES/EN) with integrated episode player + speaker booking + custom admin view."
    },
    marielys: {
      cls: "live",
      kickerEn: "EdTech & Launch Platform · 21-Day Challenge + Student LMS",
      descEn: "Enrollment flagship and online learning platform (LMS) for Balloons by Marielys: conversion-focused curriculum presentation, student authentication, video lesson dashboard, and progress tracking.",
      urlLabelEn: "Visit live platform ↗",
      problem: "Lanzar un programa práctico de 21 días con su propia academia privada de alumnas sin depender de plataformas externas genéricas.|Launch a hands-on 21-day training program with a private student LMS without relying on generic third-party course marketplaces.",
      arch: "Plataforma Next.js + autenticación y base de datos en Supabase SSR + aula virtual LMS integrada y sistema de marca (#18).|Next.js web platform + Supabase SSR auth & database + integrated student LMS dashboard."
    },
    pool: {
      cls: "live",
      kickerEn: "Music Streaming & DJ Pool · Liquid Glass 3D Interface",
      descEn: "Next-generation remix and extended-track platform for professional DJs (Pool Extended): WebGL Liquid Ether backdrop, interactive 3D emblem, persistent waveform audio player, BPM/Key filters, and membership dashboard.",
      urlLabelEn: "Visit poolextended.com ↗",
      problem: "Renovar la experiencia de descarga musical para DJs latinos y de club con reproducción fluida, metadatos técnicos (BPM/Key) y estética de vanguardia.|Elevate the track-discovery and download workflow for club and Latin DJs with instant playback, BPM/Key metadata, and standout visual craft.",
      arch: "Interfaz React + Three.js Liquid Glass + reproductor persistente de audio + gestión de membresías, categorías y archivos en Supabase.|React + Three.js Liquid Glass UI + persistent audio player + Supabase membership and track vault."
    },
    campestre: {
      cls: "live",
      kickerEn: "Cross-Border E-Commerce · Logistics Timeline & Driver App",
      descEn: "Mobile-first e-commerce and delivery ecosystem for Restaurant Al Campestre: live currency rates, recipient directory, asynchronous delivery timeline, warehouse barcode scanner, and PIN-protected street driver app.",
      problem: "Conectar compras familiares desde EE.UU. con entregas puerta a puerta, control de almacén y despacho de choferes en ruta desde el teléfono.|Connect cross-border family grocery orders from the US with warehouse inventory, route dispatch, and street-level driver confirmation.",
      arch: "Tienda Next.js + asistente IA + portal móvil de repartidores con PIN y notificación WhatsApp + escáner de inventario para almacén.|Next.js storefront + AI assistant + PIN-secured mobile driver portal with WhatsApp dispatch + warehouse scanner."
    },
    zhomes: {
      cls: "live",
      kickerEn: "Real Estate SaaS · PropTech Match, Deal Vault & AI Radar",
      descEn: "ZHomes mobile-first PropTech application featuring Liquid Glass navigation, interactive ZHomes Match, Deal Vault Kanban with live mortgage math, neighborhood AI Radar, and agent analytics.",
      urlLabelEn: "Visit zhomesapp.com ↗",
      problem: "Unificar búsqueda interactiva, cálculo hipotecario en vivo y seguimiento de cierres en una sola plataforma inmobiliaria propia.|Unify property matching, live mortgage calculation, and deal tracking inside one proprietary PropTech app.",
      arch: "Aplicación SaaS en producción (zhomesapp.com) con ZHomes Match, Deal Vault Kanban y directorio exclusivo.|Production SaaS app (zhomesapp.com) with ZHomes Match, Deal Vault Kanban, and exclusive agent hub."
    },
    barba: {
      cls: "live",
      kickerEn: "Construction ERP · Live Estimates, AI OCR & Crew Payroll",
      descEn: "Bespoke construction operating system (ARM Pro): financial command center, live-margin estimate builder, AI OCR supplier invoice scanning, subcontractor tracking, and per-job payroll.",
      problem: "Las hojas de Excel y facturas en papel impedían ver el margen real de cada obra antes de liquidar cuadrillas los viernes.|Spreadsheets and paper receipts hid true job profitability until after Friday crew payouts.",
      arch: "ERP/ARM propietario con presupuestos dinámicos, lector OCR con IA para facturas de materiales y nómina por obra.|Proprietary ARM Pro ERP with live-margin estimating, AI OCR receipt scanning, and per-project payroll."
    },
    software: {
      cls: "live",
      kickerEn: "Omnichannel AI Automation · Real Estate ARM Suite",
      descEn: "Artificial intelligence and omnichannel automation suite built for New Era Real Estate: instant lead qualification, multi-channel follow-up, smart scheduling, and live property sync.",
      fxBtnEn: "Trigger golden SVG sparks",
      urlLabelEn: "Visit neweraky.com ↗",
      problem: "Responder y calificar prospectos bilingües 24/7 sin perder el toque humano ni desconectarse del WhatsApp real del agente.|Qualify bilingual leads 24/7 without robotic friction or disconnecting from the agent's real WhatsApp.",
      arch: "Motor conversacional IA + reglas de negocio inmobiliarias + panel de supervisión omnicanal.|Conversational AI engine + real estate business rules + omnichannel supervision console."
    },
    mychief: {
      cls: "lab",
      kickerEn: "CAD & BIM 3D Engine · Live Interactive Civic Blueprint",
      descEn: "Interactive 3D architectural and structural proposal for the City of Lynnview Monument & Civic Plaza. Orbit 360°, switch between daylight PBR, 12V night LED lighting, CAD vector view, foundation X-Ray (-36\"/-60\"), or launch in AR.",
      arLabelEn: "✦ Place Civic Monument in your room (AR)",
      problem: "Permitir que un comité municipal o cliente revise cimentaciones, iluminación nocturna y escala real sin saber usar software CAD.|Let a city board or client inspect foundations, night lighting, and true scale without CAD software.",
      arch: "Visor 3D PBR/CAD interactivo en navegador + planos estructurales S-1/L-1 + Realidad Aumentada nativa.|Browser-native PBR/CAD 3D viewer + S-1/L-1 engineering sheets + native iOS/Android AR."
    },
    tzel: {
      cls: "lab",
      kickerEn: "Real Estate Intelligence · Pre-Foreclosure, GIS & Auctions",
      descEn: "Automated real estate acquisition OS in Jefferson County (tzel.vercel.app): interactive equity-temperature map, ARV spread filters, Master Commissioner / Lis Pendens auction calendar, LOJIC GIS cross-check, and Telegram alerts.",
      urlLabelEn: "Open tzel.vercel.app live ↗",
      problem: "Cruzar manualmente subastas judiciales, deuda estimada, zonificación GIS y comparables MLS tomaba horas cada mañana.|Manually cross-checking court auctions, GIS zoning, and MLS comps took hours every morning.",
      arch: "Motor diario automatizado (PVA + LOJIC GIS + MLS Comps) + consola cartográfica interactiva + alertas Telegram.|Automated daily pipeline (PVA + LOJIC GIS + MLS Comps) + interactive map console + Telegram dispatch."
    },
    "dml-arm": {
      cls: "lab",
      kickerEn: "Proprietary Studio OS · AI Concierge + 6-Industry ARM",
      descEn: "Dame la Letra’s internal operating system and architecture showcase: live 6-industry ARM simulator, conversational AI concierge, dispatch console, and $0-per-seat custom software blueprint.",
      problem: "Demostrar en vivo por qué una empresa seria debe ser dueña de su propio software en lugar de alquilar un CRM genérico por asiento.|Prove live why established businesses should own bespoke software instead of renting per-seat generic CRMs.",
      arch: "Arquitectura modular ARM + IA con datos propios, API oficial de WhatsApp Business y $0 por usuario.|Modular ARM + AI architecture powered by your own data, official WhatsApp Business API, and $0/seat."
    }
  };

  function classifyStageId(id) {
    if (!id) return "live";
    if (STAGE_META[id]) return STAGE_META[id].cls;
    if (String(id).indexOf("bset-") === 0) {
      // #12 Dame la Letra, #19 New Era, #28 Tzel, #05 Clover, #06 David Flowers, #26 The Lens Academy, #27 TwoIT, #29 UBC exist in client roster / studio portfolio
      return "lab";
    }
    return "live";
  }

  function clsLabel(cls) {
    if (cls === "live") {
      return L("CASO REAL · EN PRODUCCIÓN|LIVE CLIENT SYSTEM · IN PRODUCTION");
    }
    return L("INGENIERÍA DML · DEMO INTERACTIVA|DML LAB · INTERACTIVE SYSTEM");
  }

  function enhanceOpenStage(id, isFreshOpen) {
    var stage = d.getElementById("project-stage");
    if (!stage || !id) return;
    var info = stage.querySelector(".stage-info");
    var stTitle = d.getElementById("st-title");
    var stKicker = d.getElementById("st-kicker");
    var stDesc = d.getElementById("st-desc");
    var stFxCtrl = d.getElementById("st-fx-ctrl");
    var stActions = d.getElementById("st-actions");
    var stPrev = d.getElementById("st-prev");
    var stNext = d.getElementById("st-next");
    if (!info || !stTitle) return;

    // 1. Honest classification badge above title
    var oldCls = info.querySelector(".st-cls-wrap");
    if (oldCls) oldCls.remove();
    var cls = classifyStageId(id);
    var clsWrap = ce("div", "st-cls-wrap");
    var badge = ce("span", "cls-badge " + (cls === "live" ? "cls-live" : "cls-lab"), clsLabel(cls));
    clsWrap.appendChild(badge);
    info.insertBefore(clsWrap, stTitle);

    // 2. Problem -> Architecture brief box for documented cases
    var oldArch = info.querySelector(".st-arch-box");
    if (oldArch) oldArch.remove();
    var meta = STAGE_META[id];
    if (meta && meta.problem && meta.arch) {
      var archBox = ce("div", "st-arch-box");
      var p1 = ce("div", "st-arch-item");
      p1.innerHTML = "<strong>" + L("01 · El Desafío Real|01 · Business Challenge") + "</strong>" + L(meta.problem);
      var p2 = ce("div", "st-arch-item");
      p2.innerHTML = "<strong>" + L("02 · Arquitectura Construida|02 · Built Architecture") + "</strong>" + L(meta.arch);
      archBox.appendChild(p1);
      archBox.appendChild(p2);
      if (stDesc && stDesc.nextSibling) {
        info.insertBefore(archBox, stDesc.nextSibling);
      } else {
        info.appendChild(archBox);
      }
    }

    // 3. Translate Stage UI controls & texts when in English
    if (stPrev) {
      stPrev.textContent = L("← Anterior|← Prev");
      stPrev.setAttribute("aria-label", L("Proyecto anterior|Previous project"));
    }
    if (stNext) {
      stNext.textContent = L("Siguiente →|Next →");
      stNext.setAttribute("aria-label", L("Siguiente proyecto|Next project"));
    }
    stage.querySelectorAll("[data-close-stage]").forEach(function (b) {
      b.textContent = L("Cerrar [Esc]|Close [Esc]");
    });

    // Save original ES copy on fresh stage open (including re-opens of same stage) so ES <-> EN toggle is lossless
    var needsSnapshot = isFreshOpen || stKicker.getAttribute("data-stage-id") !== id ||
      (stActions && stActions.children.length && !stActions.children[0].hasAttribute("data-orig-es"));
    if (stKicker && needsSnapshot) {
      stKicker.setAttribute("data-stage-id", id);
      stKicker.setAttribute("data-orig-es", stKicker.textContent || "");
      if (stDesc) stDesc.setAttribute("data-orig-es", stDesc.textContent || "");
      if (stFxCtrl) {
        var fxb0 = stFxCtrl.querySelector("button");
        if (fxb0) fxb0.setAttribute("data-orig-es", fxb0.textContent || "");
      }
      if (stActions) {
        Array.prototype.slice.call(stActions.children).forEach(function (act) {
          act.setAttribute("data-orig-es", act.textContent || "");
          if (act.hasAttribute("href")) act.setAttribute("data-orig-href", act.getAttribute("href") || "");
        });
      }
    }

    if (dmlLang === "en") {
      if (meta) {
        if (meta.kickerEn && stKicker) stKicker.textContent = meta.kickerEn;
        if (meta.descEn && stDesc) stDesc.textContent = meta.descEn;
        if (meta.fxBtnEn && stFxCtrl) {
          var fxb = stFxCtrl.querySelector("button");
          if (fxb) fxb.textContent = meta.fxBtnEn + " +";
        }
      } else if (String(id).indexOf("bset-") === 0) {
        if (stKicker) stKicker.textContent = (stKicker.getAttribute("data-orig-es") || stKicker.textContent).replace("Mini Branding Set ·", "Brand Identity System ·");
        if (stDesc) {
          stDesc.textContent = (stDesc.getAttribute("data-orig-es") || stDesc.textContent)
            .replace("Sistema de identidad física y visual para ", "Complete physical and visual identity system for ")
            .replace("Incluye tarjetas de presentación frente y reverso,", "Includes front-and-back business cards,")
            .replace("stickers troquelados y señalética exterior. Paleta oficial:", "die-cut stickers, and exterior signage. Official palette:");
        }
      }

      if (stActions) {
        Array.prototype.slice.call(stActions.children).forEach(function (act) {
          var tx = act.getAttribute("data-orig-es") || act.textContent || "";
          if (tx.indexOf("Cotizar un proyecto así") !== -1) {
            act.textContent = "Discuss a project like this on WhatsApp →";
            var href = act.getAttribute("href") || "";
            if (href.indexOf("wa.me") !== -1) {
              act.setAttribute("href", "https://wa.me/15026587853?text=" + encodeURIComponent('Hi Miguel, I am viewing "' + stTitle.textContent + '" on damelaletra.com and would like to discuss something at this level for my business.'));
            }
          } else if (tx.indexOf("Copiar enlace directo") !== -1) {
            act.textContent = "Copy direct link ↗";
          } else if (meta && meta.urlLabelEn && act.tagName === "A" && act.target === "_blank" && tx.indexOf("WhatsApp") === -1) {
            act.textContent = meta.urlLabelEn;
          } else if (meta && meta.arLabelEn && tx.indexOf("(AR)") !== -1) {
            act.textContent = meta.arLabelEn;
          } else if (tx.indexOf("Mini Branding Set") !== -1) {
            act.textContent = tx.replace("Ver su Mini Branding Set Físico", "View Physical Brand System").replace("Explorar 32 Mini Branding Sets", "Explore 32 Brand Worlds");
          } else if (tx.indexOf("Probar Simulador") !== -1) {
            act.textContent = "Launch Live ARM Simulator →";
          } else if (tx.indexOf("Ver su Software de IA") !== -1) {
            act.textContent = "View Omnichannel AI Suite →";
          } else if (tx.indexOf("Ver su Plataforma Web") !== -1 || tx.indexOf("Ver su Sitio Web") !== -1) {
            act.textContent = "View Live Web Platform →";
          } else if (tx.indexOf("Coming Soon") !== -1) {
            act.textContent = "View Upcoming Web Platform (Coming Soon) →";
          }
        });
      }

      var tzelRun = stage.querySelector("[data-tzel-run]");
      if (tzelRun) tzelRun.textContent = "Run live scan simulation";
    } else {
      if (stKicker && stKicker.hasAttribute("data-orig-es")) stKicker.textContent = stKicker.getAttribute("data-orig-es");
      if (stDesc && stDesc.hasAttribute("data-orig-es")) stDesc.textContent = stDesc.getAttribute("data-orig-es");
      if (stFxCtrl) {
        var fxbEs = stFxCtrl.querySelector("button");
        if (fxbEs && fxbEs.hasAttribute("data-orig-es")) fxbEs.textContent = fxbEs.getAttribute("data-orig-es");
      }
      if (stActions) {
        Array.prototype.slice.call(stActions.children).forEach(function (act) {
          if (act.hasAttribute("data-orig-es")) act.textContent = act.getAttribute("data-orig-es");
          if (act.hasAttribute("data-orig-href")) act.setAttribute("href", act.getAttribute("data-orig-href"));
        });
      }
      var tzelRunEs = stage.querySelector("[data-tzel-run]");
      if (tzelRunEs) tzelRunEs.textContent = "Simular escaneo en vivo";
    }
  }

  /* ---------- 4. Flagship Interactive Operations & AI Console (#demo-vivo) ---------- */
  var DC_DATA = {
    construccion: {
      tab: "Construcción|Construction",
      company: "Robledo Construction",
      domain: "app.robledoconstruction.com",
      role: "Contratista · En Obra|Field Contractor · On-Site",
      scenarios: [
        {
          chip: "Subir factura ABC Supply ($2,184) y auditar margen|Log ABC Supply invoice ($2,184) & audit margin",
          waUser: "Acabo de subir foto de la factura de ABC Supply por $2,184 para el techo de la obra Delgado. ¿Cómo queda nuestro margen?|Just snapped the ABC Supply invoice for $2,184 on the Delgado roof job. Where does our margin stand?",
          waBot: "Factura #ABC-8841 leída por OCR y cargada a Obra Delgado. ⚠️ Alerta: el gasto real subió a $11,940 sobre $11,200 presupuestados (margen cayó a 8%, debajo de tu mínimo de 15%). Detecté 9 hojas extra de OSB: ¿genero orden de cambio por $765 según cláusula 01?|Invoice #ABC-8841 parsed via OCR and posted to Delgado Job. ⚠️ Alert: actual spend hit $11,940 vs. $11,200 budget (margin dropped to 8%, below your 15% floor). Detected 9 extra OSB sheets: generate $765 change order under Clause 01?",
          intent: "OCR_INVOICE_MARGIN_GUARD",
          entity: "Obra Delgado · Roofing",
          rule: "Margen < 15% + Cláusula OSB $85/hoja|Margin < 15% + OSB Clause $85/sheet",
          sla: "1.4 seg · Datos propios|1.4s · Proprietary DB",
          json: {
            module: "cost_control_ocr",
            project_id: "JOB-DELGADO-04",
            vendor: "ABC Supply Co.",
            invoice_total: 2184.00,
            live_margin_pct: 8.0,
            threshold_pct: 15.0,
            recoverable_change_order_usd: 765.00
          },
          armTitle: "Control de Rentabilidad en Vivo|Live Job Profitability Guard",
          armSub: "Presupuesto vs. Gasto Real actualizado desde WhatsApp|Budget vs. Actual Spend updated straight from WhatsApp",
          kpis: [
            ["Gasto Real Obra|Actual Job Spend", "$11,940", "is-warn"],
            ["Margen Detectado|Live Margin", "8% (Alerta <15%)", "is-warn"],
            ["Orden de Cambio|Change Order Ready", "+$765 (9 OSB)", "is-gold"],
            ["Licencias por Usuario|Per-User Seat Fees", "$0 / mes|$0 / mo", "is-ok"]
          ],
          actionBanner: "✓ Factura indexada por OCR, alerta enviada al dueño y borrador de Orden de Cambio listo para firma en tablet.|✓ Invoice OCR-indexed, owner alerted, and Change Order draft queued for tablet signature."
        },
        {
          chip: "Detectar choque de cuadrillas el jueves|Check Thursday crew schedule conflict",
          waUser: "¿Cómo están las cuadrillas para este jueves? Creo que Marvin tenía dos techos.|How do crews look for Thursday? I think Marvin had two roofs.",
          waBot: "Revisé el calendario: Cuadrilla B (Marvin · 5 instaladores) tiene choque el jueves entre Shelby Tear-off y Obra Delgado. Cuadrilla B está libre el viernes. ¿Muevo Delgado al viernes y preparo aviso para el cliente?|Checked schedule: Crew B (Marvin · 5 installers) is double-booked Thursday on Shelby Tear-off and Delgado Roof. Crew B is open Friday. Move Delgado to Friday and draft homeowner notice?",
          intent: "CREW_CONFLICT_SOLVER",
          entity: "Cuadrilla B · Marvin (5)",
          rule: "0 doble asignación por día|Zero double-dispatch rule",
          sla: "0.9 seg · Calendario vivo|0.9s · Live Dispatch",
          json: {
            module: "crew_dispatch",
            crew: "Crew_B_Roofing",
            conflict_date: "Thursday",
            jobs_affected: ["Shelby Tear-off", "Delgado Roof"],
            recommended_slot: "Friday 07:30 AM",
            client_sms_status: "DRAFT_PENDING_APPROVAL"
          },
          armTitle: "Tablero de Cuadrillas & Despacho|Crew Schedule & Dispatch Board",
          armSub: "Prevención de tiempos muertos y choques de obra|Zero-collision crew scheduling",
          kpis: [
            ["Cuadrillas Activas|Active Crews", "3 (12 técnicos|12 techs)", "is-ok"],
            ["Choque Detectado|Conflict Caught", "Jueves · Cuadrilla B|Thu · Crew B", "is-gold"],
            ["Reubicación Óptima|Optimal Reschedule", "Viernes 7:30 AM|Fri 7:30 AM", "is-ok"],
            ["Aviso a Cliente|Homeowner Notice", "Borrador seguro|Safe Draft", "is-gold"]
          ],
          actionBanner: "✓ Choque detectado antes de despachar camiones. El mensaje al cliente nunca sale sin tu aprobación.|✓ Crew collision caught before trucks roll. Client message stays in draft until you approve."
        },
        {
          chip: "Generar presupuesto + contrato Whitfield ($19,850)|Build Whitfield estimate + contract ($19,850)",
          waUser: "Prepara el contrato de siding y gutters de Casa Whitfield (28 sq siding, 186 ft gutter) para firmarlo hoy.|Prepare the siding & gutters contract for Whitfield Residence (28 sq siding, 186 ft gutter) to sign today.",
          waBot: "Listo: BOM calculado en $7,405 materiales + $6,900 mano de obra. Precio al cliente: $19,850 (Margen neto estimado: 27%). Contrato digital con cláusula de madera dañada ($85/OSB) y calendario 40/40/20 listo para firma.|Done: BOM calculated at $7,405 materials + $6,900 labor. Client price: $19,850 (Est. net margin: 27%). Digital contract with rotted-wood clause ($85/OSB) and 40/40/20 schedule ready to sign.",
          intent: "ESTIMATE_TO_CONTRACT",
          entity: "Casa Whitfield · 1824 Brookline",
          rule: "BOM + Cláusulas de protección|BOM + Protection Clauses",
          sla: "1.2 seg · Cotizador ARM|1.2s · ARM Estimator",
          json: {
            module: "estimator_contracts",
            client: "M. Whitfield",
            materials_bom_usd: 7405,
            crew_labor_usd: 6900,
            contract_price_usd: 19850,
            projected_margin_pct: 27.0,
            signature_link: "ready_on_tablet"
          },
          armTitle: "Estimador BOM + Firma en Obra|BOM Estimator + On-Site eSign",
          armSub: "De medidas de campo a contrato blindado en 1 minuto|From field measurements to protected contract in 60s",
          kpis: [
            ["Materiales + Labor|BOM + Crew Labor", "$14,305", ""],
            ["Precio Contrato|Contract Total", "$19,850", "is-gold"],
            ["Margen Protegido|Protected Margin", "27% Neto|27% Net", "is-ok"],
            ["Estado de Firma|Signature Status", "Listo en Tablet|Tablet Ready", "is-ok"]
          ],
          actionBanner: "✓ Materiales desglosados (28 sq Dutch lap, 186 ft gutter 6\") y contrato listo para capturar firma digital.|✓ Full material takeoff generated and contract queued for on-site digital signature."
        }
      ]
    },
    realestate: {
      tab: "Real Estate|Real Estate",
      company: "Bluegrass Key Realty",
      domain: "app.bluegrasskey.com",
      role: "Broker & Agentes · MLS|Broker & Agents · MLS",
      scenarios: [
        {
          chip: "Calificar lead bilingüe de Instagram + enviar MLS|Qualify bilingual IG lead + send MLS",
          waUser: "Entró mensaje de Daniela Ortiz preguntando si sigue disponible la de 3 cuartos en Fern Creek y si aceptan FHA.|Daniela Ortiz just messaged asking if the 3-bed in Fern Creek is still active and accepts FHA.",
          waBot: "MLS #KY-8841 (Fern Creek · 3 hab / 2 baños · $289,900) está Activa y elegible para FHA. Vinculé la conversación al WhatsApp real de Carla M. y dejé lista la ficha bilingüe con calculadora de pago mensual.|MLS #KY-8841 (Fern Creek · 3BD/2BA · $289,900) is Active and FHA-eligible. Routed thread to Carla M.’s real WhatsApp with bilingual listing card and payment breakdown queued.",
          intent: "OMNICHANNEL_MLS_MATCH",
          entity: "MLS #KY-8841 · Fern Creek",
          rule: "WhatsApp real del agente (sin # virtual)|Agent real WhatsApp (no virtual #)",
          sla: "0.8 seg · Sync MLS|0.8s · MLS Sync",
          json: {
            module: "omnichannel_inbox",
            lead_name: "Daniela Ortiz",
            channel_origin: "Instagram_DM",
            mls_id: "KY-8841",
            list_price_usd: 289900,
            fha_eligible: true,
            assigned_agent: "Carla M."
          },
          armTitle: "Bandeja Omnicanal sobre WhatsApp Real|Real-WhatsApp Omnichannel Inbox",
          armSub: "El broker ve la auditoría; el cliente habla con el número real del agente|Broker gets full visibility; client texts the agent's real number",
          kpis: [
            ["Propiedad MLS|MLS Listing", "#KY-8841 · $289.9K", "is-gold"],
            ["Tiempo Respuesta|Response SLA", "< 1 min · 24/7", "is-ok"],
            ["Agente Asignada|Assigned Agent", "Carla M. (FHA)", "is-ok"],
            ["Ahorro Licencias|Seat Savings", "$3,483 / mes|$3,483 / mo", "is-gold"]
          ],
          actionBanner: "✓ 27 agentes operando en su propio dominio sin pagar $129/mes por usuario en un CRM alquilado.|✓ 27 agents operating on their own brokerage domain without $129/seat monthly CRM fees."
        },
        {
          chip: "Auditar expediente 4417 Hillcrest antes de cierre|Audit 4417 Hillcrest file before closing",
          waUser: "Audita el cierre de 4417 Hillcrest Dr. (Familia Ramírez) y dime qué falta.|Audit the 4417 Hillcrest Dr. closing file (Ramirez Family) and tell me what's missing.",
          waBot: "Auditoría Deal Room #4417: Pre-aprobación ($310K) vigente ✓. Tasación en 9 días ✓. ⚠️ Dos alertas críticas: 1) Contingencia de inspección vence en 48 horas; 2) Falta firma del vendedor en página 3 del Seller Disclosure.|Deal Room #4417 Audit: Pre-approval ($310K) valid ✓. Appraisal in 9d ✓. ⚠️ Two critical flags: 1) Inspection contingency expires in 48h; 2) Missing seller signature on page 3 of Seller Disclosure.",
          intent: "DEAL_ROOM_COMPLIANCE_AUDIT",
          entity: "4417 Hillcrest Dr · $298,000",
          rule: "Contingencias + Firmas obligatorias|Contingency + Signature Audit",
          sla: "1.1 seg · Deal Room|1.1s · Deal Room",
          json: {
            module: "deal_room_audit",
            property: "4417 Hillcrest Dr",
            offer_amount_usd: 298000,
            inspection_due_hours: 48,
            missing_signatures: ["Seller_Disclosure_Page_3"],
            risk_level: "ACTION_REQUIRED"
          },
          armTitle: "Deal Room & Auditoría de Cierre|Deal Room & Closing Compliance",
          armSub: "Ninguna contingencia ni firma crítica se pasa por alto|Zero missed contingencies or compliance signatures",
          kpis: [
            ["Valor Operación|Deal Volume", "$298,000", "is-gold"],
            ["Inspección|Inspection Window", "Vence en 48h|Due in 48h", "is-warn"],
            ["Documento Alerta|Flagged Doc", "Disclosure Pág. 3|Disclosure Pg. 3", "is-warn"],
            ["Cierre Programado|Target Closing", "En 24 días|In 24 days", "is-ok"]
          ],
          actionBanner: "✓ Recordatorio automático preparado para el listing agent y alerta fijada en el tablero del Principal Broker.|✓ Automated reminder queued for listing agent and flagged on Principal Broker dashboard."
        },
        {
          chip: "Liquidar comisión y split 70/30 de Carla|Settle Carla's 70/30 commission split",
          waUser: "¿Cuánto le toca neto a Carla en el cierre de Hillcrest ($298,000 al 3%)?|What is Carla's exact net payout on Hillcrest ($298,000 at 3%)?",
          waBot: "Comisión bruta (3%): $8,940. Aplicando su esquema 70/30 menos $395 de fee administrativo: Neto para Carla M. = $5,863 · Retención Brokerage = $3,077. Lista para aprobación de pago del Broker.|Gross commission (3%): $8,940. Applying her 70/30 split minus $395 transaction fee: Carla M. Net = $5,863 · Brokerage = $3,077. Queued for Principal Broker payout approval.",
          intent: "COMMISSION_SPLIT_ENGINE",
          entity: "Carla M. · Split 70/30",
          rule: "Bruto × 70% − $395 Transaction Fee|Gross × 70% − $395 Fee",
          sla: "0.5 seg · Finanzas Broker|0.5s · Broker Finance",
          json: {
            module: "commission_settlement",
            sale_price_usd: 298000,
            gross_commission_usd: 8940,
            split_plan: "70_30_TIER_A",
            admin_fee_usd: 395,
            agent_net_usd: 5863,
            broker_net_usd: 3077
          },
          armTitle: "Liquidación Automática de Splits|Automated Commission & Split Engine",
          armSub: "Adiós a las hojas de cálculo de comisiones a fin de mes|Eliminates end-of-month commission spreadsheet errors",
          kpis: [
            ["Comisión Bruta|Gross Commission", "$8,940 (3%)", ""],
            ["Neto Agente|Agent Net Payout", "$5,863", "is-ok"],
            ["Neto Brokerage|Brokerage Net", "$3,077", "is-gold"],
            ["Estado Pago|Payout Status", "Listo p/ Aprobar|Ready to Approve", "is-ok"]
          ],
          actionBanner: "✓ Desglose transparente enviado al portal del agente y listo para dispersión ACH.|✓ Transparent split statement posted to agent portal and ready for ACH payout."
        }
      ]
    },
    servicios: {
      tab: "HVAC & Servicios|Home Services",
      company: "Derby City Air & Plumbing",
      domain: "app.derbycityair.com",
      role: "Despacho & Técnicos|Dispatch & Field Techs",
      scenarios: [
        {
          chip: "Despachar urgencia en 814 Shelby St por GPS|Dispatch 814 Shelby St emergency via GPS",
          waUser: "Entró urgencia: fuga en calentador en 814 Shelby St. ¿A qué técnico mando ahora mismo?|Emergency call: water heater leak at 814 Shelby St. Which tech can I send right now?",
          waBot: "Crucé GPS de los 4 técnicos en ruta: Rafael M. está terminando en 940 Baxter Ave (a 7 minutos de Shelby St) y lleva válvulas de calentador en su unidad. ¿Le asigno la Orden #1052 y aviso llegada al cliente?|Checked live GPS across 4 active techs: Rafael M. is wrapping up at 940 Baxter Ave (7 mins from Shelby St) and carries heater valves on his truck. Assign Order #1052 and text ETA to client?",
          intent: "GPS_EMERGENCY_DISPATCH",
          entity: "Orden #1052 · 814 Shelby St",
          rule: "Proximidad GPS + Inventario en van|GPS Proximity + Truck Stock",
          sla: "0.7 seg · Despacho Vivo|0.7s · Live Dispatch",
          json: {
            module: "field_dispatch_gps",
            order_id: "WO-1052",
            issue: "Water_Heater_Leak",
            best_tech: "Rafael M.",
            eta_minutes: 14,
            van_stock_verified: true
          },
          armTitle: "Despacho Inteligente de Flota Técnica|Smart GPS Tech Dispatch",
          armSub: "Asigna al técnico correcto según ruta real y repuestos a bordo|Assigns the closest tech carrying the right parts",
          kpis: [
            ["Técnico Óptimo|Best Match Tech", "Rafael M. (7 min)", "is-ok"],
            ["Stock en Unidad|Truck Inventory", "Válvulas OK|Valves In Stock", "is-ok"],
            ["Orden Creada|Work Order", "#1052 Prioritaria|#1052 Priority", "is-gold"],
            ["Caja del Día|Today Collected", "$2,840 (5 órd.)", "is-ok"]
          ],
          actionBanner: "✓ Orden enviada al teléfono de Rafael con historial del equipo y enlace de cobro en sitio.|✓ Work order pushed to Rafael's phone with equipment history and tap-to-pay link."
        },
        {
          chip: "Cerrar orden #1047 y cobrar $248 en sitio|Close Order #1047 & collect $248 on-site",
          waUser: "Kevin ya cambió el capacitor dual 45/5 en Bardstown Rd y cobró con tarjeta. Cierra la #1047.|Kevin replaced the 45/5 dual capacitor on Bardstown Rd and collected card payment. Close #1047.",
          waBot: "Orden #1047 cerrada: 1× Capacitor 45/5 MFD ($68, descontado de van #02) + 1.5h mano de obra ($180) = $248 pagados. Recibo enviado al cliente y Kevin pasa a su parada de las 2:30 PM en Taylor Blvd.|Order #1047 closed: 1× 45/5 MFD Capacitor ($68, deducted from Van #02) + 1.5h labor ($180) = $248 paid. Receipt texted to homeowner and Kevin routed to 2:30 PM stop on Taylor Blvd.",
          intent: "FIELD_INVOICE_INVENTORY",
          entity: "Orden #1047 · Kevin H.",
          rule: "Cobro en sitio + Descuento almacén|On-Site Pay + Van Stock Sync",
          sla: "0.9 seg · Facturación|0.9s · Field Billing",
          json: {
            module: "parts_and_billing",
            order_id: "WO-1047",
            parts_used: ["CAP-45-5-MFD ($68)"],
            labor_usd: 180,
            total_collected_usd: 248,
            payment_status: "PAID_ON_SITE"
          },
          armTitle: "Facturación en Sitio + Control de Piezas|On-Site Billing + Van Inventory",
          armSub: "Cero facturas olvidadas en el tablero de la camioneta|Zero unbilled parts or forgotten paper invoices",
          kpis: [
            ["Factura #1047|Invoice #1047", "$248 Cobrados|$248 Paid", "is-ok"],
            ["Inventario Van #02|Van #02 Stock", "-1 Capacitor 45/5", "is-gold"],
            ["Órdenes Hoy|Completed Today", "5 / 6 Pagadas|5 / 6 Paid", "is-ok"],
            ["Cuentas x Cobrar|UnpaidToday", "$0 Pendientes|$0 Pending", "is-ok"]
          ],
          actionBanner: "✓ Dinero conciliado al instante, pieza descontada de inventario móvil y siguiente cliente notificado.|✓ Payment reconciled, van stock updated, and next customer notified automatically."
        },
        {
          chip: "Agendar 18 mantenimientos anuales pendientes|Schedule 18 pending annual tune-ups",
          waUser: "¿Cuántas visitas de membresía anual nos faltan este mes para llenar huecos del martes?|How many annual membership tune-ups are left this month to fill Tuesday morning?",
          waBot: "Tienes 142 miembros activos ($2,698/mes recurrentes) y 18 visitas pendientes este mes. Agrupé 6 casas en la zona 40205/40207 para el martes por la mañana. ¿Preparo mensajes de confirmación?|You have 142 active plan members ($2,698/mo MRR) and 18 visits due this month. Clustered 6 homes in 40205/40207 for Tuesday morning. Draft confirmation texts?",
          intent: "RECURRING_PLAN_ROUTER",
          entity: "142 Planes · $2,698/m MRR",
          rule: "Agrupación por código postal|ZIP-Cluster Route Fill",
          sla: "1.0 seg · Membresías|1.0s · Memberships",
          json: {
            module: "maintenance_memberships",
            active_members: 142,
            mrr_usd: 2698,
            due_this_month: 18,
            clustered_zip_batch: ["40205", "40207"],
            tuesday_slots_filled: 6
          },
          armTitle: "Motor de Ingreso Recurrente (Membresías)|Recurring Maintenance Engine",
          armSub: "Convierte meses lentos en rutas rentables pre-pagadas|Turns slow Tuesdays into profitable clustered routes",
          kpis: [
            ["Clientes en Plan|Active Members", "142 Hogares|142 Homes", "is-ok"],
            ["Ingreso Fijo|Monthly MRR", "$2,698 / mes|$2,698 / mo", "is-gold"],
            ["Ruta Martes|Tuesday Cluster", "6 Visitas (40205)", "is-ok"],
            ["Retención Anual|Plan Retention", "Activa · Auto|Active · Auto", "is-ok"]
          ],
          actionBanner: "✓ 6 visitas agrupadas en un radio de 3.2 millas para maximizar horas facturables por técnico.|✓ 6 tune-ups clustered within 3.2 miles to maximize billable tech hours."
        }
      ]
    },
    transporte: {
      tab: "Logística & Flotas|Freight & Fleet",
      company: "Falls City Freight",
      domain: "app.fallscityfreight.com",
      role: "Operaciones & DOT|Dispatch & DOT Fleet",
      scenarios: [
        {
          chip: "Entregar carga #3381 con POD y facturar a broker|Deliver Load #3381 with POD & invoice broker",
          waUser: "Yasmany acaba de subir el BOL/POD firmado en Nashville de la carga #3381 ($1,150). Pásala a cobro.|Yasmany just uploaded the signed POD in Nashville for Load #3381 ($1,150). Push it to billing.",
          waBot: "Carga #3381 (Louisville → Nashville · Camión #104) marcada Entregada. POD verificado, factura por $1,150 generada para Midwest Freight Co. y $322 (28% linehaul) acreditados a la liquidación de Yasmany.|Load #3381 (Louisville → Nashville · Truck #104) marked Delivered. POD verified, $1,150 invoice queued for Midwest Freight Co., and $322 (28% linehaul) credited to Yasmany's settlement.",
          intent: "POD_TO_BROKER_INVOICE",
          entity: "Carga #3381 · Camión #104",
          rule: "POD firmado → Factura + 28% Chofer|Signed POD → Invoice + 28% Split",
          sla: "1.1 seg · Cargas & Cobro|1.1s · Loads & Billing",
          json: {
            module: "freight_billing_pod",
            load_id: "LD-3381",
            lane: "SDF_to_BNA",
            linehaul_usd: 1150,
            driver: "Yasmany R. (#104)",
            driver_pay_usd: 322,
            broker_invoice: "READY_TO_SEND"
          },
          armTitle: "Del Camión a Facturación en Segundos|Cab-to-Broker Invoicing in Seconds",
          armSub: "El chofer manda foto por WhatsApp; el sistema factura y calcula su pago|Driver texts POD photo; system bills broker and logs driver pay",
          kpis: [
            ["Tarifa Carga #3381|Load #3381 Rate", "$1,150", "is-gold"],
            ["Pago Chofer (28%)|Driver Share (28%)", "$322 Acreditados|$322 Credited", "is-ok"],
            ["Documento POD|POD Verification", "Firmado · OK|Signed · OK", "is-ok"],
            ["Ciclo Facturación|Billing Delay", "0 días (Hoy)|0 days (Same-day)", "is-ok"]
          ],
          actionBanner: "✓ Paquete de factura (Rate Con + POD firmado) listo para enviar a Midwest Freight sin papeleo manual.|✓ Complete invoice packet (Rate Con + signed POD) queued for Midwest Freight."
        },
        {
          chip: "Calcular liquidación semanal de choferes + diésel|Run Friday driver settlement + fuel deductions",
          waUser: "Cierra la nómina de choferes de esta semana descontando las tarjetas de diésel.|Close this week's driver settlement after deducting fuel card charges.",
          waBot: "Liquidación semanal calculada en 4 choferes: Bruto acumulado $12,090 − $2,680 de diésel conciliado = Neto a dispersar este viernes: $9,410 (Yasmany $2,850 · Ernesto $2,280 · Reynaldo $2,190 · Luis $2,090).|Weekly settlement calculated across 4 drivers: Gross $12,090 − $2,680 reconciled fuel cards = Friday Net Payout: $9,410 (Yasmany $2,850 · Ernesto $2,280 · Reynaldo $2,190 · Luis $2,090).",
          intent: "DRIVER_SETTLEMENT_ENGINE",
          entity: "Nómina Viernes · 4 Camiones",
          rule: "Esquema mixto (% y $/mi) − Diésel|Mixed Pay (% & $/mi) − Fuel",
          sla: "0.6 seg · Liquidaciones|0.6s · Settlements",
          json: {
            module: "driver_settlements",
            drivers_count: 4,
            gross_pay_usd: 12090,
            fuel_deductions_usd: 2680,
            net_friday_payout_usd: 9410,
            time_saved: "5.5_hours_friday_excel"
          },
          armTitle: "Liquidación Viernes (Millas, % y Diésel)|Friday Driver Settlement Engine",
          armSub: "Combina esquemas por milla y porcentaje sin errores manuales|Handles per-mile and percentage pay models simultaneously",
          kpis: [
            ["Bruto Semanal|Weekly Gross", "$12,090", ""],
            ["Descuento Diésel|Fuel Deducted", "-$2,680", "is-warn"],
            ["Neto a Pagar|Friday Net Payout", "$9,410", "is-ok"],
            ["Tiempo de Cierre|Admin Time", "4 seg vs. 6 hrs", "is-gold"]
          ],
          actionBanner: "✓ Recibos individuales generados en PDF para cada chofer con detalle de cargas y tickets de diésel.|✓ Individual PDF settlement statements generated per driver with load & fuel breakdown."
        },
        {
          chip: "Auditar vencimientos DOT y cartera vencida|Audit DOT expirations & aging receivables",
          waUser: "¿Tenemos algún chofer con documentos por vencer o facturas de brokers atrasadas?|Any driver compliance docs expiring soon or overdue broker invoices?",
          waBot: "Dos alertas activas: 1) Certificado Médico DOT de Reynaldo G. (Camión #108) vence en 11 días; 2) Apex Logistics tiene 2 facturas con 34 días de atraso ($3,920 de $18,640 totales en cartera).|Two active alerts: 1) Reynaldo G. (Truck #108) DOT Medical Card expires in 11 days; 2) Apex Logistics has 2 invoices at 34 days aging ($3,920 out of $18,640 total AR).",
          intent: "DOT_COMPLIANCE_AND_AR",
          entity: "Flota DOT + Cartera $18.6K",
          rule: "Bloqueo DOT <15d + Cobranza >30d|DOT Guard <15d + AR >30d",
          sla: "0.8 seg · Auditoría DOT|0.8s · DOT & AR Audit",
          json: {
            module: "dot_and_receivables",
            dot_warning_driver: "Reynaldo G. (#108)",
            dot_days_remaining: 11,
            total_open_ar_usd: 18640,
            overdue_30d_broker: "Apex Logistics ($3,920)"
          },
          armTitle: "Semáforo DOT + Cartera de Brokers|DOT Compliance + Broker Aging Radar",
          armSub: "Evita multas en carretera y protege el flujo de caja|Prevents roadside out-of-service fines and protects cashflow",
          kpis: [
            ["Alerta DOT|DOT Expiration", "Reynaldo · 11 días|Reynaldo · 11d", "is-warn"],
            ["Cartera Total|Open Broker AR", "$18,640 (9 fact.)", "is-gold"],
            ["Vencido >30 días|Overdue >30d", "$3,920 (Apex)", "is-warn"],
            ["Resto de Flota|Other Trucks", "100% Vigente|100% Compliant", "is-ok"]
          ],
          actionBanner: "✓ Recordatorio de cita médica enviado a Reynaldo y estado de cuenta preparado para Apex Logistics.|✓ Medical renewal reminder queued for Reynaldo and aging statement drafted for Apex Logistics."
        }
      ]
    }
  };

  var dcState = {
    ind: "construccion",
    idx: 0,
    mode: "custom", // 'custom' | 'generic'
    customOverride: null,
    apiLive: false
  };

  function buildCustomScenario(text) {
    var lower = text.toLowerCase();
    var targetInd = dcState.ind;
    if (/casa|mls|broker|agente|propiedad|realtor|closing|cierre|fha/i.test(lower)) targetInd = "realestate";
    else if (/fuga|aire|hvac|plom|tecnico|técnico|calentador|leak|drain/i.test(lower)) targetInd = "servicios";
    else if (/camion|camión|carga|chofer|dot|diesel|diésel|broker|truck|load/i.test(lower)) targetInd = "transporte";
    else if (/techo|siding|obra|margen|factura|cuadrilla|roof|gutter/i.test(lower)) targetInd = "construccion";

    dcState.ind = targetInd;
    var cur = DC_DATA[targetInd];
    return {
      isCustomInput: true,
      waUserRaw: text,
      waUser: text,
      waBot: "Mensaje procesado en el motor de " + cur.company + " (" + cur.domain + "): solicitud clasificada, cruzada contra tus registros activos y lista para ejecutar con aprobación de administrador.|Message processed inside " + cur.company + " (" + cur.domain + "): request classified, cross-checked against your live records, and queued for admin confirmation.",
      intent: "CUSTOM_LIVE_COMMAND",
      entity: cur.company,
      rule: "Reglas propias del negocio|Proprietary Business Rules",
      sla: dcState.apiLive ? "Motor DML Live|DML Engine Live" : "0.8 seg · Simulación|0.8s · Deterministic",
      json: {
        domain: cur.domain,
        raw_input: text.slice(0, 90),
        industry_engine: targetInd,
        seat_license_cost_usd: 0,
        execution_mode: "HUMAN_IN_THE_LOOP_READY"
      },
      armTitle: "Comando Procesado en Tu Propio Sistema|Command Routed to Your Proprietary OS",
      armSub: cur.company + " · " + cur.domain + "|" + cur.company + " · " + cur.domain,
      kpis: [
        ["Dominio Activo|Active Domain", cur.domain.replace("app.", ""), "is-gold"],
        ["Cobertura Operativa|Workflow Fit", "100% A Medida|100% Bespoke", "is-ok"],
        ["Costo por Usuario|Per-User Cost", "$0 / mes|$0 / mo", "is-ok"],
        ["Propiedad de Datos|Data Ownership", "100% Tuya|100% Yours", "is-gold"]
      ],
      actionBanner: "✓ En producción, este comando consulta tu base de datos real desde WhatsApp sin exponer información a terceros.|✓ In production, this command queries your live database via WhatsApp with full role permissions."
    };
  }

  function renderDemoVivo() {
    var rootEl = d.getElementById("dml-console");
    if (!rootEl) return;

    var curInd = DC_DATA[dcState.ind] || DC_DATA.construccion;
    var sc = dcState.customOverride || curInd.scenarios[dcState.idx] || curInd.scenarios[0];
    var isGen = dcState.mode === "generic";

    rootEl.classList.toggle("is-generic", isGen);

    var domTxt = d.getElementById("dc-domain-txt");
    if (domTxt) {
      domTxt.textContent = isGen
        ? L("app.generic-crm-cloud.com · $129/usuario/mes|app.generic-crm-cloud.com · $129/user/mo")
        : curInd.domain + " · " + L("Tu marca · $0/usuario|Your brand · $0/seat");
    }

    var engBadge = d.getElementById("dc-engine-badge");
    if (engBadge) {
      engBadge.className = "dc-engine-badge" + (dcState.apiLive ? "" : " is-sim");
      engBadge.innerHTML = "<i></i><span>" + (dcState.apiLive
        ? L("MOTOR IA CONECTADO|LIVE AI ENGINE")
        : L("DEMO INTERACTIVA · DATOS REALISTAS|INTERACTIVE DEMO · REALISTIC DATA")) + "</span>";
    }

    rootEl.querySelectorAll("[data-dc-mode]").forEach(function (b) {
      var active = b.getAttribute("data-dc-mode") === dcState.mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });

    // Industry buttons
    var indWrap = d.getElementById("dc-ind-btns");
    if (indWrap) {
      indWrap.innerHTML = "";
      Object.keys(DC_DATA).forEach(function (k) {
        var b = ce("button", "dc-ind-btn" + (k === dcState.ind ? " is-active" : ""), L(DC_DATA[k].tab));
        b.type = "button";
        b.setAttribute("aria-pressed", k === dcState.ind ? "true" : "false");
        b.addEventListener("click", function () {
          dcState.ind = k;
          dcState.idx = 0;
          dcState.customOverride = null;
          renderDemoVivo();
        });
        indWrap.appendChild(b);
      });
    }

    // Scenario chips
    var chipsWrap = d.getElementById("dc-chips");
    if (chipsWrap) {
      chipsWrap.innerHTML = "";
      curInd.scenarios.forEach(function (item, i) {
        var active = !dcState.customOverride && i === dcState.idx;
        var c = ce("button", "dc-chip" + (active ? " is-active" : ""), "0" + (i + 1) + " · " + L(item.chip));
        c.type = "button";
        c.setAttribute("aria-pressed", active ? "true" : "false");
        c.addEventListener("click", function () {
          dcState.idx = i;
          dcState.customOverride = null;
          renderDemoVivo();
        });
        chipsWrap.appendChild(c);
      });
    }

    // Col 1: WhatsApp
    var waTitle = d.getElementById("dc-wa-title");
    var waSub = d.getElementById("dc-wa-sub");
    var waFeed = d.getElementById("dc-wa-feed");
    if (waTitle) waTitle.textContent = isGen ? "Standard CRM Bot" : curInd.company + " · ARM";
    if (waSub) waSub.textContent = isGen ? L("Sin acceso a módulos operativos|No access to operational modules") : L(curInd.role);
    if (waFeed) {
      waFeed.innerHTML = "";
      var uBub = ce("div", "dc-bub is-user");
      uBub.textContent = sc.isCustomInput ? String(sc.waUserRaw || "") : L(sc.waUser);
      uBub.appendChild(ce("span", "dc-bub-meta", L("Tú · WhatsApp|You · WhatsApp") + " ✓✓"));

      var bBub = ce("div", "dc-bub is-bot");
      var botReply = isGen
        ? L("Solo tengo acceso a Contactos y Deals básicos. No puedo leer facturas OCR, calcular márgenes de obra, auditar documentos ni liquidar comisiones o choferes en este CRM.|I only have access to basic Contacts and Deals. I cannot scan OCR invoices, check job margins, audit compliance files, or calculate splits/settlements in this CRM.")
        : L(sc.waBot);
      bBub.textContent = botReply;
      bBub.appendChild(ce("span", "dc-bub-meta", isGen ? "Generic Bot · Error" : "ARM + IA · ✓"));
      waFeed.appendChild(uBub);
      waFeed.appendChild(bBub);
    }

    // Col 2: Brain & Rules
    var kvIntent = d.getElementById("dc-kv-intent");
    var kvEntity = d.getElementById("dc-kv-entity");
    var kvRule = d.getElementById("dc-kv-rule");
    var kvSla = d.getElementById("dc-kv-sla");
    var jsonBox = d.getElementById("dc-json");
    if (kvIntent) kvIntent.textContent = isGen ? "UNSUPPORTED_MODULE" : sc.intent;
    if (kvEntity) kvEntity.textContent = isGen ? "Deal Stage Only" : sc.entity;
    if (kvRule) kvRule.textContent = isGen ? L("Sin reglas del giro|No industry rules") : L(sc.rule);
    if (kvSla) kvSla.textContent = isGen ? L("Manual en Excel|Manual in Excel") : L(sc.sla);
    if (jsonBox) {
      jsonBox.textContent = JSON.stringify(isGen ? {
        crm_type: "rented_saas_per_seat",
        workflow_coverage: "25%",
        missing_modules: ["estimating_bom", "crew_dispatch", "commission_splits", "dot_settlements"],
        fallback: "manual_spreadsheets_and_loose_whatsapp"
      } : sc.json, null, 2);
    }

    // Col 3: ARM Impact
    var armTitle = d.getElementById("dc-arm-title");
    var armSub = d.getElementById("dc-arm-sub");
    var kpiRow = d.getElementById("dc-kpi-row");
    var banner = d.getElementById("dc-action-banner");
    if (armTitle) {
      armTitle.textContent = isGen
        ? L("75% de tu operación queda fuera del CRM|75% of Your Operation Stays Outside the CRM")
        : L(sc.armTitle);
    }
    if (armSub) {
      armSub.textContent = isGen
        ? L("Pagas licencias cada mes y aun así terminas operando en Excel y libretas|You pay monthly seat fees and still run operations in spreadsheets")
        : L(sc.armSub);
    }
    if (kpiRow) {
      kpiRow.innerHTML = "";
      var kpis = isGen ? [
        ["Cobertura Real|Workflow Fit", "25% Genérico|25% Generic", "is-warn"],
        ["Renta Mensual (20 u.)|20-User Seat Tax", "$2,580 / mes|$2,580 / mo", "is-warn"],
        ["Datos de Obra/Flota|Field & Ops Data", "En Excel suelto|Stuck in Excel", "is-warn"],
        ["Dueño del Código|Code Ownership", "0% (Alquilado)|0% (Rented)", ""]
      ] : sc.kpis;
      kpis.forEach(function (k) {
        var cell = ce("div", "dc-kpi");
        cell.innerHTML = "<small>" + L(k[0]) + '</small><b class="' + (k[2] || "") + '">' + L(k[1]) + "</b>";
        kpiRow.appendChild(cell);
      });
    }
    if (banner) {
      banner.textContent = isGen
        ? L("✕ Este CRM genérico solo guarda nombres y teléfonos. Cambia arriba a «Tu Propio ARM + IA (100%)» para ver la diferencia.|✕ Generic CRMs only store names and stages. Switch above to “Your Custom ARM + AI (100%)” to see the difference.")
        : L(sc.actionBanner);
    }

    // Update deep link to /software?ind=...#tu-software
    var deepLink = d.getElementById("dc-deep-software");
    if (deepLink) {
      deepLink.setAttribute("href", "/software?ind=" + encodeURIComponent(dcState.ind) + "#tu-software");
      deepLink.textContent = L("Abrir simulador completo de 6 industrias →|Open full 6-industry ARM simulator →");
    }
  }

  function initDemoVivo() {
    var rootEl = d.getElementById("dml-console");
    if (!rootEl) return;

    rootEl.querySelectorAll("[data-dc-mode]").forEach(function (b) {
      b.addEventListener("click", function () {
        dcState.mode = b.getAttribute("data-dc-mode") || "custom";
        renderDemoVivo();
      });
    });

    var form = d.getElementById("dc-custom-form");
    var input = d.getElementById("dc-custom-input");
    if (form && input) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var val = (input.value || "").trim();
        if (!val) return;
        dcState.mode = "custom";
        dcState.customOverride = buildCustomScenario(val);
        input.value = "";
        renderDemoVivo();
      });
    }

    renderDemoVivo();
  }

  /* ---------- 5. 360° Strategic Case Anatomy (#anatomia) ---------- */
  var ANAT_CASES = [
    {
      id: "newera",
      tab: "01 · New Era Real Estate",
      client: "New Era Real Estate",
      sector: "Brokerage Inmobiliario Bilingüe · Kentucky|Bilingual Real Estate Brokerage · Kentucky",
      cls: "live",
      problemTitle: "Marca desconectada de la velocidad comercial|Brand Disconnected from Sales Velocity",
      problemBody: "En bienes raíces, tener un logotipo elegante no sirve si la web parece plantilla de franquicia y los leads tardan horas en recibir respuesta en su idioma.|In real estate, a polished logo fails if the website looks like a franchise template and bilingual leads wait hours for a response.",
      strategyTitle: "Identidad + Plataforma Viva + IA en un solo frente|Identity + Live Platform + AI Built as One",
      strategyBody: "En lugar de contratar tres proveedores aislados, diseñamos una sola arquitectura: identidad geométrica carmesí y oro, plataforma web con patrón SVG reactivo y suite ARM omnicanal.|Instead of hiring three disconnected vendors, we engineered one unified system: crimson-and-gold identity, reactive SVG web platform, and an omnichannel AI ARM suite.",
      builtTitle: "Ecosistema completo operando en producción|Full Ecosystem Running in Production",
      builtBody: "Desde el pin metálico en la solapa y el poste de venta exterior hasta la atención automatizada por IA sincronizada con el inventario de propiedades.|From metallic lapel pins and yard signs to automated bilingual AI lead qualification synced with property listings.",
      deliverables: [
        "Identidad & Universo Físico (#19)|Physical & Visual Identity (#19)",
        "Plataforma Web neweraky.com|Web Platform neweraky.com",
        "Patrón Hexagonal SVG Vivo|Live SVG Geometric Pattern",
        "Suite ARM de IA Omnicanal|Omnichannel AI ARM Suite"
      ],
      primaryStage: "newera",
      primaryLabel: "Inspeccionar Plataforma & Marca +|Inspect Platform & Brand +",
      secondaryStage: "software",
      secondaryLabel: "Ver Demo de su Suite IA +|Watch AI Suite Demo +",
      extUrl: "https://www.neweraky.com/",
      extLabel: "neweraky.com ↗"
    },
    {
      id: "barba",
      tab: "02 · Barba Construction",
      client: "Barba Construction · ARM Pro",
      sector: "Construcción & Contratistas · Operaciones|Construction & General Contracting · Operations",
      cls: "live",
      problemTitle: "Ceguera financiera entre presupuesto y nómina|Financial Blindness Between Bids & Payroll",
      problemBody: "Cuando los recibos de materiales quedan en camionetas y las horas se apuntan en papel, el dueño descubre si ganó o perdió dinero semanas después de entregar la obra.|When supplier receipts stay in truck cabs and crew hours live on paper, owners find out whether a job made money weeks after completion.",
      strategyTitle: "Software adaptado al terreno, no al revés|Software Built Around the Jobsite",
      strategyBody: "Reemplazamos hojas sueltas y CRMs genéricos por un ERP/ARM propietario diseñado exactamente alrededor de presupuestos, facturas de proveedores y cuadrillas.|We replaced scattered spreadsheets and generic CRMs with a proprietary ARM ERP built specifically around estimates, supplier invoices, and crews.",
      builtTitle: "Centro de comando financiero y operativo|Financial & Field Command Center",
      builtBody: "Generador de presupuestos con márgenes en tiempo real, lectura OCR con IA para recibos de materiales, control de subcontratistas y liquidación de nómina por proyecto.|Live-margin estimate builder, AI OCR receipt scanning, subcontractor tracking, and per-project payroll settlement.",
      deliverables: [
        "Centro de Comando Financiero|Financial Command Center",
        "Presupuestos con Margen Vivo|Live-Margin Estimator",
        "Escaneo OCR de Facturas con IA|AI OCR Invoice Scanner",
        "Nómina por Proyecto y Contratista|Per-Job Crew Payroll"
      ],
      primaryStage: "barba",
      primaryLabel: "Ver Sistema Barba ARM Pro +|Inspect Barba ARM Pro +",
      secondaryHref: "/software?ind=construccion#tu-software",
      secondaryLabel: "Probar Módulo de Construcción →|Try Construction Simulator →"
    },
    {
      id: "lucky",
      tab: "03 · Lucky Shaker",
      client: "Lucky Shaker Supply",
      sector: "Bebidas Artesanales & E-Commerce · Shopify|Craft Canned Cocktails & E-Commerce · Shopify",
      cls: "live",
      problemTitle: "Vender sabor y atmósfera a través de una pantalla|Selling Taste & Atmosphere Through a Screen",
      problemBody: "Un cóctel artesanal en lata y un servicio de barra móvil compiten por percepción: una tienda estándar de bloques blancos mata el valor del producto.|Craft canned cocktails and private mobile bars compete on perceived craft — a flat white-grid store kills product desire.",
      strategyTitle: "Cine a 60fps + Código interactivo sin sacrificar rapidez|60fps Cinema + Fast Interactive Code",
      strategyBody: "Dirigimos y rodamos secuencias reales de producto a 60fps y programamos profundidad de campo interactiva sobre una arquitectura Shopify lista para convertir.|We directed real 60fps product sequences and coded interactive depth-of-field layers on top of a fast production Shopify architecture.",
      builtTitle: "Flagship digital memorable desde el primer segundo|A Flagship Store You Remember Instantly",
      builtBody: "Experiencia diferenciada para mobile (9:16) y desktop (16:9), catálogo de latas y flujo directo de contratación para eventos.|Tailored 9:16 mobile and 16:9 desktop sequences, product showcase, and event bar booking.",
      deliverables: [
        "Dirección Creativa & Set 60fps|Creative Direction & 60fps Shoot",
        "Arquitectura Shopify a Medida|Bespoke Shopify Engineering",
        "Física Interactiva de Ingredientes|Interactive Ingredient Physics",
        "Experiencia Dual Mobile/Desktop|Dual 9:16 & 16:9 Experience"
      ],
      primaryStage: "lucky",
      primaryLabel: "Abrir Experiencia Lucky Shaker +|Open Lucky Shaker Experience +",
      extUrl: "https://luckyshakersupply.com/",
      extLabel: "luckyshakersupply.com ↗"
    }
  ];

  var anatIdx = 0;

  function renderAnatomia() {
    var wrap = d.getElementById("anat-mount");
    if (!wrap) return;
    wrap.setAttribute("role", "tabpanel");
    var tabsEl = d.getElementById("anat-tabs");
    var c = ANAT_CASES[anatIdx] || ANAT_CASES[0];

    if (tabsEl) {
      tabsEl.innerHTML = "";
      ANAT_CASES.forEach(function (it, idx) {
        var b = ce("button", "anat-tab" + (idx === anatIdx ? " is-active" : ""), it.tab);
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-controls", "anat-mount");
        b.setAttribute("aria-selected", idx === anatIdx ? "true" : "false");
        b.addEventListener("click", function () {
          anatIdx = idx;
          renderAnatomia();
        });
        tabsEl.appendChild(b);
      });
    }

    var delivHtml = c.deliverables.map(function (item) {
      return "<li>" + L(item) + "</li>";
    }).join("");

    wrap.innerHTML =
      '<div class="anat-top">' +
        '<div>' +
          '<h3 class="anat-client">' + c.client + '</h3>' +
          '<p class="anat-sector">' + L(c.sector) + '</p>' +
        '</div>' +
        '<span class="cls-badge cls-live">' + clsLabel(c.cls) + '</span>' +
      '</div>' +
      '<div class="anat-cols">' +
        '<div class="anat-col">' +
          '<span class="anat-step">' + L("01 / El Problema Real|01 / The Real Bottleneck") + '</span>' +
          '<h4>' + L(c.problemTitle) + '</h4>' +
          '<p>' + L(c.problemBody) + '</p>' +
        '</div>' +
        '<div class="anat-col">' +
          '<span class="anat-step">' + L("02 / Decisión Estratégica|02 / Strategic Architecture") + '</span>' +
          '<h4>' + L(c.strategyTitle) + '</h4>' +
          '<p>' + L(c.strategyBody) + '</p>' +
        '</div>' +
        '<div class="anat-col">' +
          '<span class="anat-step">' + L("03 / Ecosistema Entregado|03 / Delivered System") + '</span>' +
          '<h4>' + L(c.builtTitle) + '</h4>' +
          '<p>' + L(c.builtBody) + '</p>' +
          '<ul class="anat-deliverables">' + delivHtml + '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="anat-foot">' +
        '<span class="dc-foot-note">' + L("Cero métricas inventadas: toca para inspeccionar las interfaces, videos y sistemas reales.|Zero invented metrics: inspect the actual production interfaces, films, and live URLs.") + '</span>' +
        '<div class="anat-actions" id="anat-actions"></div>' +
      '</div>';

    var actWrap = d.getElementById("anat-actions");
    if (actWrap) {
      if (c.primaryStage) {
        var pb = ce("button", "dc-link-btn", L(c.primaryLabel));
        pb.type = "button";
        pb.addEventListener("click", function () {
          if (window.__DML_STAGE_API && window.__DML_STAGE_API.open) {
            window.__DML_STAGE_API.open(c.primaryStage);
          }
        });
        actWrap.appendChild(pb);
      }
      if (c.secondaryStage) {
        var sb = ce("button", "dc-link-btn is-sec", L(c.secondaryLabel));
        sb.type = "button";
        sb.addEventListener("click", function () {
          if (window.__DML_STAGE_API && window.__DML_STAGE_API.open) {
            window.__DML_STAGE_API.open(c.secondaryStage);
          }
        });
        actWrap.appendChild(sb);
      }
      if (c.secondaryHref) {
        var sa = ce("a", "dc-link-btn is-sec", L(c.secondaryLabel));
        sa.href = c.secondaryHref;
        actWrap.appendChild(sa);
      }
      if (c.extUrl) {
        var ea = ce("a", "dc-link-btn is-sec", c.extLabel);
        ea.href = c.extUrl;
        ea.target = "_blank";
        ea.rel = "noopener";
        actWrap.appendChild(ea);
      }
    }
  }

  /* ---------- 6. Shared Modals (#ar-portal, #sheet-modal, Contact, Tools) ---------- */
  var AR_TAB_I18N = {
    web: {
      tab: "01 / La Web Flotando 3D|01 / 3D Floating Showcase",
      badge: "3D · Instalación Espacial DML|3D · DML Spatial Installation",
      title: "Coloca este ecosistema <em>en tu espacio.</em>|Place this ecosystem <em>in your space.</em>",
      copy: "Apunta la cámara de tu iPhone o Android al piso o a una mesa de juntas para anclar la instalación 3D de <strong>Dame la Letra</strong> a escala real y recorrer sus sistemas y marcas.|Point your iPhone or Android camera at a conference table or floor to anchor <strong>Dame la Letra’s</strong> 3D spatial installation at real scale."
    },
    mayor: {
      tab: "02 / Monumento Cívico 3D|02 / Civic Monument 3D",
      badge: "3D · Monumento Ciudad de Lynnview|3D · City of Lynnview Monument",
      title: "Monumento Cívico <em>en escala real.</em>|Civic Monument <em>at true scale.</em>",
      copy: "Coloca en Realidad Aumentada la maqueta 3D del <strong>Monumento y Plaza Cívica de la Ciudad de Lynnview</strong> (monolito en piedra, placa en bronce, muros curvos y astas).|Anchor the 3D architectural model of the <strong>City of Lynnview Civic Plaza & Monument</strong> in Augmented Reality on your desk or floor."
    },
    casa: {
      tab: "03 / Volumetría Residencial|03 / Residential Massing",
      badge: "3D · Residencia 2 Niveles|3D · 2-Story Residence",
      title: "Volumetría 3D <em>sobre tu mesa.</em>|3D Massing <em>on your table.</em>",
      copy: "Inspecciona proporciones espaciales y volumetría 3D desde tu teléfono sin abrir software de ingeniería.|Inspect spatial proportions and 3D massing straight from your phone with zero CAD software."
    },
    porche: {
      tab: "04 / Estructura 3D|04 / 3D Timber Frame",
      badge: "3D · Cubierta Estructural|3D · Structural Canopy",
      title: "Detalle estructural <em>en AR.</em>|Structural detail <em>in AR.</em>",
      copy: "Recorre la estructura y cubierta 3D en Realidad Aumentada a escala desde cualquier ángulo.|Walk around the 3D structural canopy in Augmented Reality from any angle."
    }
  };

  function applySharedTranslations() {
    // 1. Declarative text & html attributes
    d.querySelectorAll("[data-es]").forEach(function (el) {
      el.textContent = dmlLang === "en" ? (el.getAttribute("data-en") || el.getAttribute("data-es")) : el.getAttribute("data-es");
    });
    d.querySelectorAll("[data-html-es]").forEach(function (el) {
      var h = dmlLang === "en" ? (el.getAttribute("data-html-en") || el.getAttribute("data-html-es")) : el.getAttribute("data-html-es");
      setSmartRichHtml(el, h);
    });
    d.querySelectorAll("[data-aria-es]").forEach(function (el) {
      el.setAttribute("aria-label", dmlLang === "en" ? el.getAttribute("data-aria-en") : el.getAttribute("data-aria-es"));
    });
    d.querySelectorAll(".proj .proj-media").forEach(function (btn) {
      if (btn.hasAttribute("data-aria-es")) return;
      if (!btn.hasAttribute("data-orig-aria-es")) {
        btn.setAttribute("data-orig-aria-es", btn.getAttribute("aria-label") || "");
      }
      if (dmlLang === "en") {
        var proj = btn.closest(".proj");
        var tEl = proj && proj.querySelector(".proj-t");
        var tTxt = tEl ? tEl.textContent.trim() : "project";
        btn.setAttribute("aria-label", "Explore interactive showcase: " + tTxt);
      } else {
        btn.setAttribute("aria-label", btn.getAttribute("data-orig-aria-es"));
      }
    });
    d.querySelectorAll("[data-placeholder-es]").forEach(function (el) {
      el.setAttribute("placeholder", dmlLang === "en" ? el.getAttribute("data-placeholder-en") : el.getAttribute("data-placeholder-es"));
    });

    // 2. Hero H1
    updateHeroTitle(dmlLang);

    // 3. Top AR pill & back links
    d.querySelectorAll(".ar-pill").forEach(function (b) {
      b.setAttribute("aria-label", L("Experiencia espacial en Realidad Aumentada|Spatial Augmented Reality Experience"));
      b.innerHTML = "<i>✦</i> " + L("Experiencia AR|Spatial AR");
    });
    d.querySelectorAll(".sub-back").forEach(function (a) {
      a.innerHTML = '<span aria-hidden="true">←</span> ' + L("Inicio|Home");
    });

    // 4. Classification badges rendered statically in cards
    d.querySelectorAll(".cls-badge.cls-live").forEach(function (b) {
      b.textContent = clsLabel("live");
    });
    d.querySelectorAll(".cls-badge.cls-lab").forEach(function (b) {
      b.textContent = clsLabel("lab");
    });

    // 5. Marquee & Motion controls
    var mBtn = d.querySelector("[data-marquee-btn]");
    var rail = d.getElementById("marcas");
    if (mBtn) {
      var paused = rail && rail.classList.contains("paused");
      mBtn.textContent = paused ? L("Reanudar|Resume") : L("Detener|Pause");
    }
    d.querySelectorAll("[data-toggle-motion]").forEach(function (mb) {
      var isOff = root.getAttribute("data-motion") === "off";
      mb.textContent = isOff ? L("Reanudar animaciones|Resume motion") : L("Pausar animaciones|Pause motion");
    });

    // 6. Contact section & WhatsApp links
    var waMsg = encodeURIComponent(
      dmlLang === "en"
        ? "Hi Miguel, I just explored Dame la Letra and would like to talk about a software, web, or brand project."
        : "Hola Miguel, acabo de explorar Dame la Letra y me gustaría conversar sobre un proyecto de software, web o branding."
    );
    d.querySelectorAll('[data-track="wa-hero"], [data-track="wa-contact"], [data-track="wa-fab"]').forEach(function (a) {
      a.setAttribute("href", "https://wa.me/15026587853?text=" + waMsg);
    });
    var fab = d.querySelector(".fab");
    if (fab) {
      fab.setAttribute("aria-label", L("Hablemos por WhatsApp|Let's talk on WhatsApp"));
      var svg = fab.querySelector("svg");
      fab.textContent = "";
      if (svg) fab.appendChild(svg);
      fab.appendChild(d.createTextNode(L("Hablemos|Let's talk")));
    }

    var cCopy = d.querySelector(".contact-copy");
    if (cCopy) {
      cCopy.textContent = L("¿Quieres construir software propio con IA, una plataforma digital de alto nivel o una marca que imponga autoridad? Conversémoslo directo.|Looking to build proprietary AI software, a flagship digital platform, or a brand that commands authority? Let's talk directly.");
    }
    var waContact = d.querySelector('[data-track="wa-contact"]');
    if (waContact) {
      var svgs = waContact.querySelectorAll("svg");
      if (svgs.length >= 2) {
        waContact.innerHTML = "";
        waContact.appendChild(svgs[0]);
        waContact.appendChild(d.createTextNode(" " + L("Hablemos por WhatsApp|Talk on WhatsApp") + " "));
        waContact.appendChild(svgs[1]);
      }
    }
    var igContact = d.querySelector('[data-track="ig-contact"]');
    if (igContact) {
      var igSvg = igContact.querySelector("svg");
      igContact.innerHTML = "";
      if (igSvg) igContact.appendChild(igSvg);
      igContact.appendChild(d.createTextNode(" " + L("Síguenos en Instagram|Follow on Instagram")));
    }
    var vcContact = d.querySelector('[data-track="vcard-contact"]');
    if (vcContact) {
      var vcSvg = vcContact.querySelector("svg");
      vcContact.innerHTML = "";
      if (vcSvg) vcContact.appendChild(vcSvg);
      vcContact.appendChild(d.createTextNode(" " + L("Guardar contacto (.vcf)|Save contact (.vcf)")));
    }
    var qrCap = d.querySelector(".contact-qr figcaption");
    if (qrCap) {
      qrCap.textContent = L("¿Estás en computadora? Escanea para abrir esta experiencia en tu teléfono.|On desktop? Scan to carry this interactive showcase on your phone.");
    }
    var tAr = d.querySelector(".contact-tools [data-toggle-ar]");
    if (tAr) tAr.textContent = L("✦ Experiencia espacial AR|✦ Spatial AR experience");
    var tShareAr = d.querySelector(".contact-tools [data-share-ar]");
    if (tShareAr) tShareAr.textContent = L("Compartir enlace AR|Share AR link");
    var tShare = d.querySelector(".contact-tools [data-share]");
    if (tShare) tShare.textContent = L("Compartir portafolio|Share showcase");
    var tQr = d.querySelector('.contact-tools a[href="/qr"]');
    if (tQr) tQr.textContent = L("Mostrar código QR|Show QR code");

    // 7. AR Portal translations
    var arPortal = d.getElementById("ar-portal");
    if (arPortal) {
      var arKicker = arPortal.querySelector(".ar-portal-kicker span");
      if (arKicker) arKicker.textContent = L("Experiencia Espacial 3D & Realidad Aumentada · iOS & Android|Spatial 3D & Augmented Reality Showcase · iOS & Android");
      arPortal.querySelectorAll(".stage-close[data-close-ar-portal]").forEach(function (b) {
        b.textContent = L("Cerrar [Esc]|Close [Esc]");
      });
      arPortal.querySelectorAll("[data-ar-key]").forEach(function (tab) {
        var key = tab.getAttribute("data-ar-key");
        var cfg = AR_TAB_I18N[key];
        if (!cfg) return;
        tab.textContent = L(cfg.tab);
        tab.setAttribute("data-ar-badge", L(cfg.badge));
        tab.setAttribute("data-ar-title", L(cfg.title));
        tab.setAttribute("data-ar-copy", L(cfg.copy));
        if (tab.classList.contains("active")) {
          var bEl = d.getElementById("ar-mv-badge");
          var tEl = d.getElementById("arp-title");
          var cEl = d.getElementById("arp-copy");
          if (bEl) bEl.textContent = L(cfg.badge);
          if (tEl) tEl.innerHTML = L(cfg.title);
          if (cEl) cEl.innerHTML = L(cfg.copy);
        }
      });
      var orbits = arPortal.querySelectorAll(".ar-mv-orbit");
      if (orbits.length >= 3) {
        orbits[0].textContent = L("Frente|Front");
        orbits[1].textContent = L("360° Isométrica|360° Isometric");
        orbits[2].textContent = L("Reverso|Back");
      }
      var steps = arPortal.querySelectorAll(".ar-steps li");
      if (steps.length >= 3) {
        steps[0].innerHTML = "<b>" + L("Paso 01|Step 01") + "</b><span>" + L("Toca <strong>«Colocar en tu espacio (Cámara AR)»</strong> desde tu iPhone o Android.|Tap <strong>“Place in your space (AR Camera)”</strong> on your iPhone or Android.") + "</span>";
        steps[1].innerHTML = "<b>" + L("Paso 02|Step 02") + "</b><span>" + L("Apunta al piso o mesa para anclar el modelo 3D a escala real.|Point at your floor or desk to anchor the 3D installation at true scale.") + "</span>";
        steps[2].innerHTML = "<b>" + L("Paso 03|Step 03") + "</b><span>" + L("Camina alrededor 360° o pellizca la pantalla para ajustar escala.|Walk around 360° or pinch to adjust scale.") + "</span>";
      }
      var launchBtn = arPortal.querySelector("[data-launch-native-ar]");
      if (launchBtn) {
        var lSvg = launchBtn.querySelector("svg");
        launchBtn.innerHTML = "";
        if (lSvg) launchBtn.appendChild(lSvg);
        launchBtn.appendChild(d.createTextNode(" " + L("✦ Colocar en tu espacio (Cámara AR)|✦ Place in your space (AR Camera)")));
      }
      var ghostClose = arPortal.querySelector(".btn-ghost[data-close-ar-portal]");
      if (ghostClose) ghostClose.textContent = L("Volver al portafolio|Back to showcase");
    }

    // 8. 32 Mini Branding Sets filters & CTA on /branding
    var bsetFilterMap = {
      all: "Todas las marcas (32)|All Brand Worlds (32)",
      construccion: "Construcción, Real Estate & Hogar (7)|Construction, Real Estate & Home (7)",
      gastronomia: "Gastronomía, Flores & Eventos (6)|Hospitality, Food, Floral & Events (6)",
      moda: "Moda, Joyería, Belleza & Foto (8)|Fashion, Fine Jewelry, Beauty & Photo (8)",
      motor: "Ciclismo, Autos & Deporte (5)|Cycling, Automotive & Sports (5)",
      servicios: "Salud, Educación, Legal & Tech (6)|Healthcare, EdTech, Legal & Software (6)"
    };
    d.querySelectorAll("[data-bset-filter]").forEach(function (bf) {
      var k = bf.getAttribute("data-bset-filter");
      if (bsetFilterMap[k]) bf.textContent = L(bsetFilterMap[k]);
    });
    d.querySelectorAll(".bset-cta").forEach(function (cta) {
      cta.innerHTML = L("Abrir Sistema de Marca|Inspect Brand System") + ' <span aria-hidden="true">→</span>';
    });

    // 9. Re-render dynamic interactive components
    renderDemoVivo();
    renderAnatomia();

    // 10. If #project-stage is currently open, refresh its badges & translations
    if (window.__DML_STAGE_API && window.__DML_STAGE_API.getCurrent) {
      var curId = window.__DML_STAGE_API.getCurrent();
      if (curId) enhanceOpenStage(curId);
    }
  }

  function setDmlLang(nextLang, fromTs) {
    dmlLang = nextLang === "en" ? "en" : "es";
    root.setAttribute("lang", dmlLang);
    try {
      localStorage.setItem("ts_lang", dmlLang);
    } catch (e) {}

    d.querySelectorAll("[data-dml-lang]").forEach(function (b) {
      var active = b.getAttribute("data-dml-lang") === dmlLang;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });

    // Sync with #tu-software on /software without infinite loop
    if (!fromTs && !syncingTs) {
      var tsBtn = d.querySelector('[data-ts-lang="' + dmlLang + '"]');
      if (tsBtn && !tsBtn.classList.contains("is-active")) {
        syncingTs = true;
        try { tsBtn.click(); } catch (e) {}
        syncingTs = false;
      }
    }

    applySharedTranslations();
  }

  /* ---------- 7. /software Query-Param Deep-Linker (?ind=realestate) ---------- */
  function initSoftwareDeepLink() {
    var tsSec = d.getElementById("tu-software");
    if (!tsSec) return;
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) { return; }
    var ind = params.get("ind");
    var validOrder = ["construccion", "realestate", "mortgage", "seguros", "servicios", "transporte"];
    var targetIdx = validOrder.indexOf(ind);
    if (targetIdx < 0) return;

    var applied = false;
    function trySelectIndustry() {
      if (applied) return true;
      var indList = d.getElementById("ts-ind-list");
      if (!indList) return false;
      var btns = indList.querySelectorAll(".ts-ind-btn");
      if (btns.length > targetIdx) {
        applied = true;
        btns[targetIdx].click();
        return true;
      }
      return false;
    }

    if (!trySelectIndustry()) {
      var obs = new MutationObserver(function () {
        if (trySelectIndustry()) obs.disconnect();
      });
      obs.observe(tsSec, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); }, 8000);
    }
  }

  /* ---------- 8. Boot & Event Listeners ---------- */
  function boot() {
    // Bind global ES | EN buttons
    d.querySelectorAll("[data-dml-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        setDmlLang(b.getAttribute("data-dml-lang"), false);
      });
    });

    // Listen to #tu-software internal language buttons so both stay 100% synced
    d.addEventListener("click", function (e) {
      var tsBtn = e.target && e.target.closest && e.target.closest("[data-ts-lang]");
      if (tsBtn && !syncingTs) {
        var l = tsBtn.getAttribute("data-ts-lang");
        if (l && l !== dmlLang) {
          syncingTs = true;
          setDmlLang(l, true);
          syncingTs = false;
        }
      }
    });

    // Listen to #project-stage open events
    window.addEventListener("dml:stageopen", function (ev) {
      if (ev && ev.detail && ev.detail.id) {
        enhanceOpenStage(ev.detail.id, true);
      }
    });

    // Keep marquee & motion button labels bilingual after clicks
    var mBtn = d.querySelector("[data-marquee-btn]");
    var mArea = d.querySelector("[data-marquee]");
    [mBtn, mArea].filter(Boolean).forEach(function (el) {
      el.addEventListener("click", function () {
        setTimeout(function () {
          var rail = d.getElementById("marcas");
          if (mBtn && rail) {
            mBtn.textContent = rail.classList.contains("paused") ? L("Reanudar|Resume") : L("Detener|Pause");
          }
        }, 10);
      });
    });
    d.querySelectorAll("[data-toggle-motion]").forEach(function (mb) {
      mb.addEventListener("click", function () {
        setTimeout(function () {
          var isOff = root.getAttribute("data-motion") === "off";
          mb.textContent = isOff ? L("Reanudar animaciones|Resume motion") : L("Pausar animaciones|Pause motion");
        }, 10);
      });
    });

    initDemoVivo();
    renderAnatomia();
    initSoftwareDeepLink();
    setDmlLang(dmlLang, false);

    window.__DML_EVOLUTION = {
      setLang: function (l) { setDmlLang(l, false); },
      getLang: function () { return dmlLang; }
    };
  }

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
