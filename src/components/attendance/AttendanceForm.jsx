import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function AttendanceForm() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    subject_id: '',
    status: 'present',
    notes: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data: studentSubjects, error: studentSubjectsError } = await supabase
        .from('student_subjects')
        .select(`
          subject_id,
          subjects (
            id,
            name,
            code
          )
        `);

      if (studentSubjectsError) throw studentSubjectsError;

      const subjectsList = studentSubjects.map(item => item.subjects);
      setSubjects(subjectsList);
      
      // Set first subject as default if available
      if (subjectsList.length > 0) {
        setFormData(prev => ({ ...prev, subject_id: subjectsList[0].id }));
      }
    } catch (error) {
      toast.error('Error fetching subjects: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject_id) {
      toast.error('Please select a subject');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Check if attendance already exists for this date and subject
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .match({
          student_id: user.id,
          subject_id: formData.subject_id,
          date: formattedDate
        });

      if (existingRecord?.length > 0) {
        const confirmUpdate = window.confirm('Attendance record already exists for this date. Do you want to update it?');
        if (!confirmUpdate) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from('attendance_records').upsert({
        student_id: user.id,
        subject_id: formData.subject_id,
        date: formattedDate,
        status: formData.status,
        notes: formData.notes
      });

      if (error) throw error;
      toast.success('Attendance recorded successfully!');
      
      // Reset form except subject_id
      setFormData(prev => ({
        ...prev,
        status: 'present',
        notes: ''
      }));
    } catch (error) {
      toast.error('Error recording attendance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Record Attendance</h2>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subject
          </label>
          <select
            value={formData.subject_id}
            onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select a subject</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            maxDate={new Date()}
            dateFormat="MMMM d, yyyy"
            required
          />
        </div>

        {/* Attendance Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attendance Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows="3"
            placeholder="Add any additional notes here..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Recording...' : 'Record Attendance'}
        </button>
      </form>
    </div>
  );
}
