const STORAGE_KEY = 'dampi.symptomLog.draft';
const VERSION = 2;

export function emptyDraft() {
  return {
    version: VERSION,
    step: 0,
    describe: {
      description: '',
      temperatureC: '',
      heartRate: '',
      oxygenSat: '',
      duration: '',
      durationCustom: '',
      medicalHistory: '',
      historyExpanded: false,
      photos: [],
    },
    plan: null,
    findings: {
      answers: {},
      overallSeverity: null,
      notes: '',
      photos: [],
      examPhotos: {},
      stepHelp: {},
    },
    summary: null,
    createdAt: null,
    updatedAt: null,
  };
}

export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  try {
    const next = { ...draft, version: VERSION, updatedAt: new Date().toISOString() };
    if (!next.createdAt) next.createdAt = next.updatedAt;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota exceeded or unavailable — non-fatal */
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
