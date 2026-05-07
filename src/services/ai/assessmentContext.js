/**
 * assessmentContext.js
 * 
 * Context-aware assessment logic for Dampi symptom logging.
 * Implements strict data integrity rules and dynamic exam generation.
 * 
 * Flow:
 * 1. Input Analysis — Extract Child's Age, Symptom Category, Severity Level
 * 2. Dynamic Physical Examination — Generate AI-guided exam steps (personalized by age & category)
 * 3. Finding-Driven Checklist — Create checklist items linked to exam steps
 * 4. Data Integrity & Summary — Merge with profile data or limit to guest findings
 */

// ============================================================================
// STEP 1: INPUT ANALYSIS
// ============================================================================

/**
 * Extract age, category, and severity from user's initial description.
 * Returns normalized assessment context.
 */
export function analyzeInput(description, childAge) {
  // Parse description for symptom keywords and severity indicators
  const description_lower = (description || '').toLowerCase();

  // Extract symptom category
  const category = detectSymptomCategory(description_lower);

  // Extract severity from description keywords and vital signs context
  const severity = detectSeverity(description_lower);

  return {
    childAge: parseInt(childAge) || null,
    symptomCategory: category,
    severityLevel: severity,
    rawDescription: description,
  };
}

/**
 * Detect primary symptom category from description keywords.
 * Categories: respiratory, digestive, dermatological, fever, neurological, other
 */
function detectSymptomCategory(descriptionLower) {
  const categories = {
    respiratory: ['cough', 'ubo', 'congestion', 'sneezing', 'bahing', 'runny nose', 'blocked nose', 'breathing', 'shortness'],
    digestive: ['vomit', 'diarrhea', 'stomach', 'abdominal', 'nausea', 'regurgitate', 'bowel', 'constipation', 'poop', 'pag-iisip'],
    dermatological: ['rash', 'pantal', 'itch', 'skin', 'wound', 'sore', 'blister', 'burn', 'hives'],
    fever: ['fever', 'lagnat', 'temp', 'hot', 'warm to touch', 'sweating', 'chills'],
    neurological: ['headache', 'sakit ng ulo', 'dizziness', 'vertigo', 'weakness', 'numbness', 'seizure', 'convulsion'],
    ear_nose_throat: ['ear', 'tenga', 'sore throat', 'halitosis', 'mouth', 'throat'],
    eye: ['eye', 'mata', 'vision', 'squint', 'discharge', 'red eye'],
    musculoskeletal: ['bone', 'muscle', 'joint', 'limb', 'fracture', 'sprain', 'pain'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => descriptionLower.includes(kw))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Detect severity level from keywords in description.
 * Levels: mild, moderate, severe
 */
function detectSeverity(descriptionLower) {
  const severeKeywords = [
    'severe', 'serious', 'critical', 'emergency', 'can\'t breathe', 'unconscious',
    'limp', 'pale', 'extremely', 'worst', 'worst ever', 'can\'t move',
  ];
  const moderateKeywords = [
    'persistent', 'recurring', 'frequent', 'getting worse', 'moderate',
    'quite a bit', 'quite painful', 'very uncomfortable',
  ];

  if (severeKeywords.some((kw) => descriptionLower.includes(kw))) {
    return 'severe';
  }
  if (moderateKeywords.some((kw) => descriptionLower.includes(kw))) {
    return 'moderate';
  }
  return 'mild';
}

// ============================================================================
// STEP 2: DYNAMIC PHYSICAL EXAMINATION GENERATION
// ============================================================================

/**
 * Generate age-specific and symptom-specific physical examination steps.
 * Quantity depends on severity:
 * - Mild: 3 steps
 * - Moderate: 4-5 steps
 * - Severe: 5-6 steps
 * 
 * Returns array of exam instruction objects with: id, title, detail, tip
 */
export function generateDynamicExam(context) {
  const { childAge, symptomCategory, severityLevel } = context;

  // Determine quantity of steps based on severity
  const stepCounts = {
    mild: 3,
    moderate: Math.random() > 0.5 ? 4 : 5,
    severe: Math.random() > 0.5 ? 5 : 6,
  };

  const quantity = stepCounts[severityLevel] || 3;

  // Get base exam steps for category
  const baseSteps = getExamStepsForCategory(symptomCategory);

  // Personalize steps for child's age
  const personalizedSteps = baseSteps.map((step) =>
    personalizeForAge(step, childAge, symptomCategory)
  );

  // Return appropriate quantity, prioritizing most relevant steps
  return personalizedSteps.slice(0, quantity);
}

/**
 * Get base examination steps for a given symptom category.
 * Each step is concrete and actionable.
 */
function getExamStepsForCategory(category) {
  const examSteps = {
    respiratory: [
      {
        id: 'resp_1',
        title: 'Visual Respiratory Assessment',
        detail: 'Observe the child\'s breathing pattern. Watch the chest and belly rise and fall. Count breaths per minute for 30 seconds and multiply by 2. Normal rate depends on age (faster for younger children).',
        tip: 'A calm child gives the most accurate count. Distract them with a toy if needed.',
      },
      {
        id: 'resp_2',
        title: 'Breathing Difficulty Check',
        detail: 'Look for signs: using neck/belly muscles to breathe, flaring nostrils, or pausing mid-breath. Listen for wheezing or whistling sounds.',
        tip: 'Place your hand gently on the child\'s shoulder to feel chest movement.',
      },
      {
        id: 'resp_3',
        title: 'Lung Auscultation (Listen)',
        detail: 'Place your ear or a stethoscope on the child\'s back (both sides) and front (both sides). Listen for clear air entry, wheezing, or crackling sounds. Have the child breathe deeply and cough.',
        tip: 'Ask child to say "ahhhh" or hum to hear lungs clearly. Do this in a quiet room.',
      },
      {
        id: 'resp_4',
        title: 'Cough Assessment',
        detail: 'Note the cough type: dry, moist, barking, or sporadic. Listen to the sound and force. Ask when cough started and what time it worsens.',
        tip: 'Record a short cough sound on your phone if possible for the doctor.',
      },
      {
        id: 'resp_5',
        title: 'Oxygen & Circulation Check',
        detail: 'Look at lips, fingernails, and mucous membranes (gums, inside cheek). They should be pink. Check nail color — blue or pale nails may indicate poor oxygen.',
        tip: 'Press a fingernail gently for 2 seconds, release, and count how fast color returns (should be instant).',
      },
      {
        id: 'resp_6',
        title: 'Associated Symptom Screen',
        detail: 'Ask: Is there fever? Any vomiting? Abdominal pain? Unusual sleepiness? These can change the picture significantly.',
        tip: 'Write down all associated symptoms — they help the doctor understand the full picture.',
      },
    ],
    digestive: [
      {
        id: 'dig_1',
        title: 'Visual Abdominal Inspection',
        detail: 'Have the child lie down (or sit comfortably). Look at the belly: Is it bloated, sunken, or normal? Any visible rashes, bruising, or unusual markings?',
        tip: 'Ensure good lighting. Compare the belly to how it normally looks.',
      },
      {
        id: 'dig_2',
        title: 'Gentle Abdominal Palpation (Pressing)',
        detail: 'Warm your hands. Gently press different areas of the belly with your fingertips. Ask "Does this hurt?" Press slowly and avoid sudden pressure. Key areas: upper middle (stomach), both sides (flanks), lower abdomen, belly button area.',
        tip: 'Start in an area where there\'s no pain, then move toward suspected problem areas.',
      },
      {
        id: 'dig_3',
        title: 'Lower Right Quadrant Assessment (appendix area)',
        detail: 'Gently press the lower right side of the belly. This is where appendicitis pain often appears. Note any guarding (child tensing muscles) or pain.',
        tip: 'If the child pulls away or cries, note this — it\'s important information.',
      },
      {
        id: 'dig_4',
        title: 'Hydration & Stool Assessment',
        detail: 'Check lips and mouth — are they moist or dry? Ask about last bowel movement: When? Consistency? Color? Any blood or mucus? Ask about urine: Normal color and frequency?',
        tip: 'Take a photo of soiled diaper or stool if blood/unusual color is present.',
      },
      {
        id: 'dig_5',
        title: 'Vomit Content Assessment',
        detail: 'If vomiting occurred, examine any vomit. Note color (clear, white, yellow, greenish, bloody), frequency, and force (projectile vs. passive).',
        tip: 'Collect a sample in a small container or bag to show the doctor.',
      },
      {
        id: 'dig_6',
        title: 'Rebound Tenderness Check',
        detail: 'Press gently into the belly, then suddenly release pressure. Rebound pain (pain on release) can indicate peritoneal inflammation. Do this very gently on a child.',
        tip: 'Only do this if the child is calm and cooperative.',
      },
    ],
    dermatological: [
      {
        id: 'derm_1',
        title: 'Rash Visualization & Mapping',
        detail: 'Examine the rash carefully. Note: location (where did it start?), size of individual lesions, shape (round, irregular, linear), pattern (clustered, scattered, banded), color (red, pink, purple, brown).',
        tip: 'Use a ruler or your finger width to estimate size. Take clear photos with good lighting and skin tone visible.',
      },
      {
        id: 'derm_2',
        title: 'Blanch Test',
        detail: 'Press your finger on the rash. If the rash turns white/pale and then returns to color, it blanches (normal). If it stays red/purple, it may not blanch (concerning for petechiae).',
        tip: 'Non-blanching rashes with fever can be serious — note this for the doctor.',
      },
      {
        id: 'derm_3',
        title: 'Texture & Elevation Check',
        detail: 'Gently feel the rash. Is it flat, raised, bumpy, scaly, crusted, or weeping? Run your fingertip across it (without pressing hard).',
        tip: 'Describe texture in simple terms: smooth, bumpy, scaly, crusty, oozing.',
      },
      {
        id: 'derm_4',
        title: 'Spread Pattern & Timeline',
        detail: 'Ask: When did it first appear? Where? Is it spreading? How fast? Is it painful, itchy, or painless? Does scratching make it worse?',
        tip: 'A photo timeline (morning, afternoon, evening) helps the doctor see progression.',
      },
      {
        id: 'derm_5',
        title: 'Associated Symptoms Screen',
        detail: 'Any fever? Sore throat? Joint pain? Cough? Diarrhea? Rashes with systemic symptoms narrow down the diagnosis significantly.',
        tip: 'Write down all associated symptoms — they help determine if this is systemic (whole body) or localized.',
      },
    ],
    fever: [
      {
        id: 'fever_1',
        title: 'Temperature Verification',
        detail: 'Take temperature using a reliable thermometer (digital is most accurate). Axillary (armpit) or forehead for young children; oral for older children. Note exact temperature and time taken.',
        tip: 'Wait 10 minutes after activity (eating, drinking, crying) for most accurate reading. Repeat after 15 minutes if unsure.',
      },
      {
        id: 'fever_2',
        title: 'Fever Pattern Documentation',
        detail: 'Has fever been constant or on-and-off? When did it start? Does it spike at specific times? Has fever responded to paracetamol or ibuprofen?',
        tip: 'Keep a fever log: time, temperature, symptoms at each measurement.',
      },
      {
        id: 'fever_3',
        title: 'Physical Response to Fever',
        detail: 'Observe: Is the child sweating excessively? Shivering? Complaining of chills? Lips pale or flushed? Extremities warm or cold?',
        tip: 'Severe chills or dramatic temperature swings can indicate serious infection.',
      },
      {
        id: 'fever_4',
        title: 'Associated Symptoms Screening',
        detail: 'Fever alone is a symptom. Ask about: cough, sore throat, rash, vomiting, diarrhea, abdominal pain, irritability, lethargy, difficulty waking.',
        tip: 'Write down ALL other symptoms — they point to the underlying cause.',
      },
      {
        id: 'fever_5',
        title: 'Red Flag Fever Assessment',
        detail: 'Pay special attention to: high fever (>39.5°C) in infant <3 months, stiff neck with fever, difficulty breathing, altered consciousness, or non-blanching rash with fever.',
        tip: 'These require immediate ER evaluation. Do not delay seeking care.',
      },
    ],
    neurological: [
      {
        id: 'neuro_1',
        title: 'Consciousness & Responsiveness',
        detail: 'Is the child alert and fully responsive? Can they recognize you? Follow simple commands ("touch your nose")? Do they answer questions appropriately?',
        tip: 'Decreased alertness with fever or illness is always concerning.',
      },
      {
        id: 'neuro_2',
        title: 'Headache Localization & Character',
        detail: 'Ask: Where does it hurt? One side or both? Front, back, or all over? Stabbing, throbbing, or constant pressure? When did it start?',
        tip: 'Use a drawing of the head and have child point to where it hurts.',
      },
      {
        id: 'neuro_3',
        title: 'Neck Flexibility & Stiffness',
        detail: 'Gently try to touch the child\'s chin to their chest. Resistance or pain ("stiff neck") is concerning, especially with fever. Also check side-to-side rotation.',
        tip: 'If there\'s resistance or the child cries in pain with this movement + fever, go to ER immediately.',
      },
      {
        id: 'neuro_4',
        title: 'Pupil & Eye Reaction Check',
        detail: 'Look at pupils (dark centers of eyes). Are they equal size? Do they shrink when you shine light on them? Can the child focus and track your finger as you move it?',
        tip: 'Unequal pupils or pupils not responding to light are concerning.',
      },
      {
        id: 'neuro_5',
        title: 'Muscle Strength & Coordination',
        detail: 'Ask the child to: squeeze your hands, kick legs, walk, hop, or perform simple movements. Note any weakness, tremor, or imbalance.',
        tip: 'Compare left vs. right side — asymmetry is important information.',
      },
    ],
    ear_nose_throat: [
      {
        id: 'ent_1',
        title: 'Ear Inspection',
        detail: 'Look at the outer ear for redness, swelling, or discharge. Gently tug the ear — is there pain? Look inside the ear canal if there\'s discharge or suspected buildup.',
        tip: 'Pain with gentle tugging suggests ear infection. Discharge may be pus or fluid.',
      },
      {
        id: 'ent_2',
        title: 'Throat Examination',
        detail: 'Have the child open wide and say "ahhhh". Use a flashlight to see: Are tonsils present? Enlarged? Red? Any white/yellow coating? Redness of throat?',
        tip: 'Exudative (white coating) throats often indicate bacterial infection.',
      },
      {
        id: 'ent_3',
        title: 'Nasal Passage Check',
        detail: 'Look at nostrils for redness, swelling, discharge (clear, mucus, pus-like). Ask: Which side feels blocked? Any facial pressure or sinus tenderness?',
        tip: 'Gently press above the cheekbones and below the eyes — tenderness suggests sinus involvement.',
      },
      {
        id: 'ent_4',
        title: 'Lymph Node Assessment',
        detail: 'Feel gently along the neck (both sides) just below the jaw, and along the collarbone. Any swollen, tender, or firm lumps?',
        tip: 'Swollen lymph nodes + sore throat often indicate viral or bacterial infection.',
      },
    ],
    eye: [
      {
        id: 'eye_1',
        title: 'Visual Inspection',
        detail: 'Look at both eyes. Are they the same size? Any redness, puffiness, or discharge? Is the white of the eye pink or very red?',
        tip: 'Note color of discharge if present: clear, white, yellow, or green.',
      },
      {
        id: 'eye_2',
        title: 'Vision Check',
        detail: 'Ask the child to look at distant objects and close objects. Can they see clearly? Any squinting or head tilting? Compare left and right eye.',
        tip: 'If they\'re squinting or tilting their head, vision may be affected.',
      },
      {
        id: 'eye_3',
        title: 'Pupil Reaction',
        detail: 'Shine a light at the eye. Do both pupils shrink equally? Check near and far focusing — do pupils constrict when looking at near object?',
        tip: 'Unequal or non-reactive pupils are concerning.',
      },
      {
        id: 'eye_4',
        title: 'Eye Movement & Coordination',
        detail: 'Have the child follow your finger as you move it in different directions. Any difficulty tracking? Nystagmus (involuntary eye movement)?',
        tip: 'Difficulty with coordinated eye movement can indicate neurological issue.',
      },
    ],
    musculoskeletal: [
      {
        id: 'msk_1',
        title: 'Injury Site Inspection',
        detail: 'Look at the injured area: swelling, bruising, color change, deformity, or skin damage? Compare to the other side of the body.',
        tip: 'Take clear photos from multiple angles, especially of bruising or swelling.',
      },
      {
        id: 'msk_2',
        title: 'Gentle Movement & Range',
        detail: 'Ask the child to move the affected limb gently. Can they move it fully? Is there pain at specific angles? Is motion limited?',
        tip: 'Do not force movement. Ask "Does it hurt?" and stop if they say yes.',
      },
      {
        id: 'msk_3',
        title: 'Swelling & Warmth Check',
        detail: 'Feel the injured area gently. Is it swollen? Warm to touch? Tender at specific points (bony landmarks vs. soft tissue)?',
        tip: 'Warmth + swelling + pain suggests inflammation. Cold + swelling suggests acute injury.',
      },
      {
        id: 'msk_4',
        title: 'Deformity or Alignment Assessment',
        detail: 'Compare the injured limb to the uninjured one. Is there obvious deformity or misalignment? Is the limb shortened or rotated?',
        tip: 'Any deformity suggests possible fracture — seek immediate care.',
      },
    ],
    other: [
      {
        id: 'other_1',
        title: 'Visual General Assessment',
        detail: 'Observe the child\'s overall appearance: Alert or drowsy? Normal or pale/flushed? Comfortable or in pain? Hydrated (moist lips, tears) or dehydrated?',
        tip: 'General appearance often tells you how sick a child is.',
      },
      {
        id: 'other_2',
        title: 'Vital Signs Baseline',
        detail: 'Record: temperature, heart rate (pulse), respiratory rate, and blood pressure if you have a cuff. Normal ranges vary by age.',
        tip: 'Take vitals when the child is calm for most accurate readings.',
      },
      {
        id: 'other_3',
        title: 'Hydration Status Check',
        detail: 'Look at: lips and mouth (moist or dry?), tears when crying, skin turgor (pinch skin gently — does it return to normal quickly?), urine output (normal or decreased?).',
        tip: 'Severe dehydration is a medical emergency.',
      },
      {
        id: 'other_4',
        title: 'Associated Symptom Screen',
        detail: 'Ask about ALL body systems: fever, rash, cough, vomiting, diarrhea, abdominal pain, headache, joint pain. This helps narrow diagnosis.',
        tip: 'Write down every symptom, no matter how minor it seems.',
      },
    ],
  };

  return examSteps[category] || examSteps.other;
}

/**
 * Personalize exam steps for the child's age.
 * Adjusts language, technique, and positioning for developmental stage.
 */
function personalizeForAge(step, childAge, category) {
  let ageAdjustment = '';

  if (childAge < 2) {
    ageAdjustment = ' Do this while they are calm, possibly sleeping or distracted with a toy.';
  } else if (childAge < 5) {
    ageAdjustment = ' Make it fun — turn it into a game or use their favorite toy to help them cooperate.';
  } else if (childAge < 10) {
    ageAdjustment = ' Explain what you\'re doing in simple terms. Ask them to help and give feedback.';
  } else {
    ageAdjustment = ' Involve them in the process. Explain why you\'re doing each step.';
  }

  return {
    ...step,
    detail: step.detail + ageAdjustment,
  };
}

// ============================================================================
// STEP 3: FINDING-DRIVEN CHECKLIST GENERATION
// ============================================================================

/**
 * Generate finding checklist items directly corresponding to exam steps.
 * Each checklist item asks about the finding from a specific exam step.
 */
export function generateChecklistFromExam(examSteps) {
  return examSteps.map((step) => ({
    id: `finding_${step.id}`,
    examStepId: step.id,
    examStepTitle: step.title,
    question: generateChecklistQuestion(step),
    type: 'yesno', // Normal/Abnormal toggle
    placeholder: 'Select outcome',
  }));
}

/**
 * Generate finding question based on exam step.
 */
function generateChecklistQuestion(step) {
  // Map exam step titles to findings questions
  const questionMap = {
    'Visual Respiratory Assessment': 'Breathing pattern appears normal?',
    'Breathing Difficulty Check': 'Any signs of breathing difficulty (retractions, flaring)?',
    'Lung Auscultation (Listen)': 'Lungs sound clear on both sides?',
    'Cough Assessment': 'Cough documented (type, frequency)?',
    'Oxygen & Circulation Check': 'Color of lips and nails normal (pink)?',
    'Associated Symptom Screen': 'Associated symptoms documented?',
    'Visual Abdominal Inspection': 'Abdomen appears normal (not bloated or sunken)?',
    'Gentle Abdominal Palpation (Pressing)': 'Abdomen soft to palpation (no tenderness)?',
    'Lower Right Quadrant Assessment (appendix area)': 'Lower right abdomen tender or guarded?',
    'Hydration & Stool Assessment': 'Hydration status adequate (moist lips, normal urine)?',
    'Vomit Content Assessment': 'Vomit appearance documented (color, frequency)?',
    'Rebound Tenderness Check': 'Rebound tenderness present?',
    'Rash Visualization & Mapping': 'Rash location, size, and appearance documented?',
    'Blanch Test': 'Rash blanches (turns white, then returns to color)?',
    'Texture & Elevation Check': 'Rash texture documented (flat, raised, bumpy, etc.)?',
    'Spread Pattern & Timeline': 'Rash spread pattern and timeline documented?',
    'Associated Symptoms Screen': 'Associated symptoms (fever, sore throat, etc.) documented?',
    'Temperature Verification': 'Temperature accurately measured and recorded?',
    'Fever Pattern Documentation': 'Fever pattern documented (constant, intermittent, response to medication)?',
    'Physical Response to Fever': 'Physical response to fever observed and noted?',
    'Consciousness & Responsiveness': 'Child alert and fully responsive?',
    'Headache Localization & Character': 'Headache location and character described?',
    'Neck Flexibility & Stiffness': 'Neck flexible (no stiffness or pain with movement)?',
    'Pupil & Eye Reaction Check': 'Pupils equal and reactive to light?',
    'Muscle Strength & Coordination': 'Muscle strength and coordination normal?',
    'Ear Inspection': 'Ears appear normal (no redness, swelling, discharge)?',
    'Throat Examination': 'Throat appears normal (no excessive redness or coating)?',
    'Nasal Passage Check': 'Nasal passages clear (no obstruction or discharge)?',
    'Lymph Node Assessment': 'Lymph nodes normal (not enlarged or tender)?',
    'Visual Inspection': 'Eyes appear normal (no redness, puffiness, discharge)?',
    'Vision Check': 'Vision appears normal (can focus clearly)?',
    'Pupil Reaction': 'Pupils equal and reactive?',
    'Eye Movement & Coordination': 'Eyes move smoothly and coordinated?',
    'Injury Site Inspection': 'Injury site appearance documented (swelling, bruising)?',
    'Gentle Movement & Range': 'Full range of motion present (no pain with movement)?',
    'Swelling & Warmth Check': 'Swelling and warmth documented?',
    'Deformity or Alignment Assessment': 'Alignment normal (no deformity)?',
    'Visual General Assessment': 'Child appears well (alert, comfortable, hydrated)?',
    'Vital Signs Baseline': 'All vital signs documented?',
    'Hydration Status Check': 'Hydration status normal?',
  };

  return questionMap[step.title] || `Finding from step "${step.title}" documented?`;
}

// ============================================================================
// STEP 4: DATA INTEGRITY & SUMMARY GENERATION
// ============================================================================

/**
 * Generate structured medical summary with data integrity rules.
 * Merges session data with profile data (if registered) or limits to guest findings.
 */
export function generateContextAwareSummary(sessionData, profileData = null, profileId = null) {
  const hasProfile = profileId && profileData;

  const summary = {
    // Common fields (always included)
    child_name: hasProfile ? profileData.full_name : sessionData.childName || 'Child (Name not provided)',
    child_age: sessionData.childAge || 'Not specified',
    date_of_session: sessionData.sessionDate || new Date().toISOString().split('T')[0],
    profile_id: profileId || null,
    is_registered_profile: hasProfile,

    // Profile data (only if registered)
    ...(hasProfile && {
      date_of_birth: profileData.date_of_birth,
      hmo_id: profileData.hmo_id || null,
      allergies: profileData.allergies || 'None documented',
      registered_medical_conditions: profileData.medical_history || null,
    }),

    // Session findings (always included)
    session_findings: {
      chief_complaint: sessionData.chiefComplaint || sessionData.description || null,
      symptom_category: sessionData.symptomCategory || null,
      severity_level: sessionData.severityLevel || null,
      onset_and_duration: sessionData.duration || null,
      associated_symptoms: sessionData.associatedSymptoms || [],
      vital_signs: extractVitalSigns(sessionData),
      medications_taken: sessionData.medicationsGiven || null,
      exam_steps_completed: sessionData.examStepsCount || 0,
      findings_documented: sessionData.answers || {},
      overall_severity_rating: sessionData.severityRating || null,
      parent_observations: sessionData.parentNotes || null,
    },

    // Data integrity metadata
    data_completeness: calculateDataCompleteness(sessionData),
    provider_export_ready: validateProviderReady(sessionData, hasProfile),
    restrictions: hasProfile ? null : 'Guest assessment — limited to session findings only. Cannot access stored medical history.',
  };

  return summary;
}

/**
 * Extract vital signs from session data into structured format.
 */
function extractVitalSigns(sessionData) {
  return {
    temperature_c: sessionData.temperatureC || null,
    heart_rate_bpm: sessionData.heartRate || null,
    oxygen_saturation: sessionData.oxygenSat || null,
    respiratory_rate: sessionData.respiratoryRate || null,
    blood_pressure: sessionData.bloodPressure || null,
  };
}

/**
 * Calculate data completeness percentage for quality assurance.
 */
function calculateDataCompleteness(sessionData) {
  const requiredFields = [
    'description',
    'temperatureC',
    'answers', // Checklist answers
    'severityRating',
  ];

  const completed = requiredFields.filter((field) => {
    const value = sessionData[field];
    return value !== null && value !== undefined && value !== '' && Object.keys(value || {}).length > 0;
  }).length;

  return Math.round((completed / requiredFields.length) * 100);
}

/**
 * Validate if summary is ready for physician export.
 * Checks for required fields and data quality.
 */
function validateProviderReady(sessionData, hasProfile) {
  const hasChiefComplaint = sessionData.description && sessionData.description.trim().length > 10;
  const hasTemperature = sessionData.temperatureC !== null && sessionData.temperatureC !== '';
  const hasFindings = sessionData.answers && Object.keys(sessionData.answers).length > 0;
  const hasSeverity = sessionData.severityRating !== null && sessionData.severityRating !== undefined;

  const baseRequirementsMet = hasChiefComplaint && hasTemperature && hasFindings && hasSeverity;

  // For registered profiles, require additional info
  if (hasProfile) {
    return baseRequirementsMet; // All additional data comes from profile
  }

  // For guest profiles, just need the base requirements
  return baseRequirementsMet;
}

/**
 * Export summary in physician-friendly format (JSON or plain text).
 */
export function exportForPhysician(summary, format = 'json') {
  if (format === 'text') {
    return formatSummaryAsText(summary);
  }
  return JSON.stringify(summary, null, 2);
}

/**
 * Format summary as plain text for easy printing/sharing.
 */
function formatSummaryAsText(summary) {
  const lines = [
    '=== PEDIATRIC HEALTH ASSESSMENT SUMMARY ===',
    `Generated by Dampi on ${new Date().toISOString().split('T')[0]}`,
    '',
    `Child Name: ${summary.child_name}`,
    `Age: ${summary.child_age}`,
    ...(summary.date_of_birth ? [`Date of Birth: ${summary.date_of_birth}`] : []),
    ...(summary.hmo_id ? [`HMO ID: ${summary.hmo_id}`] : []),
    ...(summary.allergies ? [`Allergies: ${summary.allergies}`] : []),
    '',
    '--- SESSION FINDINGS ---',
    `Chief Complaint: ${summary.session_findings.chief_complaint || 'Not specified'}`,
    `Symptom Category: ${summary.session_findings.symptom_category || 'Not specified'}`,
    `Severity Level: ${summary.session_findings.severity_level || 'Not specified'}`,
    `Onset/Duration: ${summary.session_findings.onset_and_duration || 'Not specified'}`,
    '',
    '--- VITAL SIGNS ---',
    `Temperature: ${summary.session_findings.vital_signs.temperature_c || 'Not recorded'}°C`,
    `Heart Rate: ${summary.session_findings.vital_signs.heart_rate_bpm || 'Not recorded'} bpm`,
    `Oxygen Sat: ${summary.session_findings.vital_signs.oxygen_saturation || 'Not recorded'}%`,
    '',
    '--- ASSOCIATED SYMPTOMS ---',
    ...(summary.session_findings.associated_symptoms.length > 0
      ? summary.session_findings.associated_symptoms.map((s) => `• ${s}`)
      : ['None documented']),
    '',
    `Overall Severity Rating: ${summary.session_findings.overall_severity_rating || 'Not rated'}/10`,
    `Data Completeness: ${summary.data_completeness}%`,
    `Ready for Physician Export: ${summary.provider_export_ready ? 'Yes' : 'No'}`,
    '',
    summary.restrictions ? `⚠️ RESTRICTIONS: ${summary.restrictions}` : 'Full profile data available.',
  ];

  return lines.join('\n');
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  analyzeInput,
  generateDynamicExam,
  generateChecklistFromExam,
  generateContextAwareSummary,
  exportForPhysician,
};
