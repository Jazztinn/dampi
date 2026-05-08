# Dampi — Pediatric Health Assistant for Filipino Families

Dampi is a warm, accessible pediatric health app that empowers Filipino caregivers to document symptoms, prepare for doctor visits, and navigate their children's health with confidence. Built with AI guidance and designed specifically for the Filipino healthcare context.

## 🎯 Core Mission

Help worried parents **prepare structured symptom summaries** for their children's doctor visits, with cultural sensitivity, multilingual support (English + Tagalog), and data integrity for both registered users and guest assessments.

## 🌍 Key Features

### 1. **Smart Symptom Logging**
- Step-by-step guided interview with Dampi (AI assistant)
- Context-aware physical examination instructions generated based on child's age and symptom category
- Real-time severity tracking and vital signs collection
- Photo and voice note capture for documentation
- Red flag detection with emergency guidance

### 2. **AI-Powered Assessment Flow**
- **Step 1: Describe** — Parent describes what they're observing with their child
- **Step 2: Physical Examination** — AI generates age-specific, symptom-specific exam instructions
- **Step 3: Findings Checklist** — Parent documents findings with Yes/No toggles
- **Step 4: Summary** — Structured medical summary for physician or HMO provider

### 3. **Onboarding & Family Management**
- Seamless account creation with email/social auth options
- Add multiple children with full registration (DOB, name, allergies, HMO coverage)
- Invite caregivers to family circle for shared access
- Guest mode for quick assessments without registration

### 4. **Data Integrity & Privacy**
- **Registered profiles**: Automatic merge of session data with stored medical history
- **Guest assessments**: Limited to Name, Age, and Session Findings only
- Supabase-backed secure storage with row-level security
- HIPAA-friendly export formats for physicians

### 5. **HMO & Provider Integration**
- Track HMO coverage and claim information
- Export summaries in formats ready for submission to healthcare providers
- Integration ready for caregiver invites and family discovery

---

## 📦 Tech Stack

- **Frontend**: React 18 + Vite (fast, optimized builds)
- **Styling**: Custom CSS with design system tokens
- **Backend**: Node.js + Express (for API layer)
- **Database**: Supabase (PostgreSQL + real-time updates)
- **AI**: Claude API for conversational guidance
- **Icons**: Lucide React (accessible, consistent iconography)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for local development)
- GitHub account (for Pages deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jazztinn/dampi.git
cd dampi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and AI credentials

# Start Supabase (local development)
npm run supabase:start

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env.local` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DAMPI_API_BASE=http://127.0.0.1:3001
```

---

## 📁 Project Structure

```
dampi/
├── src/
│   ├── components/
│   │   ├── ai/                 # Dampi chat modal, FAB, quick symptom log
│   │   └── symptom/            # Child selector, question cards
│   ├── screens/
│   │   ├── Auth/               # Login, signup, social auth
│   │   ├── Onboarding/         # Account creation, child registration
│   │   ├── SymptomLog/         # 4-step symptom assessment flow
│   │   └── [other screens]/
│   ├── constants/
│   │   ├── dampiAi.js          # Chat system prompts
│   │   ├── symptomPrompt.js    # Symptom log AI instructions
│   │   └── symptomLogAi.js     # Assessment context rules
│   ├── lib/
│   │   └── supabase.js         # Supabase client setup
│   ├── services/
│   │   └── ai/                 # Assessment & AI logic
│   └── App.jsx                 # Main app component
├── ai/
│   ├── client/                 # Frontend AI utilities
│   ├── components/             # Reusable AI UI components
│   ├── config/                 # Prompt templates
│   └── server/                 # Node.js backend for AI calls
├── supabase/
│   ├── migrations/             # Database schema evolution
│   ├── functions/              # Edge functions (RPC logic)
│   └── config.toml             # Supabase local config
├── vite.config.js              # Vite build configuration
├── package.json                # Dependencies & scripts
└── README.md                   # This file
```

---

## 🧬 Assessment Flow & Data Integrity

### Input Analysis (Step 1)

The app extracts three critical pieces of information:
1. **Child's Age** — Used to tailor exam instructions and severity thresholds
2. **Symptom Category** — Determines which body systems to examine
3. **Severity Level** — Drives the quantity and complexity of exam steps

Example:
```javascript
{
  childAge: 5,
  symptomCategory: 'digestive',
  severityLevel: 'moderate'
}
```

### Dynamic Physical Examination (Step 2)

**Personalization Engine**: AI generates targeted exam instructions specific to the child's profile.

**Quantity Logic**:
- **Mild Severity** → 3 specific examination steps
- **Moderate/High Severity** → 4–6 specific examination steps

**Constraint**: Every instruction is a concrete physical action (e.g., "Gently press the lower right quadrant of the abdomen"), never generic.

### Finding-Driven Checklist (Step 3)

**Continuity Rule**: Each checklist item corresponds directly to an examination step from Step 2.

**Format**: For every exam step, provide Yes/No or Normal/Abnormal toggles for parents to document findings in real-time.

### Data Integrity & Summary (Step 4)

**Condition A — Registered Profile**:
- `profile_id` exists in session
- Automatically merges session findings with stored medical history
- Summary includes: Full Name, DOB, HMO ID, Allergies, Session Findings
- Exportable to physician or HMO provider

**Condition B — Guest/Unregistered**:
- No `profile_id` exists
- Summary limited to: Name, Age, Session Findings only
- No stored medical history is displayed

**Output Structure**:
```javascript
{
  child_name: 'Maria Santos',
  child_age: '5 years',
  profile_id: 'uuid-or-null',
  dob: '2021-05-15',
  hmo_id: 'ABC12345',
  allergies: 'Penicillin',
  session_findings: {
    chief_complaint: '...',
    symptoms_observed: [],
    exam_steps_completed: 4,
    findings_documented: { /* checklist answers */ },
    severity_rating: 6,
  },
  provider_export_ready: true,
}
```

---

## 🤖 AI & Prompts

### Dampi Chat System Prompt
Located in `src/constants/dampiAi.js`:
- Professional, warm, practical tone
- Red flag detection with emergency guidance
- Task automation (reminders, appointments)
- Structured response protocol (JSON schema)

### Symptom Log Assessment Prompt
Located in `src/constants/symptomPrompt.js`:
- Guides parents through structured symptom examination
- Adaptive behavior (skips irrelevant questions)
- Red flag warnings with immediate ER recommendations
- Filipino-friendly English + Tagalog medical terms

### Assessment Context & Integrity
Located in `src/services/ai/assessmentContext.js` (to be created):
- Input extraction rules (age, category, severity)
- Dynamic exam generation engine
- Checklist-to-exam continuity enforcement
- Profile-based summary generation (registered vs guest)

---

## 🌐 Deployment

For the deployed application to function correctly, the AI backend server (`ai/server/server.js`) must be running on a public hosting provider (e.g., Heroku, Render, Fly.io).

Before building the frontend for production, you must set the `VITE_AI_PROXY_URL` environment variable to the public URL of your deployed backend.

Example `.env.production` file:
```
VITE_AI_PROXY_URL=https://your-deployed-ai-server.com
```

### GitHub Pages

The app is automatically deployed to GitHub Pages on every push to `main`.

**Important**: Before your GitHub Actions workflow runs, ensure you have configured the `VITE_AI_PROXY_URL` in your repository's secrets so the build process can create a production-ready application that points to your live backend.

See the main [Deployment](#-deployment) section for more details.

**Configuration**:
- `vite.config.js` includes `base: '/dampi/'` for correct asset paths
- `.github/workflows/deploy.yml` handles build & deployment

### Local Preview

```bash
npm run build
npm run preview
```

---

## 📱 Screens & Navigation

- **Auth** — Login, signup, social authentication
- **Onboarding** → Welcome → Create Account → Add Child → HMO Coverage → Invite Family
- **Home** — Dashboard with child cards, recent symptoms, metrics carousel
- **Symptom Log** — 4-step assessment flow (Describe → Examine → Findings → Summary)
- **Symptom Guide** — Reference for common childhood conditions
- **Family** — Caregiver invites, family circle management
- **Onboarding Assessment** → Quick symptom capture with Dampi FAB

---

## 🎨 Design System

See [DESIGN.md](DESIGN.md) for complete design guidelines including:
- Color palette (sage, teal, warm, emergency coral)
- Typography (Work Sans family, semantic scales)
- Component patterns and spacing rules
- Accessibility standards

### Brand Colors
- **Teal (Primary)**: `#4D736C`
- **Sage (Supporting)**: `#92BBB3`
- **Warm (Call-to-Action)**: `#EDA16D`
- **Coral (Emergency)**: `#E8897A`

---

## 🔐 Security & Privacy

- Row-level security (RLS) policies in Supabase
- User authentication via email or OAuth
- Session data never persisted without explicit user consent
- Guest assessments stored separately from user profiles
- GDPR & HIPAA considerations for healthcare data

---

## 🚦 Development Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run supabase:start   # Start local Supabase
npm run supabase:stop    # Stop local Supabase
npm run supabase:status  # Check Supabase status
npm run supabase:reset   # Reset database to seed state
```

---

## 📚 Database Schema

Key tables:
- `auth.users` — Caregiver accounts
- `onboarding_profiles` — Caregiver profile data
- `profiles` — Extended profile info (name, avatar, etc.)
- `child_registrations` — Child profiles (name, DOB, allergies, HMO)
- `symptom_logs` — Symptom assessment sessions
- `ai_chat_conversations` — Chat history with Dampi
- `caregiver_invites` — Family circle invitations
- `hmo_coverage` — HMO and insurance information

See `supabase/migrations/` for full schema.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add: context-aware assessment"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

MIT License — See LICENSE file for details.

---

## 💬 Support & Feedback

For issues, questions, or feature requests, please open a GitHub issue or reach out to the team.

---

**Dampi** — Empowering Filipino families with confident, informed pediatric care. 🏥❤️
