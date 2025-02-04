-- Create subjects table
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create student_subjects table for mapping students to their subjects
CREATE TABLE student_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, subject_id)
);

-- Update attendance_records table to include subject-specific attendance
DROP TABLE IF EXISTS attendance_records;
CREATE TABLE attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, subject_id, date)
);

-- Create attendance_summary view for quick calculations
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    ar.student_id,
    ar.subject_id,
    s.name as subject_name,
    s.code as subject_code,
    COUNT(*) as total_classes,
    SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as classes_attended,
    ROUND(
        (SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END)::decimal / COUNT(*)::decimal) * 100,
        2
    ) as attendance_percentage
FROM attendance_records ar
JOIN subjects s ON ar.subject_id = s.id
GROUP BY ar.student_id, ar.subject_id, s.name, s.code;

-- Add RLS policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for subjects
CREATE POLICY "Subjects are viewable by authenticated users"
    ON subjects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Students can insert subjects"
    ON subjects FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Students can update their subjects"
    ON subjects FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM student_subjects
            WHERE student_subjects.subject_id = subjects.id
            AND student_subjects.student_id = auth.uid()
        )
    );

CREATE POLICY "Students can delete their subjects"
    ON subjects FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM student_subjects
            WHERE student_subjects.subject_id = subjects.id
            AND student_subjects.student_id = auth.uid()
        )
    );

-- Policies for student_subjects
CREATE POLICY "Students can view their own subject mappings"
    ON student_subjects FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Policies for attendance_records
CREATE POLICY "Students can view their own attendance"
    ON attendance_records FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own attendance"
    ON attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own attendance"
    ON attendance_records FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid());

-- Function to calculate attendance percentage
CREATE OR REPLACE FUNCTION get_subject_attendance_percentage(
    p_student_id UUID,
    p_subject_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_classes BIGINT,
    classes_attended BIGINT,
    attendance_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as classes_attended,
        ROUND(
            (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::decimal / COUNT(*)::decimal) * 100,
            2
        ) as attendance_percentage
    FROM attendance_records
    WHERE student_id = p_student_id
    AND subject_id = p_subject_id
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
