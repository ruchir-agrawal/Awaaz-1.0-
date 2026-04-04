ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS google_sheet_id TEXT,
ADD COLUMN IF NOT EXISTS google_sheet_url TEXT,
ADD COLUMN IF NOT EXISTS google_sheet_tab_name TEXT DEFAULT 'Records';
