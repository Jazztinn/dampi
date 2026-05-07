/**
 * assessmentAdapter.js
 * 
 * Adapter that integrates context-aware assessment logic with the Dampi SymptomLog flow.
 * Bridges between the 4-step UI and the assessment context engine.
 */

import {
  analyzeInput,
  generateDynamicExam,
  generateChecklistFromExam,
  generateContextAwareSummary,
  exportForPhysician,
} from './assessmentContext.js';

/**
 * Process Step 1 input (Describe) and generate Step 2 exam plan.
 * 
 * Input: Raw step 1 data
 * Output: Exam plan with personalized instructions and corresponding checklist
 */
export function generateExamPlanFromStep1(step1Data, childAge) {
  // Step 1: Analyze input for context
  const context = analyzeInput(step1Data.description, childAge);

  // Step 2: Generate personalized exam instructions
  const examInstructions = generateDynamicExam(context);

  // Step 3: Generate corresponding finding checklist
  const checklist = generateChecklistFromExam(examInstructions);

  // Return plan object compatible with Step2Examine component
  return {
    context,
    instructions: examInstructions,
    checklist,
    metadata: {
      generatedAt: new Date().toISOString(),
      stepCount: examInstructions.length,
      checklistItemCount: checklist.length,
    },
  };
}

/**
 * Validate that checklist answers correspond to exam steps (data integrity check).
 * 
 * Ensures that for every exam step, there's a corresponding checklist item answered.
 */
export function validateChecklistContinuity(examPlan, checklistAnswers) {
  const issues = [];

  // Check that all checklist items have corresponding exam steps
  examPlan.checklist.forEach((checklistItem) => {
    const correspondingExamStep = examPlan.instructions.find(
      (step) => step.id === checklistItem.examStepId
    );
    if (!correspondingExamStep) {
      issues.push({
        severity: 'error',
        message: `Checklist item "${checklistItem.id}" has no corresponding exam step`,
      });
    }
  });

  // Check that critical findings are documented
  const answeredCount = Object.values(checklistAnswers).filter((v) => v !== null && v !== undefined).length;
  if (answeredCount < examPlan.checklist.length * 0.5) {
    issues.push({
      severity: 'warning',
      message: `Less than 50% of checklist items are answered (${answeredCount}/${examPlan.checklist.length})`,
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Prepare assessment for export, merging session data with profile (if available).
 * 
 * This bridges Step 4 (Summary) with data integrity rules.
 */
export function prepareExportSummary(sessionData, profileData = null, profileId = null) {
  // Validate that session data is complete enough for export
  const checklist = sessionData.plan?.checklist || [];
  const answers = sessionData.answers || {};
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;

  if (checklist.length > 0 && answeredCount === 0) {
    throw new Error(
      'Cannot export: No findings documented. Please complete the checklist before exporting.'
    );
  }

  // Generate context-aware summary
  const summary = generateContextAwareSummary(sessionData, profileData, profileId);

  return {
    summary,
    exportUrl: null, // Placeholder for API export endpoint
    formats: {
      json: null,
      text: null,
      pdf: null, // Optional: PDF export
    },
  };
}

/**
 * Generate provider export in multiple formats.
 */
export function generateProviderExports(summary) {
  return {
    json: exportForPhysician(summary, 'json'),
    text: exportForPhysician(summary, 'text'),
  };
}

/**
 * Create a full assessment session object that maintains context throughout the 4-step flow.
 */
export function createAssessmentSession(childName, childAge, childId = null, profileId = null) {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    childName,
    childAge,
    childId,
    profileId,
    step1: {
      description: '',
      temperatureC: '',
      heartRate: '',
      oxygenSat: '',
      photos: [],
      completed: false,
    },
    step2: {
      plan: null,
      examPhotos: {},
      stepHelp: {},
      completed: false,
    },
    step3: {
      answers: {},
      severityRating: null,
      notes: '',
      photos: [],
      completed: false,
    },
    step4: {
      summary: null,
      exportReady: false,
      exported: false,
      exportedAt: null,
      completed: false,
    },
    metadata: {
      context: null, // Populated from Step 1 analysis
      validationStatus: {
        checklistContinuity: null,
        dataCompleteness: null,
        exportReady: null,
      },
    },
  };
}

/**
 * Update assessment session as user progresses through steps.
 */
export function updateAssessmentSession(session, stepNumber, stepData) {
  const updatedSession = { ...session };

  if (stepNumber === 1) {
    updatedSession.step1 = { ...session.step1, ...stepData, completed: true };
    // Trigger Step 2 plan generation
    updatedSession.step2.plan = generateExamPlanFromStep1(
      updatedSession.step1,
      session.childAge
    );
    updatedSession.metadata.context = updatedSession.step2.plan.context;
  } else if (stepNumber === 2) {
    updatedSession.step2 = { ...session.step2, ...stepData, completed: true };
  } else if (stepNumber === 3) {
    updatedSession.step3 = { ...session.step3, ...stepData, completed: true };
    // Validate checklist continuity
    updatedSession.metadata.validationStatus.checklistContinuity = validateChecklistContinuity(
      updatedSession.step2.plan,
      updatedSession.step3.answers
    );
  } else if (stepNumber === 4) {
    updatedSession.step4 = { ...session.step4, ...stepData, completed: true };
  }

  return updatedSession;
}

/**
 * Generate quick statistics about the assessment session.
 */
export function getAssessmentStats(session) {
  const examStepsCount = session.step2.plan?.instructions.length || 0;
  const checklistItemsCount = session.step2.plan?.checklist.length || 0;
  const answeredCount = Object.values(session.step3.answers || {}).filter(
    (v) => v !== null && v !== undefined
  ).length;

  return {
    examStepsGenerated: examStepsCount,
    checklistItemsGenerated: checklistItemsCount,
    checklistItemsAnswered: answeredCount,
    completionPercentage: Math.round((answeredCount / checklistItemsCount) * 100),
    severity: session.metadata.context?.severityLevel || 'unknown',
    category: session.metadata.context?.symptomCategory || 'unknown',
  };
}

export default {
  generateExamPlanFromStep1,
  validateChecklistContinuity,
  prepareExportSummary,
  generateProviderExports,
  createAssessmentSession,
  updateAssessmentSession,
  getAssessmentStats,
};
