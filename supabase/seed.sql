-- Localified · sample jobs (run AFTER schema.sql)
-- These jobs have no owner until a real signed-up user claims/reposts them.
-- Safe to re-run: clears previous seed rows tagged by email domain.

delete from public.applications
where task_id in (
  select id from public.jobs where email like '%@localified.seed'
);

delete from public.jobs where email like '%@localified.seed';

insert into public.jobs (
  title, category, description, address, schedule, payment,
  budget_type, status, contact_no, email
) values
(
  'Cleaner',
  'Cleaning',
  'Wash, sweeping the floor, and cleaning the hidden dirt',
  'Bankerohan, blk 16',
  'Schedule to be agreed',
  '₱350',
  'fixed',
  'Closed',
  '0917 123 4501',
  'hr@localified.seed'
),
(
  'Gardener',
  'Gardening',
  'Remove excessive grass and weeds from the garden.',
  'Torres, blk 12',
  'Schedule to be agreed',
  '₱100',
  'fixed',
  'Open',
  '0921 678 3401',
  'garden@localified.seed'
),
(
  'Help with yard cleanup',
  'Yard work',
  'Collect leaves and tidy the front yard.',
  'Buhangin, Davao City',
  'Schedule to be agreed',
  '₱500',
  'fixed',
  'Open',
  '555-0102',
  'yard@localified.seed'
),
(
  'Fix Drainage',
  'Plumber',
  'Fix drainage system',
  'Toril, Davao City',
  'Oct 29',
  '₱1,500',
  'fixed',
  'Open',
  '0912 3456 789',
  'plumber@localified.seed'
);
