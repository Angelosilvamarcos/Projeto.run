import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './AppFinal.jsx';

// Migração de histórico: a versão anterior do ATLETAOS salvava os treinos em
// atletaos_v3_workouts. A versão consolidada usa atletaos_final_logs.
// Fazemos a migração antes do React montar o App para que os treinos antigos
// apareçam imediatamente na aba Treinos e também alimentem a sugestão semanal.
function migrateTrainingHistory() {
  try {
    const targetKey = 'atletaos_final_logs';
    const existing = JSON.parse(localStorage.getItem(targetKey) || 'null');
    if (Array.isArray(existing) && existing.length > 0) return;

    const sources = [
      'atletaos_v3_workouts',
      'rt_logs',
      'workouts',
      'treinos'
    ];

    let legacy = [];
    for (const key of sources) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        if (Array.isArray(value) && value.length) {
          legacy = value;
          break;
        }
      } catch (_) {}
    }

    if (!legacy.length) return;

    const normalized = legacy.map((w, index) => ({
      ...w,
      id: w.id || `legacy_${index}_${Date.now()}`,
      date: w.date || w.data || new Date().toISOString().slice(0, 10),
      type: w.type || w.tipo || 'Treino',
      description: w.description || w.desc || w.descricao || w.treino || '',
      km: w.km ?? w.distance ?? w.distancia ?? '',
      rpe: w.rpe ?? w.RPE ?? 5,
      pernas: w.pernas || w.legs || 'normal',
      sono: w.sono || w.sleep || 'bom',
      intensity: w.intensity || w.intensidade || 'leve'
    }));

    localStorage.setItem(targetKey, JSON.stringify(normalized));
  } catch (_) {}
}

migrateTrainingHistory();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
