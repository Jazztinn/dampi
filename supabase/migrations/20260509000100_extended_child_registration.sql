-- Add extended fields to children table
alter table public.children 
add column if not exists preferred_name text,
add column if not exists place_of_birth text,
add column if not exists nationality text,
add column if not exists psa_number text,
add column if not exists photo_url text,
add column if not exists blood_type text,
add column if not exists allergies text,
add column if not exists current_medications text,
add column if not exists chronic_conditions text,
add column if not exists past_medical_history text,
add column if not exists immunization_records_url text,
add column if not exists pediatrician_info jsonb,
add column if not exists health_insurance_number text,
add column if not exists special_needs text,
add column if not exists dietary_restrictions text,
add column if not exists mental_health_considerations text,
add column if not exists emergency_contacts jsonb default '[]'::jsonb,
add column if not exists custody_info text,
add column if not exists school_info jsonb,
add column if not exists languages_spoken text[],
add column if not exists religion text,
add column if not exists cultural_considerations text,
add column if not exists registration_completed boolean not null default false;

-- Add extra fields to profiles for guardian info if needed
alter table public.profiles
add column if not exists marital_status text,
add column if not exists employment_occupation text,
add column if not exists home_address text,
add column if not exists government_id_url text;

-- Create table for child documents
create table if not exists public.child_documents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  document_type text not null, -- 'birth_certificate', 'parent_id', 'guardianship_proof', 'vaccination_record', 'insurance_card'
  file_url text not null,
  file_name text,
  created_at timestamptz not null default now()
);

alter table public.child_documents enable row level security;

create policy "Users can manage documents for their children"
  on public.child_documents for all
  using (
    exists (
      select 1 from public.children
      where children.id = child_documents.child_id
      and children.primary_guardian_id = auth.uid()
    )
  );

-- Create storage bucket for child documents if not exists
-- (Handled via dashboard or initial setup usually, but noting here)
