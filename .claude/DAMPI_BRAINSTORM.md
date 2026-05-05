# Dampi: Client-Side Product Brainstorm

## Product Overview

**Dampi** is a family health journal for tracking and organizing health concerns (medical + mental/behavioral) with AI-assisted documentation. Parents create archived, doctor-ready summaries from natural conversations with our AI.

**Core Value:**
- Parent describes what they're noticing about their child(ren)
- AI extracts and organizes with medical history context
- Doctor gets a structured, printable summary they can actually use
- Family members can contribute (with parental permission)

---

## User Flows

### Flow 1: New User Onboarding
```
1. Welcome screen (explain Dampi)
2. Create account (email/phone)
3. Add first child
   - Name, DOB, gender
   - (Optional) Medical history
4. Invite family members (optional, can skip)
5. → Home Dashboard
```

### Flow 2: Home Dashboard
```
Parent lands here after onboarding.

View:
- List of registered children (cards with profile pic, age, last health update)
- Recent Essentials (past logs, grouped by child)
- Quick actions per child: "+ Add Essential", "View History", "Medical Profile"
- Family member list with permissions
```

### Flow 3: Adding an Essential
```
Parent presses "+ Add Essential" for a child.

Choose how to log:
  A) AI Chat (guided conversation) → Recommended, default
  B) Manual Form (structured fields)
  
[If AI Chat selected]
  1. AI says: "Hi! I'm here to help. Tell me what you've noticed about [Child Name]."
  2. Parent types/speaks observation (freeform)
  3. AI retrieves relevant medical history:
     - "I see [Child Name] had a fever last month. Is this related?"
     - Shows chronic conditions, allergies, past diagnoses
  4. AI asks clarifying questions (guided):
     - "How long has this been happening?"
     - "Any other symptoms you've noticed?"
     - "Has [Child Name] been eating/sleeping normally?"
  5. AI never generates medical info—only asks, listens, structures
  6. Parent confirms: "Is this accurate?"
  7. AI generates one-page summary
     - Current observations (extracted)
     - Medical history (from profile)
     - Relevant past Essentials (timeline)
     - Formatted for doctor
  8. Parent can:
     - Add optional doctor notes
     - Print / Export (PDF/DOCX)
     - Share (link/email)
     - Archive (save in history)
```

### Flow 4: Viewing Medical History & Permissions
```
Parent taps "Medical Profile" for a child.

View:
- Allergies (food, drug, environmental)
- Chronic conditions (editable, toggles for privacy)
- Previous diagnoses (toggleable—can hide from Essential summaries)
- Current medications
- Immunizations/vaccines (timeline)
- Mental health notes

Also here:
- Family member permissions matrix
  - "Grandma can log Essentials for [Child]? Yes/No + Read/Write/View"
  - "Uncle can see medical history? Yes/No"
  - All actions logged (audit trail)
```

---

## Information Architecture

### Screens
```
1. Onboarding
   ├─ Welcome
   ├─ Account Creation
   ├─ Add Child
   └─ Invite Family (optional)

2. Home / Dashboard
   ├─ Child Cards (list)
   └─ Recent Essentials (timeline)

3. Child Profile
   ├─ Medical History (allergies, conditions, meds, vaccines, mental health)
   ├─ Essentials History (timeline of logs)
   ├─ Family Permissions
   └─ Settings

4. Add Essential
   ├─ Choose Method (AI Chat / Manual Form)
   ├─ AI Chat Interface (guided conversation)
   │  └─ Summary Preview & Export
   └─ Manual Form (alternative)

5. Essential Summary / View
   ├─ Current Observations (extracted)
   ├─ Medical History Context
   ├─ Past Essentials (related)
   ├─ Doctor Notes Field (optional, toggleable)
   ├─ Actions: Print, Export, Share, Archive
   └─ Edit / View History

6. Settings / Account
   ├─ Profile (parent info)
   ├─ Children (manage, add/remove)
   ├─ Family Members (invite, permissions, audit log)
   └─ App Settings (language, notifications, etc.)
```

---

## Data Model

### Child Profile
```json
{
  "id": "uuid",
  "name": "string",
  "dateOfBirth": "ISO 8601",
  "gender": "male | female | other",
  "profilePicture": "url or blob",
  "createdAt": "timestamp",
  "medicalHistory": { /* see below */ },
  "essentials": [ /* array of Essential IDs */ ]
}
```

### Medical History
```json
{
  "childId": "uuid",
  "allergies": [
    { "type": "food | drug | environmental", "name": "string", "severity": "mild | moderate | severe" }
  ],
  "chronicConditions": [
    { "name": "string", "onsetDate": "ISO 8601", "status": "active | managed | resolved" }
  ],
  "previousDiagnoses": [
    { "name": "string", "date": "ISO 8601", "disclosed": true | false }
  ],
  "currentMedications": [
    { "name": "string", "dosage": "string", "frequency": "string", "startDate": "ISO 8601" }
  ],
  "immunizations": [
    { "vaccine": "string", "date": "ISO 8601", "nextDueDate": "ISO 8601" }
  ],
  "mentalHealth": [
    { "note": "string", "date": "ISO 8601", "category": "behavioral | developmental | emotional" }
  ],
  "lastUpdated": "timestamp"
}
```

### Essential (Health Log)
```json
{
  "id": "uuid",
  "childId": "uuid",
  "createdByUserId": "uuid",
  "createdAt": "timestamp",
  "loggedAt": "timestamp (when parent logged the observation)",
  
  "rawObservation": "string (parent's original freeform description)",
  "extractedData": {
    "primaryConcern": "string",
    "symptoms": ["string"],
    "duration": "string",
    "severity": "mild | moderate | severe",
    "context": "string (what triggered it, what they tried, etc.)"
  },
  
  "relevantHistory": {
    "linkedPastEssentials": ["uuid"],
    "applicableConditions": ["string"],
    "applicableAllergies": ["string"],
    "applicableMedications": ["string"]
  },
  
  "summary": {
    "title": "string",
    "observations": "formatted text for doctor",
    "medicalContext": "formatted text (history, conditions, meds)",
    "timeline": "formatted text",
    "recommendations": "suggestions for where to seek help"
  },
  
  "doctorNotes": "string (optional, added during or after visit)",
  "doctorNotesToggle": true | false,
  
  "status": "draft | completed | archived",
  "exports": [
    { "format": "pdf | docx", "generatedAt": "timestamp", "url": "string" }
  ],
  "shareLinks": [
    { "token": "string", "createdAt": "timestamp", "expiresAt": "timestamp" }
  ]
}
```

### Family Member & Permissions
```json
{
  "id": "uuid",
  "parentUserId": "uuid",
  "memberUserId": "uuid",
  "memberEmail": "string",
  "role": "parent | caregiver | family",
  
  "permissions": {
    "childId": {
      "canLogEssentials": true | false,
      "canEditEssentials": true | false,
      "canViewMedicalHistory": true | false,
      "canEditMedicalHistory": true | false,
      "canViewEssentialHistory": true | false
    }
  },
  
  "grantedAt": "timestamp",
  "auditLog": [
    { "action": "logged essential", "childId": "uuid", "timestamp": "timestamp" }
  ]
}
```

---

## AI Conversation Flow (Pseudocode)

```
1. Parent starts: "My child has been coughing a lot"

2. AI retrieves medical history:
   - Checks for chronic respiratory conditions
   - Checks for past cough-related Essentials
   - Checks for allergies
   
3. AI responds with context:
   "I see you logged a cough for [Child] 3 weeks ago. 
    Is this the same issue, or something new?
    Also, I noticed [Child] has a peanut allergy. 
    Any other symptoms you've noticed?"
   
4. Parent: "It's different, more severe. Also has a fever."

5. AI asks guided follow-ups:
   - "How high is the fever? (If they took temperature)"
   - "How long has the cough been happening?"
   - "Any phlegm? What color?"
   - "Is [Child] eating/sleeping normally?"
   - "Any recent illness exposure (school, daycare)?"
   
6. Parent answers naturally.

7. AI structures the data:
   {
     primaryConcern: "Cough + Fever",
     symptoms: ["persistent cough", "fever"],
     duration: "2 days",
     severity: "moderate",
     context: "Recent school exposure"
   }

8. AI generates summary:
   "Current observations:
    - Persistent cough × 2 days (productive)
    - Fever (101°F)
    - Decreased appetite
    
    Medical context:
    - No chronic respiratory conditions
    - Penicillin allergy (noted)
    - Last cough episode: 3 weeks ago (mild, resolved)
    
    Recommendation:
    → Pediatric consultation advised (fever + cough > 3 days typically warrants visit)
    → If high fever (>103°F) or difficulty breathing → Urgent care"

9. Parent reviews, edits doctor notes (optional), then:
   - Print
   - Export (PDF/DOCX)
   - Share link
   - Archive
```

---

## Key Design Principles

### Visual Language (from inspos)
- **Color palette:** Soft teal (#4d736c), sage (#92bbb3), warm coral (#e67e22), cream background
- **Typography:** Clean, friendly sans-serif (no clinical feel)
- **Spacing:** Generous whitespace, cards with subtle shadows
- **Components:** Card-based, rounded corners, icons with labels
- **Tone:** Warm, empowering, non-clinical

### UX Principles
1. **AI is a helper, not a doctor** — never diagnose, only structure and ask
2. **History matters** — every Essential can reference past logs and medical context
3. **Doctor-focused output** — summaries are useful to clinicians, not just parents
4. **Privacy by default** — parents control what's disclosed (diagnoses toggle, etc.)
5. **Audit trail** — all family member actions logged for accountability
6. **Mobile-first** — designed for parent interaction on phone while observing child

---

## MVP Scope (Phase 1)

### Must Have
- ✅ Onboarding (account + first child + medical history)
- ✅ Home dashboard (child cards, recent Essentials)
- ✅ AI Chat flow (guided conversation)
- ✅ Essential summary generation (formatted for doctor)
- ✅ Print/Export (PDF)
- ✅ Archive essentials
- ✅ Medical history manager (basic: allergies, conditions, meds)
- ✅ Family member invite (basic permissions)

### Nice to Have (Phase 2+)
- Share links (with expiry)
- Export to DOCX
- Manual form alternative
- Advanced medical history (immunizations, mental health)
- Granular permissions
- Timeline view of essentials
- Search/filter past logs
- Doctor integration (send summary to clinic system)

---

## Next Steps

1. **Validate onboarding flow** — Sketch/wireframe the 4-5 screens
2. **Design AI chat interface** — How does it look? Text input, suggested questions?
3. **Design Essential summary** — What's the layout? Doctor-ready format?
4. **Build data model** — Create database schema / API contracts
5. **Implement components** — Reusable card, form, button components
6. **Iterate with users** — Test with real parents, refine based on feedback
