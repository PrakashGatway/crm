import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useAuth } from '../../context/UserContext';
import api from '../../axiosInstance';
import LeadManagement from '../Leads/LeadManagement';
import CallAnalytics from './CallAnalysis';
import FormAssignmentModal from '../Leads/Assignment';

const EducationAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [formAssignmentModal, setFormAssignmentModal] = useState(false);
  const [counselors, setAllCounselors] = useState([]);


  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'Admin' ? '/admin/analytics' :
        user.role === 'Teacher' ? '/teacher/analytics' :
          '/student/analytics';
      const response = await api.get(`${endpoint}?range=${timeRange}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const res = await api.get("/users?role=counselor");

      setAllCounselors(res.data?.users || []);
    } catch (error) {
      console.error("Failed to fetch counselors:", error);
    }
  };

  useEffect(() => {
    if (user?.role != "counselor") {
      fetchCounselors();
    }
  }, [user?.role]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, user.role]);

  // Time range options
  const rangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  // Chart options for course progress
  const progressChartOptions = {
    chart: {
      type: 'radialBar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 225,
        hollow: { margin: 0, size: '70%' },
        dataLabels: {
          name: { fontSize: '16px', color: undefined, offsetY: 120 },
          value: {
            offsetY: 76,
            fontSize: '22px',
            color: undefined,
            formatter: function (val) {
              return val + '%';
            }
          }
        },
        track: { background: '#e0e0e0', strokeWidth: '97%', margin: 5 }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        shadeIntensity: 0.15,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 65, 91]
      },
    },
    stroke: { dashArray: 4 },
    colors: ['#4f46e5'],
    labels: ['Course Completion'],
  };

  // Chart options for activity types
  const activityTypeOptions = {
    chart: { type: 'donut' },
    labels: ['Lessons', 'Assignments', 'Quizzes', 'Discussions'],
    colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'],
    legend: { position: 'bottom' },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }],
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Activities',
              formatter: () => {
                const total = (analytics?.lessonsCompleted || 0) +
                  (analytics?.assignmentsSubmitted || 0) +
                  (analytics?.quizzesTaken || 0) +
                  (analytics?.discussionsParticipated || 0);
                return total;
              }
            }
          }
        }
      }
    }
  };

  // Chart options for daily activity
  const activityChartOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false }
    },
    stroke: { curve: 'smooth', width: [3, 3] },
    dataLabels: { enabled: false },
    xaxis: {
      categories: analytics?.dailyActivity?.dates || [],
      labels: { rotate: -45 }
    },
    yaxis: {
      title: { text: 'Activities' },
      min: 0
    },
    colors: ['#4f46e5', '#10b981'],
    tooltip: {
      shared: true,
      intersect: false,
    },
    legend: { position: 'top' }
  };

  const renderStatCard = (title, value, icon, color, secondaryText = '') => {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start">
          <div className={`p-3 rounded-lg ${color.bg} ${color.text}`}>
            {icon}
          </div>
          <div className="ml-5 flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {secondaryText && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {secondaryText}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
  if (user?.role == "manager" || user.role == "leader") {
    return (<CallAnalytics />)
  }

  if (user.role == "counselor") {
    return (<LeadManagement />)
  }

  return (
    <div className="max-w-full px-4 sm:px-3 lg:px-3">

      {user.role == "admin" && <CallAnalytics />}
      {user.role == "admin" && <button
        onClick={() => setFormAssignmentModal(true)}
        className="flex items-center gap-2 rounded-full border border-indigo-600 bg-indigo-600 px-3 py-2 text-sm text-white"
      >
        Form Assignment
      </button>}
      <FormAssignmentModal
        isOpen={formAssignmentModal}
        onClose={() => setFormAssignmentModal(false)}
        counselors={counselors && counselors}
      />

      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6 mt-12">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {timeRange === '7d' ? 'Weekly' :
            timeRange === '30d' ? 'Monthly' : 'Quarterly'} Overview
        </h2>
        <div className="inline-flex rounded-lg shadow-sm bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1 text-sm font-medium ${timeRange === option.value
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                } rounded-md`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {user.role === 'Admin' ? (
              <>
                {renderStatCard(
                  'Total Students',
                  analytics?.totalStudents || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>,
                  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-300' },
                  `${analytics?.newStudentsThisPeriod || 0} new this period`
                )}

                {renderStatCard(
                  'Active Courses',
                  analytics?.activeCourses || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>,
                  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-300' },
                  `${analytics?.coursesCompletedThisPeriod || 0} completed`
                )}

                {renderStatCard(
                  'Total Teachers',
                  analytics?.totalTeachers || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>,
                  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-300' }
                )}

                {renderStatCard(
                  'Avg. Engagement',
                  `${analytics?.avgEngagementRate || 0}%`,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>,
                  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-300' },
                  analytics?.engagementChange >= 0 ? `↑ ${analytics?.engagementChange}% from last period` : `↓ ${Math.abs(analytics?.engagementChange || 0)}% from last period`
                )}
              </>
            ) : user.role === 'Teacher' ? (
              <>
                {renderStatCard(
                  'Your Students',
                  analytics?.totalStudents || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>,
                  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-300' }
                )}

                {renderStatCard(
                  'Active Courses',
                  analytics?.activeCourses || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>,
                  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-300' }
                )}

                {renderStatCard(
                  'Assignments Graded',
                  analytics?.assignmentsGraded || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>,
                  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-300' },
                  `${analytics?.gradingCompletion || 0}% completed`
                )}

                {renderStatCard(
                  'Avg. Course Rating',
                  analytics?.avgCourseRating ? `${analytics.avgCourseRating.toFixed(1)}/5` : 'N/A',
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>,
                  { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-300' }
                )}
              </>
            ) : (
              <>
                {renderStatCard(
                  'Courses Enrolled',
                  analytics?.coursesEnrolled || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>,
                  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-300' },
                  `${analytics?.coursesCompleted || 0} completed`
                )}

                {renderStatCard(
                  'Assignments Submitted',
                  analytics?.assignmentsSubmitted || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>,
                  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-300' },
                  `${analytics?.assignmentsGraded || 0} graded`
                )}

                {renderStatCard(
                  'Quizzes Taken',
                  analytics?.quizzesTaken || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>,
                  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-300' },
                  `Avg. score: ${analytics?.avgQuizScore || 0}%`
                )}

                {renderStatCard(
                  'Learning Streak',
                  analytics?.learningStreak || 0,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>,
                  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-300' },
                  'days in a row'
                )}
              </>
            )}
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Progress/Engagement Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {user.role === 'Admin' ? 'Platform Engagement' :
                  user.role === 'Teacher' ? 'Course Completion Rates' : 'Your Learning Progress'}
              </h3>
              <Chart
                options={progressChartOptions}
                series={[user.role === 'Student' ? analytics?.courseCompletionRate || 0 :
                  analytics?.avgEngagementRate || 0]}
                type="radialBar"
                height={350}
              />
            </div>

            {/* Activity Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {user.role === 'Admin' ? 'Activity Distribution' :
                  user.role === 'Teacher' ? 'Teaching Activities' : 'Your Activities'}
              </h3>
              <Chart
                options={activityTypeOptions}
                series={[
                  analytics?.lessonsCompleted || 0,
                  analytics?.assignmentsSubmitted || 0,
                  analytics?.quizzesTaken || 0,
                  analytics?.discussionsParticipated || 0
                ]}
                type="donut"
                height={350}
              />
            </div>
          </div>

          {/* Daily Activity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {user.role === 'Admin' ? 'Daily Platform Activity' :
                user.role === 'Teacher' ? 'Daily Teaching Activity' : 'Your Daily Activity'}
            </h3>
            <Chart
              options={{
                ...activityChartOptions,
                xaxis: {
                  categories: analytics?.dailyActivity?.dates || []
                }
              }}
              series={[
                {
                  name: user.role === 'Teacher' ? 'Lessons Created' : 'Lessons Viewed',
                  data: analytics?.dailyActivity?.lessons || []
                },
                {
                  name: user.role === 'Teacher' ? 'Assignments Graded' : 'Assignments Submitted',
                  data: analytics?.dailyActivity?.assignments || []
                }
              ]}
              type="line"
              height={350}
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {analytics?.recentActivities?.length > 0 ? (
                analytics.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg ${activity.type === 'lesson' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' :
                      activity.type === 'assignment' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'}`}>
                      {activity.type === 'lesson' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      ) : activity.type === 'assignment' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent activity found
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EducationAnalytics;