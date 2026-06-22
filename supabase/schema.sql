-- Body Engineering Gym Management Schema
-- Run this in your Supabase SQL Editor

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'monthly'
    CHECK (membership_type IN ('monthly', 'quarterly', 'yearly')),
  membership_start DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_end DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_owner_id ON members(owner_id);
CREATE INDEX IF NOT EXISTS idx_members_membership_end ON members(membership_end);
CREATE INDEX IF NOT EXISTS idx_attendance_owner_id ON attendance(owner_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON attendance(check_in);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS members_updated_at ON members;
CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Owners can view their members"
  ON members FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their members"
  ON members FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their members"
  ON members FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their members"
  ON members FOR DELETE
  USING (auth.uid() = owner_id);

-- Attendance policies
CREATE POLICY "Owners can view their attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update attendance"
  ON attendance FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete attendance"
  ON attendance FOR DELETE
  USING (auth.uid() = owner_id);
