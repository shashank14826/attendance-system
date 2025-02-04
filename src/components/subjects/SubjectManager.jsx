import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export default function SubjectManager() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data: studentSubjects, error: mappingError } = await supabase
        .from('student_subjects')
        .select(`
          subject_id,
          subjects (
            id,
            name,
            code
          )
        `);

      if (mappingError) throw mappingError;

      const subjectsList = studentSubjects.map(item => item.subjects);
      setSubjects(subjectsList);
    } catch (error) {
      toast.error('Error fetching subjects: ' + error.message);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, insert the subject
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .insert([
          {
            name: newSubject.name,
            code: newSubject.code
          }
        ])
        .select()
        .single();

      if (subjectError) throw subjectError;

      // Then, create the mapping to the student
      const { data: { user } } = await supabase.auth.getUser();
      const { error: mappingError } = await supabase
        .from('student_subjects')
        .insert([
          {
            student_id: user.id,
            subject_id: subjectData.id
          }
        ]);

      if (mappingError) throw mappingError;

      toast.success('Subject added successfully!');
      setNewSubject({ name: '', code: '' });
      fetchSubjects();
    } catch (error) {
      toast.error('Error adding subject: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    try {
      const { error } = await supabase
        .from('student_subjects')
        .delete()
        .match({ subject_id: subjectId });

      if (error) throw error;
      toast.success('Subject removed successfully!');
      fetchSubjects();
    } catch (error) {
      toast.error('Error removing subject: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Subjects</h2>

      {/* Add Subject Form */}
      <form onSubmit={handleAddSubject} className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              required
              value={newSubject.name}
              onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Mathematics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Code
            </label>
            <input
              type="text"
              required
              value={newSubject.code}
              onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., MATH101"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Adding...' : 'Add Subject'}
        </button>
      </form>

      {/* Subjects List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject Code
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {subject.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subject.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveSubject(subject.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No subjects added yet. Add your first subject above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
