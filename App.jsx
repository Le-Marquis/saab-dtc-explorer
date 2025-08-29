import React, { useEffect, useMemo, useState } from 'react'

// --- Minimal i18n helper -----------------------------------------------------
const messages = {
  fr: {
    title: "Saab DTC Explorer",
    searchPlaceholder: "Rechercher par code, intitulé ou système (ex: P0300, CIM)",
    filters: "Filtres",
    model: "Modèle",
    severity: "Gravité",
    any: "Toutes",
    results: "résultat(s)",
    dtc: "Code défaut",
    system: "Système",
    criteriaActivation: "Critères d’activation",
    faultCriteria: "Critères de défaut",
    systemReaction: "Réaction du système",
    harnessChecks: "Contrôles faisceau",
    diagHelp: "Aide au diagnostic",
    oemProc: "Procédure OEM",
    close: "Fermer",
    copyLink: "Copier le lien",
    toastCopied: "Lien copié !",
    empty: "Aucun résultat",
  },
  en: {
    title: "Saab DTC Explorer",
    searchPlaceholder: "Search by code, title, or system (e.g., P0300, CIM)",
    filters: "Filters",
    model: "Model",
    severity: "Severity",
    any: "Any",
    results: "result(s)",
    dtc: "DTC",
    system: "System",
    criteriaActivation: "Activation criteria",
    faultCriteria: "Fault criteria",
    systemReaction: "System reaction",
    harnessChecks: "Harness checks",
    diagHelp: "Diagnostic help",
    oemProc: "OEM procedure",
    close: "Close",
    copyLink: "Copy link",
    toastCopied: "Link copied!",
    empty: "No results",
  },
  pl: {
    title: "Saab DTC Explorer",
    searchPlaceholder: "Szukaj po kodzie, tytule lub systemie (np. P0300, CIM)",
    filters: "Filtry",
    model: "Model",
    severity: "Poziom",
    any: "Wszystkie",
    results: "wynik(ów)",
    dtc: "Kod",
    system: "System",
    criteriaActivation: "Kryteria aktywacji",
    faultCriteria: "Kryteria błędu",
    systemReaction: "Reakcja systemu",
    harnessChecks: "Kontrola wiązki",
    diagHelp: "Pomoc diagnostyczna",
    oemProc: "Procedura OEM",
    close: "Zamknij",
    copyLink: "Kopiuj link",
    toastCopied: "Skopiowano!",
    empty: "Brak wyników",
  }
}

const pickLang = () => {
  const l = (navigator.language || "en").toLowerCase();
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("pl")) return "pl";
  return "en";
};

// --- Design tokens -----------------------------------------------------------
const cx = (...classes) => classes.filter(Boolean).join(" ");
const badgeBySeverity = (sev) => ({
  1: "bg-red-600/80 text-white ring-1 ring-red-400/50",
  2: "bg-amber-500/80 text-black ring-1 ring-amber-300/60",
  3: "bg-emerald-600/80 text-white ring-1 ring-emerald-400/50",
}[sev] || "bg-slate-600/80 text-white ring-1 ring-slate-400/40");

// --- Types -------------------------------------------------------------------
/** @typedef {{
 *  dtc: string; title?: string; system?: string; severity?: number;
 *  model_code?: string | string[]; criteria_activation?: string; fault_criteria?: string;
 *  system_reaction?: string; harness_checks?: string; diag_help?: string; oem_procedure_url?: string;
 * }} DTC
 */

// --- Demo data ---------------------------------------------------------------
const DEMO_DATA = /** @type {any[]} */ ([
  {
    dtc: "C0490-01",
    title: "ISM-SCL lead short circuited to B+",
    system: "CIM Body • Immobilizer/Steering",
    severity: 2,
    model_code: ["9400", "9-3 NG"],
    criteria_activation: "Diagnostics runs when key is removed.",
    fault_criteria: "ISM-SCL lead short circuited to B+",
    system_reaction: "None",
    harness_checks: "Move the wiring harness at several spots and in several directions to reveal intermittent breaks and short-circuits.",
    diag_help: "Check switches, connectors and crimp connections for oxidation.",
    oem_procedure_url: "https://z90.pl/saab/dtc/read.php?model=9400&doc=idb10943",
  },
  {
    dtc: "P0300",
    title: "Random/Multiple Cylinder Misfire",
    system: "Engine • Trionic",
    severity: 1,
    model_code: ["9000", "9-5"],
    criteria_activation: "Engine running.",
    fault_criteria: "Ionization current indicates misfire above threshold.",
    system_reaction: "MIL on, torque reduction.",
    harness_checks: "Inspect DI cassette, plugs, grounds, injector connectors.",
    diag_help: "On Trionic 5/7 check for vacuum leaks, crank sensor, fuel pressure.",
  },
]);

// --- Utilities ---------------------------------------------------------------
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
const norm = (s) => (s || "").toString().toLowerCase().normalize("NFKD");

function useQuery() {
  const [hash, setHash] = useState(() => new URLSearchParams(window.location.hash.slice(1)));
  useEffect(() => {
    const onHash = () => setHash(new URLSearchParams(window.location.hash.slice(1)));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

export default function App() {
  const lang = pickLang();
  const t = (k) => messages[lang][k] || messages.en[k] || k;

  const [data, setData] = useState(DEMO_DATA);
  const [q, setQ] = useState("");
  
  const [sev, setSev] = useState(0); // 0:any, 1..3
  const [model, setModel] = useState("");

  // Load from /public/data/dtc-index.json if present
  useEffect(() => {
    fetch("/data/dtc-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(DEMO_DATA));
  }, []);

  const models = useMemo(() => uniq(data.flatMap(d => Array.isArray(d.model_code) ? d.model_code : [d.model_code])) , [data]);

  const filtered = useMemo(() => {
    const nq = norm(q);
    return data.filter(d => {
      const matchesQ = !nq || [d.dtc, d.title, d.system].some(v => norm(v).includes(nq));
      const matchesSev = !sev || Number(d.severity || 0) === Number(sev);
      const m = Array.isArray(d.model_code) ? d.model_code : [d.model_code];
      const matchesModel = !model || (m && m.some(x => (x||"").toString() === model));
      return matchesQ && matchesSev && matchesModel;
    }).sort((a,b) => (a.dtc||"").localeCompare(b.dtc||""));
  }, [data, q, sev, model]);

  const hash = useQuery();
  const openId = hash.get("dtc");
  const open = filtered.find(d => d.dtc === openId) || data.find(d => d.dtc === openId);

  const setHash = (params) => {
    const p = new URLSearchParams(params);
    window.location.hash = p.toString();
  };

  return (
    <div className="min-h-screen text-slate-100" style={{
      background: "radial-gradient(1400px 900px at 10% 0%, #0b1020 0%, #090d17 45%, #05070d 100%)"
    }}>
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40 bg-slate-900/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" className="opacity-90"><path fill="currentColor" d="M3 4h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6z"/></svg>
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="ml-auto text-xs opacity-70">UI v1</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1 relative">
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-400/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌘K</div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-80">{t("filters")}:</span>
            <select value={model} onChange={e=>setModel(e.target.value)} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value="">{t("any")} {t("model")}</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={sev} onChange={e=>setSev(Number(e.target.value))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value={0}>{t("any")} {t("severity")}</option>
              <option value={1}>1 – High</option>
              <option value={2}>2 – Medium</option>
              <option value={3}>3 – Low</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-slate-400">{filtered.length} {t("results")}</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-16 border border-dashed border-white/10 rounded-2xl">
              {t("empty")}
            </div>
          )}
          {filtered.map((d) => (
            <article key={d.dtc} className="group rounded-2xl p-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/7 transition cursor-pointer" onClick={() => setHash({ dtc: d.dtc })}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-mono tracking-tight text-slate-200">
                  <span className="px-2 py-1 rounded-lg bg-slate-900/50 border border-white/10">{d.dtc}</span>
                </div>
                <span className={cx("text-xs px-2 py-1 rounded-lg", badgeBySeverity(d.severity))}>G{d.severity ?? "?"}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug text-slate-100 line-clamp-2">
                {d.title || "—"}
              </h3>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{d.system || t("system")}</span>
                {(Array.isArray(d.model_code) ? d.model_code : [d.model_code]).filter(Boolean).slice(0,3).map((m) => (
                  <span key={m} className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{m}</span>
                ))}
              </div>
              {d.oem_procedure_url && (
                <a onClick={(e)=>e.stopPropagation()} href={d.oem_procedure_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200">
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3l-1.42-1.42l9.3-9.29H14V3Z"/></svg>
                  {t("oemProc")}
                </a>
              )}
            </article>
          ))}
        </div>
      </main>

      <DetailModal t={t} open={open} onClose={() => setHash({})} />
      <footer className="max-w-7xl mx-auto px-4 pb-10 pt-4 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div>© {new Date().getFullYear()} Saab DTC Explorer · UI v1</div>
          <div className="opacity-70">Dark glass UI · hash deep-linking · i18n auto</div>
        </div>
      </footer>
    </div>
  );
}

function DetailModal({ t, open, onClose }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(id);
  }, [copied]);

  if (!open) return null;
  const link = `${location.origin}${location.pathname}#dtc=${encodeURIComponent(open.dtc)}`;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 top-8 mx-auto max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))"
      }}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <span className={cx("text-xs px-2 py-1 rounded-lg", badgeBySeverity(open.severity))}>G{open.severity ?? "?"}</span>
            <span className="px-2 py-1 rounded-lg bg-slate-900/60 border border-white/10 font-mono">{open.dtc}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(link).then(()=>setCopied(true)); }}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
            >{copied ? t("toastCopied") : t("copyLink")}</button>
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">{t("close")}</button>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-50">{open.title || "—"}</h3>
          <div className="mt-1 text-sm text-slate-400">{open.system}</div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {open.criteria_activation && (
              <Field label={t("criteriaActivation")} value={open.criteria_activation} />
            )}
            {open.fault_criteria && (
              <Field label={t("faultCriteria")} value={open.fault_criteria} />
            )}
            {open.system_reaction && (
              <Field label={t("systemReaction")} value={open.system_reaction} />
            )}
            {open.harness_checks && (
              <Field label={t("harnessChecks")} value={open.harness_checks} />
            )}
            {open.diag_help && (
              <Field label={t("diagHelp")} value={open.diag_help} />
            )}
          </div>

          {open.oem_procedure_url && (
            <a className="mt-6 inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200" href={open.oem_procedure_url} target="_blank" rel="noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3l-1.42-1.42l9.3-9.29H14V3Z"/></svg>
              {t("oemProc")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">{value}</div>
    </div>
  );
}
