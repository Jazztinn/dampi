import { emptyDraft, saveDraft } from '../../screens/SymptomLog/draftStorage.js';

const QUICK_LOG_STORAGE_KEY = 'dampi.chatQuickSymptomLog.v1';

export const QUICK_LOG_STATUS = {
  inactive: 'inactive',
  capture: 'capture',
  review: 'review',
  saved: 'saved',
};

export function emptyQuickLog(children = []) {
  const firstChildId = children.length === 1 ? children[0].id : '';
  return {
    version: 1,
    status: QUICK_LOG_STATUS.inactive,
    expanded: false,
    selectedChildId: firstChildId,
    chiefComplaint: '',
    duration: '',
    severity: '',
    temperature: '',
    heartRate: '',
    oxygenSat: '',
    associatedSymptoms: [],
    medicationsGiven: '',
    medicalHistory: '',
    parentNotes: '',
    summaryText: '',
    redFlags: [],
    recommendedNextSteps: [],
    missingInformation: [],
    conversationId: null,
    savedLogId: null,
    savedAt: null,
    error: '',
    createdLogId: null,
  };
}

export function loadQuickLog(children = []) {
  try {
    const raw = window.localStorage.getItem(QUICK_LOG_STORAGE_KEY);
    if (!raw) return emptyQuickLog(children);
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return emptyQuickLog(children);
    return normalizeQuickLog({ ...emptyQuickLog(children), ...parsed }, children);
  } catch {
    return emptyQuickLog(children);
  }
}

export function saveQuickLog(quickLog) {
  try {
    if (!quickLog || quickLog.status === QUICK_LOG_STATUS.inactive) {
      window.localStorage.removeItem(QUICK_LOG_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(QUICK_LOG_STORAGE_KEY, JSON.stringify({ ...quickLog, version: 1 }));
  } catch {
    /* local persistence is best-effort */
  }
}

export function clearQuickLog() {
  try {
    window.localStorage.removeItem(QUICK_LOG_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function normalizeQuickLog(raw, children = []) {
  const childIds = new Set(children.map((child) => child.id));
  const selectedChildId = raw.selectedChildId && (childIds.size === 0 || childIds.has(raw.selectedChildId))
    ? raw.selectedChildId
    : children.length === 1
      ? children[0].id
      : '';

  return {
    ...emptyQuickLog(children),
    ...raw,
    selectedChildId,
    associatedSymptoms: Array.isArray(raw.associatedSymptoms) ? raw.associatedSymptoms.filter(Boolean) : [],
    redFlags: Array.isArray(raw.redFlags) ? raw.redFlags.filter(Boolean) : [],
    recommendedNextSteps: Array.isArray(raw.recommendedNextSteps) ? raw.recommendedNextSteps.filter(Boolean) : [],
    missingInformation: Array.isArray(raw.missingInformation) ? raw.missingInformation.filter(Boolean) : [],
  };
}

export function mergeExtraction(current, extracted) {
  if (!extracted || typeof extracted !== 'object') return current;
  const next = { ...current };
  [
    'chiefComplaint',
    'duration',
    'severity',
    'temperature',
    'heartRate',
    'oxygenSat',
    'medicationsGiven',
    'medicalHistory',
    'parentNotes',
  ].forEach((key) => {
    if (typeof extracted[key] === 'string' && extracted[key].trim()) {
      next[key] = extracted[key].trim();
    }
  });
  if (Array.isArray(extracted.associatedSymptoms)) {
    next.associatedSymptoms = extracted.associatedSymptoms.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return next;
}

export function getQuickLogMissingRequired(quickLog) {
  const missing = [];
  if (!quickLog.selectedChildId) missing.push('child');
  if (!quickLog.chiefComplaint.trim()) missing.push('chief complaint');
  if (!quickLog.duration.trim()) missing.push('duration');
  if (!String(quickLog.severity || '').trim()) missing.push('severity');
  return missing;
}

export function getSelectedChild(children = [], selectedChildId) {
  return children.find((child) => child.id === selectedChildId) || null;
}

export function buildQuickLogSummaryPayload(quickLog, children = [], profile = null) {
  const child = getSelectedChild(children, quickLog.selectedChildId);
  const generatedAt = new Date().toISOString();
  return {
    source: 'chat_quick_log',
    generatedAt,
    child: child ? {
      id: child.id,
      name: child.full_name || '',
      dateOfBirth: child.date_of_birth || '',
      gender: child.gender || '',
      weight: child.weight || '',
      bloodType: child.blood_type || '',
    } : null,
    recordedBy: profile?.full_name || '',
    chiefComplaint: valueOrNotProvided(quickLog.chiefComplaint),
    duration: valueOrNotProvided(quickLog.duration),
    severity: valueOrNotProvided(quickLog.severity),
    vitals: {
      temperature: valueOrNotProvided(quickLog.temperature),
      heartRate: valueOrNotProvided(quickLog.heartRate),
      oxygenSat: valueOrNotProvided(quickLog.oxygenSat),
    },
    associatedSymptoms: quickLog.associatedSymptoms.length > 0 ? quickLog.associatedSymptoms : ['Not provided'],
    medicationsGiven: valueOrNotProvided(quickLog.medicationsGiven),
    medicalHistory: valueOrNotProvided(quickLog.medicalHistory),
    parentNotes: valueOrNotProvided(quickLog.parentNotes),
    summaryText: valueOrNotProvided(quickLog.summaryText),
    redFlags: quickLog.redFlags.length > 0 ? quickLog.redFlags : ['Not provided'],
    recommendedNextSteps: quickLog.recommendedNextSteps.length > 0 ? quickLog.recommendedNextSteps : ['Not provided'],
    missingInformation: quickLog.missingInformation,
  };
}

export function createQuickLogPdfAttachment(summary, logId = '') {
  const childName = summary?.child?.name || 'Child';
  const fileSafeName = childName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'symptom-log';
  const lines = [
    'Dampi Symptom Log',
    logId ? `Log ID: ${logId}` : '',
    `Generated: ${formatDateTime(summary?.generatedAt)}`,
    '',
    `Child: ${childName}`,
    summary?.child?.gender ? `Sex: ${summary.child.gender}` : '',
    summary?.child?.dateOfBirth ? `Date of birth: ${summary.child.dateOfBirth}` : '',
    summary?.recordedBy ? `Recorded by: ${summary.recordedBy}` : '',
    '',
    'Submitted facts',
    `Chief complaint: ${summary?.chiefComplaint || 'Not provided'}`,
    `Duration: ${summary?.duration || 'Not provided'}`,
    `Severity: ${summary?.severity || 'Not provided'}`,
    `Temperature: ${summary?.vitals?.temperature || 'Not provided'}`,
    `Heart rate: ${summary?.vitals?.heartRate || 'Not provided'}`,
    `Oxygen saturation: ${summary?.vitals?.oxygenSat || 'Not provided'}`,
    `Associated symptoms: ${arrayText(summary?.associatedSymptoms)}`,
    `Medications given: ${summary?.medicationsGiven || 'Not provided'}`,
    `Medical history: ${summary?.medicalHistory || 'Not provided'}`,
    `Parent notes: ${summary?.parentNotes || 'Not provided'}`,
    '',
    'AI summary',
    summary?.summaryText || 'Not provided',
    '',
    'Red flags',
    ...bulletLines(summary?.redFlags),
    '',
    'Recommended next steps',
    ...bulletLines(summary?.recommendedNextSteps),
    '',
    'Missing information',
    ...bulletLines(summary?.missingInformation),
    '',
    'This PDF is for clinical reference only and is not a diagnosis.',
  ].filter((line) => line !== null && line !== undefined);

  return {
    name: `${fileSafeName}-symptom-log.pdf`,
    mime: 'application/pdf',
    data: buildPdfBase64(lines),
    download: true,
  };
}

export function saveQuickLogToFullDraft(quickLog) {
  const draft = emptyDraft();
  draft.describe.description = quickLog.chiefComplaint || quickLog.parentNotes || '';
  draft.describe.temperatureC = quickLog.temperature || '';
  draft.describe.heartRate = quickLog.heartRate || '';
  draft.describe.oxygenSat = quickLog.oxygenSat || '';
  draft.describe.duration = 'custom';
  draft.describe.durationCustom = quickLog.duration || '';
  draft.describe.medicalHistory = [
    quickLog.medicalHistory ? `Medical history: ${quickLog.medicalHistory}` : '',
    quickLog.medicationsGiven ? `Medications given: ${quickLog.medicationsGiven}` : '',
    quickLog.associatedSymptoms.length > 0 ? `Associated symptoms: ${quickLog.associatedSymptoms.join(', ')}` : '',
  ].filter(Boolean).join('\n');
  draft.findings.overallSeverity = parseSeverity(quickLog.severity);
  draft.findings.notes = quickLog.parentNotes || '';
  draft.summary = quickLog.summaryText ? {
    data: buildFullDraftSummary(quickLog),
    reportId: '',
    reportDate: new Date().toISOString(),
    rawError: null,
  } : null;
  draft.step = quickLog.summaryText ? 3 : 0;
  saveDraft(draft);
}

function buildFullDraftSummary(quickLog) {
  return {
    patient: { name: '', ageDisplay: '', gender: '', weight: '', bloodType: '' },
    vitalSigns: {
      temperature: quickLog.temperature || '',
      heartRate: quickLog.heartRate || '',
      oxygenSat: quickLog.oxygenSat || '',
    },
    chiefComplaint: {
      quote: quickLog.chiefComplaint || '',
      tags: quickLog.associatedSymptoms.length > 0 ? quickLog.associatedSymptoms : [],
    },
    history: {
      allergies: '',
      medications: quickLog.medicationsGiven || '',
      chronic: quickLog.medicalHistory || '',
    },
    examFindings: [
      {
        label: 'Quick chat notes',
        status: 'inconclusive',
        detail: quickLog.parentNotes || quickLog.summaryText || '',
      },
    ],
    suggestedNextStep: {
      level: 'routine',
      reason: quickLog.recommendedNextSteps[0] || '',
    },
  };
}

function parseSeverity(value) {
  const numeric = Number.parseInt(String(value || '').match(/\d+/)?.[0] || '', 10);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(10, numeric)) : null;
}

function valueOrNotProvided(value) {
  return value && String(value).trim() ? String(value).trim() : 'Not provided';
}

function arrayText(values) {
  return Array.isArray(values) && values.length > 0 ? values.join(', ') : 'Not provided';
}

function bulletLines(values) {
  if (!Array.isArray(values) || values.length === 0) return ['- Not provided'];
  return values.map((value) => `- ${value}`);
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString();
  return date.toLocaleString();
}

function buildPdfBase64(rawLines) {
  const wrappedLines = rawLines.flatMap((line) => wrapPdfLine(line));
  const pages = chunk(wrappedLines, 45);
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];

  pages.forEach((pageLines) => {
    const content = [
      'BT',
      '/F1 11 Tf',
      '14 TL',
      '50 790 Td',
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      'ET',
    ].join('\n');
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return btoa(toPdfSafeText(pdf));
}

function wrapPdfLine(line, width = 92) {
  const clean = toPdfSafeText(String(line || ''));
  if (clean.length <= width) return [clean];
  const words = clean.split(/\s+/);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(text) {
  return toPdfSafeText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function toPdfSafeText(text) {
  return String(text || '').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}
