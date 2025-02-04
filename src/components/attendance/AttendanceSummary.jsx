import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AttendanceSummary() {
  const [summaryData, setSummaryData] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceSummary();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchAttendanceTrend(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchAttendanceSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_summary')
        .select('*');

      if (error) throw error;
      setSummaryData(data);
      
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].subject_id);
      }
    } catch (error) {
      toast.error('Error fetching attendance summary: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceTrend = async (subjectId) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('date, status')
        .eq('subject_id', subjectId)
        .order('date', { ascending: true });

      if (error) throw error;

      // Process data for trend chart
      const processedData = processAttendanceTrend(data);
      setTrendData(processedData);
    } catch (error) {
      toast.error('Error fetching attendance trend: ' + error.message);
    }
  };

  const processAttendanceTrend = (data) => {
    const dateGroups = data.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = {
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      }
      acc[date][record.status]++;
      acc[date].total++;
      return acc;
    }, {});

    const dates = Object.keys(dateGroups).sort();
    const percentages = dates.map(date => {
      const stats = dateGroups[date];
      return (stats.present / stats.total) * 100;
    });

    return {
      labels: dates,
      datasets: [{
        label: 'Attendance Percentage',
        data: percentages,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 75) return { color: 'green', text: 'Good' };
    if (percentage >= 60) return { color: 'yellow', text: 'Warning' };
    return { color: 'red', text: 'Critical' };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Attendance Summary</h2>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {summaryData.map((subject) => {
          const status = getAttendanceStatus(subject.attendance_percentage);
          return (
            <div
              key={subject.subject_id}
              onClick={() => setSelectedSubject(subject.subject_id)}
              className={`cursor-pointer p-6 bg-white rounded-lg shadow-md transition-transform transform hover:scale-105 ${
                selectedSubject === subject.subject_id ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <h3 className="text-lg font-semibold">{subject.subject_name}</h3>
              <p className="text-sm text-gray-500">Code: {subject.subject_code}</p>
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Attendance:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold text-white`}
                    style={{ backgroundColor: status.color }}
                  >
                    {status.text}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{subject.attendance_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${subject.attendance_percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Classes Attended: {subject.classes_attended}</p>
                  <p>Total Classes: {subject.total_classes}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      {trendData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
          <div className="h-64">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Attendance Percentage'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
