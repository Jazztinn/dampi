---
name: Dampi project context
description: Dampi is a pediatric welfare and pre-consultation symptom organizer for indigent Filipino families at public hospitals
type: project
---

Dampi is a welfare and pre-consultation symptom organizer for pediatric clinics targeting indigent patients at Philippine public hospitals who wait 6-8 hours for 15-minute consultations.

**Why:** Public hospital patients forget half of what they want to say. Doctors have no structured pre-visit info. Families can't afford repeated consultations due to HMO/insurance gaps (18-33% coverage). Queue systems are FCFS not priority-based.

**Core value prop:** Guide parents through symptom logging in Filipino before arrival — when it started, what makes it worse, medicines taken — generating a one-page doctor-ready summary.

**How to apply:** All features should prioritize offline-first, SMS-fallback, no Gmail/GDrive dependency. Target users are non-tech-savvy parents at public hospitals. Keep UI simple, Filipino-friendly.

**Key feature areas discussed (2026-05-07):**
1. AI-guided symptom examination flow (parent reports → AI gives inspection instructions → checklist → one-page summary for doctor)
2. Unified HMO Portal (expose users to appropriate HMO options)
3. Insurance Tracker (manage existing HMO or find new options based on context)

**Current state:** Early-to-mid stage. Auth, onboarding, AI chat (Gemini), and DB are solid. Symptom logging, HMO portal, and documents screens are placeholders. Tech stack: React/Vite + Supabase + Google Gemini + Express proxy.
