import React, { useState, useEffect } from 'react';

const i18n = {
  fr: {
    title: 'Explorateur DTC',
    search: 'Rechercher...',
    all_models: 'Tous modèles',
    all_sev: 'Toutes gravités',
    g1: 'Gravité 1',
    g2: 'Gravité 2',
    g3: 'Gravité 3',
    no_results: 'Aucun résultat',
    system: 'Système',
    severity: 'Gravité',
    criteria_activation: 'Critères d’activation',
    fault_criteria: 'Critères de défaut',
    system_reaction: 'Réaction du système',
    harness_checks: 'Contrôles faisceau',
    diag_help: 'Aide diag',
    oem_procedure: 'Procédure OEM',
    copy_link: 'Copier le lien',
    close: 'Fermer',
  },
  en: {
    title: 'DTC Explorer',
    search: 'Search...',
    all_models: 'All models',
    all_sev: 'All severities',
    g1: 'Severity 1',
    g2: 'Severity 2',
    g3: 'Severity 3',
    no_results: 'No results',
    system: 'System',
    severity: 'Severity',
    criteria_activation: 'Activation criteria',
    fault_criteria: 'Fault criteria',
    system_reaction: 'System reaction',
    harness_checks: 'Harness checks',
    diag_help: 'Diag help',
    oem_procedure: 'OEM procedure',
    copy_link: 'Copy link',
    close: 'Close',
  },
  pl: {
    title: 'Eksplorator DTC',
    search: 'Szukaj...',
    all_models: 'Wszystkie modele',
    all_sev: 'Wszystkie stopnie',
    g1: 'Stopień 1',
    g2: 'Stopień 2',
    g3: 'Stopień 3',
    no_results: 'Brak wyników',
    system: 'System',
    severity: 'Stopień',
    criteria_activation: 'Kryteria aktywacji',
    fault_criteria: 'Kryteria błędu',
    system_reaction: 'Reakcja systemu',
    harness_checks: 'Kontrole wiązki',
    diag_help: 'Pomoc diagnostyczna',
    oem_procedure: 'Procedura OEM',
    copy_link: 'Kopiuj link',
    close: 'Zamknij',
  },
};

function getLocale() {
  const lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language.slice(0, 2) : 'fr';
  return i18n[lang] ? lang : 'fr';
}

export default function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const locale = getLocale();

  useEffect(() => {
    fetch('/data/dtc-index.json')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {
        setData([
          {
            dtc: 'P0001',
            title: 'Regulateur system test',
            system: 'Fuel',
            severity: 1,
            model_code: '9-3',
            criteria_activation: 'Exemple de critères d’activation',
            fault_criteria: 'Exemple de critères de défaut',
            system_reaction: 'Exemple de réaction du système',
            harness_checks: 'Exemple de contrôles faisceau',
            diag_help: 'Exemple d’aide diag',
          },
          {
            dtc: 'C0490-01',
            title: 'Brake pressure sensor',
            system: 'ABS',
            severity: 2,
            model_code: ['9-5', '9-3'],
            criteria_activation: 'Test sensors input',
            fault_criteria: 'Brake pressure low',
            system_reaction: 'Warning light',
            harness_checks: 'Check harness connectors',
            diag_help: 'Inspect brake lines',
            oem_procedure_url: 'https://z90.pl/saab/dtc/#C0490-01',
          },
        ]);
      });
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#dtc=')) {
      const code = decodeURIComponent(hash.split('=')[1]);
      const found = data.find((item) => item.dtc === code);
      if (found) setSelected(found);
    }
  }, [data]);

  const filtered = data.filter((item) => {
    if (modelFilter !== 'all') {
      const models = Array.isArray(item.model_code) ? item.model_code : [item.model_code];
      if (!models.includes(modelFilter)) return false;
    }
    if (severityFilter !== 'all' && String(item.severity) !== String(severityFilter)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        item.dtc.toLowerCase().includes(s) ||
        (item.title && item.title.toLowerCase().includes(s)) ||
        (item.system && item.system.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const models = Array.from(
    new Set(
      data
        .flatMap((item) => (Array.isArray(item.model_code) ? item.model_code : [item.model_code]))
        .filter(Boolean)
    )
  );

  const t = i18n[locale];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          className="px-2 py-1 rounded bg-gray-800 placeholder-gray-500"
        />
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="px-2 py-1 rounded bg-gray-800"
        >
          <option value="all">{t.all_models}</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-2 py-1 rounded bg-gray-800"
        >
          <option value="all">{t.all_sev}</option>
          <option value="1">{t.g1}</option>
          <option value="2">{t.g2}</option>
          <option value="3">{t.g3}</option>
        </select>
      </div>
      <div className="grid gap-2">
        {filtered.map((item) => (
          <div
            key={item.dtc}
            className="bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700"
            onClick={() => {
              setSelected(item);
              window.location.hash = `dtc=${encodeURIComponent(item.dtc)}`;
            }}
          >
            <div className="flex justify-between items-baseline">
              <div className="font-mono text-lg">{item.dtc}</div>
              {item.severity && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    item.severity === 1
                      ? 'bg-green-700'
                      : item.severity === 2
                      ? 'bg-yellow-700'
                      : 'bg-red-700'
                  }`}
                >
                  G{item.severity}
                </span>
              )}
            </div>
            <div className="text-sm italic text-gray-300">{item.title}</div>
            <div className="text-xs text-gray-400">{item.system}</div>
          </div>
        ))}
        {filtered.length === 0 && <div>{t.no_results}</div>}
      </div>
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => {
            setSelected(null);
            window.location.hash = '';
          }}
        >
          <div
            className="bg-gray-800 p-4 rounded max-h-[90vh] w-[90vw] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">
              {selected.dtc} - {selected.title}
            </h2>
            <div className="mb-2">
              <strong>{t.system}:</strong> {selected.system}
            </div>
            <div className="mb-2">
              <strong>{t.severity}:</strong> G{selected.severity}
            </div>
            {selected.criteria_activation && (
              <div className="mb-2">
                <strong>{t.criteria_activation}:</strong> {selected.criteria_activation}
              </div>
            )}
            {selected.fault_criteria && (
              <div className="mb-2">
                <strong>{t.fault_criteria}:</strong> {selected.fault_criteria}
              </div>
            )}
            {selected.system_reaction && (
              <div className="mb-2">
                <strong>{t.system_reaction}:</strong> {selected.system_reaction}
              </div>
            )}
            {selected.harness_checks && (
              <div className="mb-2">
                <strong>{t.harness_checks}:</strong> {selected.harness_checks}
              </div>
            )}
            {selected.diag_help && (
              <div className="mb-2">
                <strong>{t.diag_help}:</strong> {selected.diag_help}
              </div>
            )}
            {selected.oem_procedure_url && (
              <div className="mb-2">
                <a href={selected.oem_procedure_url} target="_blank" className="underline text-blue-400">
                  {t.oem_procedure}
                </a>
              </div>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="px-2 py-1 mt-2 rounded bg-blue-700 hover:bg-blue-600"
            >
              {t.copy_link}
            </button>
            <button
              onClick={() => {
                setSelected(null);
                window.location.hash = '';
              }}
              className="px-2 py-1 mt-2 ml-2 rounded bg-gray-600 hover:bg-gray-500"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
