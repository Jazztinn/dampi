drop policy if exists "Anyone can read profile photos" on storage.objects;
drop policy if exists "Users can upload their own profile photos" on storage.objects;
drop policy if exists "Users can update their own profile photos" on storage.objects;
drop policy if exists "Users can delete their own profile photos" on storage.objects;

create policy "Anyone can read profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "Users can upload their own profile photos"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own profile photos"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own profile photos"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
