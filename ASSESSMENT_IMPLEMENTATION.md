# Context-Aware Assessment Implementation Guide

## Overview

This guide explains how to integrate the context-aware assessment logic into the Dampi SymptomLog flow. The system automatically generates personalized physical examination plans and finding-driven checklists based on the child's age, symptom category, and severity level.

## Architecture

```
Step 1: Describe (Step1Describe.jsx)
    ↓
Input Analysis (analyzeInput)
    ↓
Step 2: Physical Examination (Step2Examine.jsx)
    ↓
Dynamic Exam Generation (generateDynamicExam)
    ↓
Step 3: Findings Checklist (Step3Findings.jsx)
    ↓
Finding-Driven Checklist (generateChecklistFromExam)
    ↓
Step 4: Summary (Step4Summary.jsx)
    ↓
Data Integrity & Export (generateContextAwareSummary)
    ↓
Provider Export
```

## Core Components

### 1. `assessmentContext.js`

**Purpose**: Core business logic for context-aware assessment.

**Key Functions**:

#### `analyzeInput(description, childAge)`

Extracts age, symptom category, and severity from the user's initial description.

```javascript
const context = analyzeInput(
  "He's been crying non-stop, won't eat, feels warm",
  5
);

// Returns:
// {
//   childAge: 5,
//   symptomCategory: 'digestive',
//   severityLevel: 'moderate',
//   rawDescription: '...'
// }
```

#### `generateDynamicExam(context)`

Generates age-specific, symptom-specific exam instructions.

```javascript
const examPlan = generateDynamicExam(context);

// Returns array of exam steps:
// [
//   {
//     id: 'dig_1',
//     title: 'Visual Abdominal Inspection',
//     detail: 'Have the child lie down. Look at the belly...',
//     tip: 'Ensure good lighting...'
//   },
//   ...
// ]
```

#### `generateChecklistFromExam(examSteps)`

Creates finding checklist items linked to exam steps.

```javascript
const checklist = generateChecklistFromExam(examSteps);

// Returns array of checklist items:
// [
//   {
//     id: 'finding_dig_1',
//     examStepId: 'dig_1',
//     examStepTitle: 'Visual Abdominal Inspection',
//     question: 'Abdomen appears normal (not bloated or sunken)?',
//     type: 'yesno'
//   },
//   ...
// ]
```

#### `generateContextAwareSummary(sessionData, profileData, profileId)`

Generates physician-ready summary with data integrity rules.

```javascript
const summary = generateContextAwareSummary(
  sessionData,
  profileData,
  profileId
);

// Registered profile:
// {
//   child_name: 'Maria Santos',
//   date_of_birth: '2021-05-15',
//   hmo_id: 'ABC12345',
//   allergies: 'Penicillin',
//   session_findings: { ... },
//   is_registered_profile: true
// }

// Guest profile:
// {
//   child_name: 'Child',
//   child_age: '5 years',
//   session_findings: { ... },
//   is_registered_profile: false,
//   restrictions: 'Guest assessment...'
// }
```

### 2. `assessmentAdapter.js`

**Purpose**: Integration layer connecting assessment logic to SymptomLog UI.

**Key Functions**:

#### `generateExamPlanFromStep1(step1Data, childAge)`

Complete pipeline: analyze Step 1 input → generate exam → generate checklist.

```javascript
const plan = generateExamPlanFromStep1({
  description: "He's been vomiting for 2 hours...",
  temperatureC: '38.5'
}, 5);

// Returns:
// {
//   context: { childAge, symptomCategory, severityLevel },
//   instructions: [...exam steps...],
//   checklist: [...checklist items...],
//   metadata: { generatedAt, stepCount, checklistItemCount }
// }
```

#### `createAssessmentSession(childName, childAge, childId, profileId)`

Creates a session object to track the entire 4-step flow.

```javascript
const session = createAssessmentSession('Maria', 5, 'child-uuid', 'profile-uuid');

// Returns:
// {
//   id: 'session_...',
//   createdAt: '...',
//   childName, childAge, childId, profileId,
//   step1: { description, temperatureC, ..., completed: false },
//   step2: { plan: null, ..., completed: false },
//   step3: { answers: {}, ..., completed: false },
//   step4: { summary: null, ..., completed: false },
//   metadata: { context: null, validationStatus: {...} }
// }
```

#### `updateAssessmentSession(session, stepNumber, stepData)`

Updates session as user progresses through steps.

```javascript
let session = createAssessmentSession('Maria', 5, '...', '...');

// User completes Step 1
session = updateAssessmentSession(session, 1, {
  description: "He's vomiting...",
  temperatureC: '38.5'
});
// Automatically generates Step 2 exam plan

// User completes Step 2
session = updateAssessmentSession(session, 2, {
  examPhotos: { 0: {...} },
  stepHelp: {}
});

// User completes Step 3
session = updateAssessmentSession(session, 3, {
  answers: { 'finding_dig_1': true, 'finding_dig_2': false, ... },
  severityRating: 6
});
// Automatically validates checklist continuity

// User completes Step 4
session = updateAssessmentSession(session, 4, {
  exportReady: true,
  exported: false
});
```

#### `validateChecklistContinuity(examPlan, checklistAnswers)`

Ensures every exam step has a corresponding checklist item.

```javascript
const validation = validateChecklistContinuity(plan, answers);

// Returns:
// {
//   isValid: true/false,
//   issues: [
//     { severity: 'error'|'warning', message: '...' }
//   ]
// }
```

#### `prepareExportSummary(sessionData, profileData, profileId)`

Prepares summary for physician export.

```javascript
const exportData = prepareExportSummary(session.step1, profileData, profileId);

// Returns:
// {
//   summary: { ...generated summary... },
//   exportUrl: null,
//   formats: { json: null, text: null, pdf: null }
// }
```

### 3. `contextAwareAssessmentPrompts.js`

**Purpose**: AI system prompts and instructions for Claude integration.

**Key Exports**:

- `CONTEXT_AWARE_ASSESSMENT_SYSTEM_PROMPT`: Main system prompt
- `EXAM_GENERATION_INSTRUCTIONS`: Detailed exam generation rules
- `CHECKLIST_GENERATION_INSTRUCTIONS`: Checklist continuity rules
- `DATA_INTEGRITY_RULES`: Registered vs. guest rules
- `EXAM_PLAN_RESPONSE_SCHEMA`: JSON schema for AI responses
- `SUMMARY_RESPONSE_SCHEMA`: Summary schema

## Integration Steps

### Step 1: Update SymptomLogFlow

```javascript
import { createAssessmentSession, updateAssessmentSession } from 
  '../../services/ai/assessmentAdapter.js';

export default function SymptomLogFlow({ childName, childAge, childId, profileId }) {
  const [session, setSession] = useState(() =>
    createAssessmentSession(childName, childAge, childId, profileId)
  );

  const handleStep1Complete = (step1Data) => {
    const updated = updateAssessmentSession(session, 1, step1Data);
    setSession(updated);
    // This automatically generates the exam plan
  };

  const handleStep2Complete = (step2Data) => {
    const updated = updateAssessmentSession(session, 2, step2Data);
    setSession(updated);
  };

  // ... similar for steps 3 & 4

  return (
    <>
      {currentStep === 1 && (
        <Step1Describe
          session={session}
          onChange={handleStep1Complete}
        />
      )}
      {currentStep === 2 && (
        <Step2Examine
          plan={session.step2.plan}
          childName={childName}
          childAge={childAge}
          onChange={(data) => handleStep2Complete(data)}
        />
      )}
      {currentStep === 3 && (
        <Step3Findings
          plan={session.step2.plan}
          findings={session.step3}
          onChange={(data) => handleStep3Complete(data)}
        />
      )}
      {currentStep === 4 && (
        <Step4Summary
          session={session}
          profileData={profileData}
          onExport={handleExport}
        />
      )}
    </>
  );
}
```

### Step 2: Use Exam Plan in Step2Examine

```javascript
import { getAssessmentStats } from '../../services/ai/assessmentAdapter.js';

export default function Step2Examine({ plan, childName, childAge, findings, onChange }) {
  if (!plan || !plan.instructions) return null;

  const stats = getAssessmentStats({ step2: { plan }, step3: findings });

  return (
    <section className="symptom-log__panel">
      {/* ...existing header... */}

      <div className="symptom-log__progress">
        <p>Step {i + 1} of {stats.examStepsGenerated}</p>
      </div>

      <div className="symptom-log__exam-cards">
        {plan.instructions.map((step, i) => (
          <article key={step.id} className="symptom-log__exam-card">
            <div className="symptom-log__exam-num">{i + 1}</div>
            <div className="symptom-log__exam-body">
              <h3 className="symptom-log__exam-title">{step.title}</h3>
              <p className="symptom-log__exam-detail">{step.detail}</p>
              {step.tip && (
                <p className="symptom-log__exam-tip">
                  <Lightbulb size={14} />
                  <span>{step.tip}</span>
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

### Step 3: Link Checklist to Exam Steps in Step3Findings

```javascript
import { validateChecklistContinuity } from '../../services/ai/assessmentAdapter.js';

export default function Step3Findings({ plan, findings, onChange }) {
  if (!plan || !plan.checklist) return null;

  // Validate continuity
  const validation = validateChecklistContinuity(plan, findings.answers);

  return (
    <section className="symptom-log__panel">
      {/* ...existing header... */}

      {!validation.isValid && (
        <div className="symptom-log__validation-notice">
          <AlertTriangle size={18} />
          <p>Please complete all examination findings.</p>
        </div>
      )}

      <div className="symptom-log__findings-card">
        {plan.checklist.map((item, idx) => (
          <div key={item.id} className="symptom-log__finding-row">
            <div className="symptom-log__finding-header">
              <p className="symptom-log__finding-exam-ref">
                Based on: {item.examStepTitle}
              </p>
            </div>
            <p className="symptom-log__finding-q">{item.question}</p>
            {item.type === 'yesno' && (
              <div className="symptom-log__yesno">
                {[
                  { label: 'Yes', value: true },
                  { label: 'No', value: false },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    className={`symptom-log__yesno-btn${
                      findings.answers[item.id] === value ? ' --active' : ''
                    }`}
                    onClick={() =>
                      onChange({
                        answers: { ...findings.answers, [item.id]: value },
                      })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

### Step 4: Generate Provider Export in Step4Summary

```javascript
import {
  prepareExportSummary,
  generateProviderExports,
  getAssessmentStats,
} from '../../services/ai/assessmentAdapter.js';

export default function Step4Summary({ session, profileData, onExport }) {
  const [exportData, setExportData] = useState(null);
  const stats = getAssessmentStats(session);

  const handleGenerateExport = () => {
    try {
      const exportable = prepareExportSummary(
        session.step1,
        profileData,
        session.profileId
      );
      const formats = generateProviderExports(exportable.summary);
      setExportData({ ...exportable, formats });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <section className="symptom-log__panel">
      {/* ...existing header... */}

      <div className="symptom-log__stats">
        <p>Exam Steps: {stats.examStepsGenerated}</p>
        <p>Findings Documented: {stats.checklistItemsAnswered}/{stats.checklistItemsGenerated}</p>
        <p>Completeness: {stats.completionPercentage}%</p>
      </div>

      {exportData && (
        <div className="symptom-log__export">
          <button onClick={() => navigator.clipboard.writeText(exportData.formats.json)}>
            Copy JSON
          </button>
          <button onClick={() => downloadAsText(exportData.formats.text)}>
            Download Text
          </button>
        </div>
      )}

      <button className="btn-primary" onClick={handleGenerateExport}>
        Generate Provider Export
      </button>
    </section>
  );
}
```

## Data Flow Example

### Scenario: 5-year-old with abdominal pain

**Input** (Step 1):
```
Description: "He's been complaining of stomach pain for 2 hours, won't eat, feels warm"
Temperature: 38.5°C
```

**Analysis**:
```javascript
analyzeInput(description, 5)
→ { childAge: 5, symptomCategory: 'digestive', severityLevel: 'moderate' }
```

**Exam Generation**:
```javascript
generateDynamicExam(context)
→ 4-5 digestive exam steps:
  1. Visual Abdominal Inspection
  2. Gentle Abdominal Palpation
  3. Lower Right Quadrant Assessment
  4. Hydration & Stool Assessment
  [5. Rebound Tenderness Check - if moderate severity]
```

**Checklist Generation**:
```javascript
generateChecklistFromExam(examSteps)
→ 4-5 checklist items:
  "Abdomen appears normal (not bloated or sunken)?"
  "Abdomen soft to palpation (no tenderness)?"
  "Lower right abdomen tender or guarded?"
  "Hydration status adequate (moist lips, normal urine)?"
  ...
```

**Summary** (Registered Profile):
```javascript
generateContextAwareSummary(sessionData, profileData, profileId)
→ {
  child_name: 'Juan Santos',
  date_of_birth: '2019-05-15',
  hmo_id: 'PHC123456',
  allergies: 'Penicillin',
  session_findings: {
    chief_complaint: '2-hour stomach pain, anorexia, fever',
    symptom_category: 'digestive',
    severity_level: 'moderate',
    exam_steps_completed: 4,
    findings_documented: {
      'finding_dig_1': true,
      'finding_dig_2': false,  // tenderness found
      'finding_dig_3': false,  // right lower tenderness
      'finding_dig_4': true
    },
    overall_severity_rating: 6
  },
  data_completeness: 100%,
  provider_export_ready: true
}
```

## Best Practices

1. **Always validate checklist continuity** before marking Step 3 as complete.
2. **Consider severity levels** when displaying guidance to parents.
3. **Preserve exam photos** with step IDs for provider reference.
4. **Use assessment stats** to show progress to parents.
5. **Enforce data completeness** before allowing export.
6. **Respect privacy rules**: Never include stored profile data in guest summaries.

## Testing

### Unit Test: Input Analysis

```javascript
import { analyzeInput } from './assessmentContext.js';

test('Detects respiratory symptoms', () => {
  const context = analyzeInput('My child has a bad cough and stuffy nose', 3);
  expect(context.symptomCategory).toBe('respiratory');
});

test('Detects high severity', () => {
  const context = analyzeInput('Can\'t breathe, lips turning blue', 5);
  expect(context.severityLevel).toBe('severe');
});
```

### Unit Test: Exam Generation

```javascript
import { generateDynamicExam } from './assessmentContext.js';

test('Mild severity generates 3 steps', () => {
  const exam = generateDynamicExam({
    childAge: 5,
    symptomCategory: 'digestive',
    severityLevel: 'mild'
  });
  expect(exam.length).toBe(3);
});

test('Severe generates 5–6 steps', () => {
  const exam = generateDynamicExam({
    childAge: 5,
    symptomCategory: 'respiratory',
    severityLevel: 'severe'
  });
  expect(exam.length).toBeGreaterThanOrEqual(5);
  expect(exam.length).toBeLessThanOrEqual(6);
});
```

### Unit Test: Checklist Continuity

```javascript
import { generateChecklistFromExam, validateChecklistContinuity } from './assessmentContext.js';

test('Every exam step maps to a checklist item', () => {
  const exam = [...];  // from generateDynamicExam
  const checklist = generateChecklistFromExam(exam);
  
  exam.forEach(step => {
    const checklistItem = checklist.find(
      item => item.examStepId === step.id
    );
    expect(checklistItem).toBeDefined();
  });
});
```

## Future Enhancements

1. **AI-powered exam plan refinement** — Use Claude to refine generated plans
2. **Red flag alerts** — Real-time detection during Step 2/3
3. **Multi-language support** — Adapt exam steps for Tagalog/other languages
4. **Decision trees** — Branch exam plans based on findings
5. **Provider CRM integration** — Direct export to physician EMR systems
6. **Machine learning** — Improve severity detection over time

---

**Document Version**: 1.0
**Last Updated**: May 8, 2026
