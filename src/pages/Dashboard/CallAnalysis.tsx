import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useAuth } from '../../context/UserContext';
import PageMeta from "../../components/common/PageMeta";
import api from '../../axiosInstance';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LeadStatus } from '../Leads/LeadManagement';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useNavigate } from 'react-router';

const CallAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState('all');
  const [days, setDays] = useState(1);
  const [statusWise, setStatusWise] = useState([]);
  // const [selectedStatus, setSelectedStatus] = useState(null);
  const [counselorStatusSelections, setCounselorStatusSelections] = useState({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    endDate: new Date()
  });

  // Summary statistics
  const [summary, setSummary] = useState({
    totalCalls: 0,
    totalOutbound: 0,
    totalInbound: 0,
    totalConnected: 0,
    totalMissed: 0,
    avgDuration: 0,
    totalCounselors: 0,
    connectionRate: 0
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        ...(selectedCounselor !== 'all' && { counselorId: selectedCounselor })
      };

      // const response = await api.get('/leads/reports', { params });
      // const statusResponse = await api.get('/leads/reports/status', { params });
      // const Callstatus = await api.get('/leads/reports/calls', { params });
      const [response, statusResponse] = await Promise.all([api.get('/leads/reports', { params }), api.get('/leads/reports/status', { params })])

      // console.log(Callstatus.data)

      setStatusWise(statusResponse.data?.data || []);
      const data = response.data.data;
      setAnalytics(data);
      setCounselors(response.data.counselors);


      // Calculate summary statistics
      if (data.length > 0) {
        const totalCalls = data.reduce((sum, item) => sum + item.totalCalls, 0);
        const totalOutbound = data.reduce((sum, item) => sum + item.outboundCalls, 0);
        const totalInbound = data.reduce((sum, item) => sum + item.inboundCalls, 0);
        const totalConnected = data.reduce((sum, item) => sum + item.connectedCalls, 0);
        const totalMissed = data.reduce((sum, item) => sum + (item.missedCalls || 0), 0);
        const totalDuration = data.reduce((sum, item) => sum + item.totalDuration, 0);

        setSummary({
          totalCalls,
          totalOutbound,
          totalInbound,
          totalConnected,
          totalMissed,
          avgDuration: totalConnected > 0 ? (totalDuration / totalConnected / 60).toFixed(2) : 0,
          totalCounselors: data.length,
          connectionRate: totalCalls > 0 ? ((totalConnected / totalCalls) * 100).toFixed(1) : 0
        });
      }

      // Extract unique counselors for filter
      // const uniqueCounselors = [...new Set(data.map(item => ({
      //   id: item._id,
      //   name: item.counselorName
      // })))];

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange.startDate, dateRange.endDate, selectedCounselor]);

  // Time range options
  const rangeOptions = [
    { value: '12h', label: 'Today', days: 0 },
    { value: '24h', label: 'Last 24 Hours', days: 1 },
    // { value: '7d', label: 'Last 7 Days', days: 7 }
  ];

  const handleQuickRange = (days) => {
    setDays(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({ startDate: start, endDate: end });
  };

  const callTypeOptions = {
    chart: {
      type: 'donut',
      height: 350,
      toolbar: { show: false }
    },
    labels: ['Outbound Calls', 'Inbound Calls', 'Missed Calls'],
    colors: ['#4f46e5', '#10b981', '#ef4444'],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Calls',
              formatter: () => summary.totalCalls
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        return opts.w.config.series[opts.seriesIndex];
      }
    }
  };

  // Chart options for call performance by counselor
  const counselorPerformanceOptions = {
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { show: false },
      stacked: false
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: analytics.map(item => item.counselorName),
      labels: { rotate: -45, trim: true }
    },
    yaxis: {
      title: { text: 'Number of Calls' }
    },
    colors: ['#4f46e5', '#10b981', '#ef4444'],
    legend: { position: 'top' },
    tooltip: {
      shared: true,
      intersect: false
    }
  };

  // Chart options for call duration trends
  const durationOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false }
    },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: analytics.map(item => item.counselorName),
      labels: { rotate: -45, trim: true }
    },
    yaxis: {
      title: { text: 'Average Duration (seconds)' }
    },
    colors: ['#4f46e5', '#10b981'],
    legend: { position: 'top' }
  };

  const renderStatCard = (title, value, icon, color, secondaryText = '', trend = null) => {
    return (
      <div className="bg-white border-2 border-red-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-start">
          <div className={`p-3 rounded-lg ${color.bg} ${color.text}`}>
            {icon}
          </div>
          <div className="ml-5 flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            <div className="flex items-baseline mt-1">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {value}
              </p>
              {trend && (
                <span className={`ml-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
              )}
            </div>
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

  return (
    <div className="max-w-full">
      <PageMeta
        title="IVR Call Analytics Dashboard"
        description="Comprehensive analysis of counselor call performance and IVR metrics"
      />
      <div className="mb-3">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center gap-4 items-center">
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQuickRange(option.days)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${days == option.days ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <DatePicker
                selected={dateRange.startDate}
                onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                selectsStart
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                dateFormat="dd-MM-yyyy"
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                placeholderText="Start Date"
              />
              <span className="text-gray-500">to</span>
              <DatePicker
                selected={dateRange.endDate}
                onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                selectsEnd
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                dateFormat="dd-MM-yyyy"
                minDate={dateRange.startDate}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                placeholderText="End Date"
              />
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Counselors</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Status-wise Leads Table with Dropdown */}
      {statusWise.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Status-wise Lead Analysis
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                  {statusWise.length} Records
                </span>
              </div>
            </div>
          </div>

          {/* Status Filter Bar */}
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</span>
              {Object.entries(LeadStatus).map(([value, label],index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedStatusFilter(value === 'all' ? null : value);
                    setCounselorStatusSelections({});
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${(selectedStatusFilter === null && value === 'all') || selectedStatusFilter === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {value === 'all' ? 'All' : label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Counselor
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      Leads
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      Total Calls
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      Connected
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      Missed
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      Duration
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Call Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(
                  statusWise.reduce((acc, item) => {
                    if (!acc[item.counselorName]) {
                      acc[item.counselorName] = {
                        counselorId: item._id.counselor,
                        statuses: {},
                        allStatuses: []
                      };
                    }
                    acc[item.counselorName].statuses[item.status] = item;
                    acc[item.counselorName].allStatuses.push(item);
                    return acc;
                  }, {})
                ).map(([counselorName, counselorData],index) => {
                  // Get unique statuses for this counselor
                  const availableStatuses = counselorData.allStatuses.map(s => s.status);
                  const currentStatus =
                    selectedStatusFilter && availableStatuses.includes(selectedStatusFilter)
                      ? selectedStatusFilter
                      : (counselorStatusSelections[counselorName] || "all");


                  let currentData;

                  if (currentStatus === "all") {
                    const all = counselorData.allStatuses;

                    currentData = {
                      leadCount: all.reduce((sum, s) => sum + (s.leadCount || 0), 0),
                      totalCalls: all.reduce((sum, s) => sum + (s.totalCalls || 0), 0),
                      connectedCalls: all.reduce((sum, s) => sum + (s.connectedCalls || 0), 0),
                      missedCalls: all.reduce((sum, s) => sum + (s.missedCalls || 0), 0),
                      outboundCalls: all.reduce((sum, s) => sum + (s.outboundCalls || 0), 0),
                      inboundCalls: all.reduce((sum, s) => sum + (s.inboundCalls || 0), 0),
                      totalDuration: all.reduce((sum, s) => sum + (s.totalDuration || 0), 0),
                      avgDuration:
                        all.reduce((sum, s) => sum + (s.avgDuration || 0), 0) / all.length
                    };
                  } else {
                    currentData = counselorData.statuses[currentStatus];
                  }


                  if (selectedStatusFilter && !availableStatuses.includes(selectedStatusFilter)) {
                    return null; // Skip counselors that don't have the selected status
                  }
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">

                          <div className="ml-3 flex">
                            <div className="text-base font-medium text-gray-900 dark:text-white">
                              {counselorName}
                            </div>
                            <button onClick={() => navigate(`/leads?user=${counselorData.counselorId}&status=${currentStatus || 'new'}`)}>
                              <SquareArrowOutUpRight size={20} className='ml-2 text-green-700' />
                            </button>

                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="relative">
                          <select
                            value={currentStatus}
                            onChange={(e) => {
                              // Update only this counselor's selection
                              setCounselorStatusSelections({
                                ...counselorStatusSelections,
                                [counselorName]: e.target.value
                              });
                              setSelectedStatusFilter(null); // Clear filter when manually selecting
                            }}
                            className=" bg-transparent pl-3 pr-2 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white cursor-pointer"
                          >
                            <option key={"all"} value={"all"}>
                              All ({counselorData.allStatuses.reduce((acc, status) => acc + status.leadCount, 0)} leads)
                            </option>
                            {counselorData.allStatuses.map(status => (

                              <option key={status.status} value={status.status}>
                                {LeadStatus[status.status] || status.status} ({status.leadCount} leads)
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">

                          {currentData?.leadCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {currentData?.totalCalls || 0}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {currentData?.connectedCalls || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {currentData?.missedCalls || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {currentData?.totalDuration > 0 ? `${Math.round(currentData.totalDuration / 60)}m` : '-'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currentData?.avgDuration > 0 ? `${Math.round(currentData.avgDuration)}s avg` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Out:</span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {currentData?.outboundCalls || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">In:</span>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {currentData?.inboundCalls || 0}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)} {/* Remove null entries */}
              </tbody>
            </table>

            {/* No Data Message */}
            {/* No Data Message */}
            {selectedStatusFilter &&
              Object.entries(
                statusWise.reduce((acc, item) => {
                  if (!acc[item.counselorName]) {
                    acc[item.counselorName] = {
                      counselorId: item._id.counselor,
                      statuses: {},
                      allStatuses: []
                    };
                  }
                  acc[item.counselorName].statuses[item.status] = item;
                  acc[item.counselorName].allStatuses.push(item);
                  return acc;
                }, {})
              ).filter(([counselorName, counselorData]) => {
                return !counselorData.statuses[selectedStatusFilter];
              }).length === Object.entries(
                statusWise.reduce((acc, item) => {
                  if (!acc[item.counselorName]) {
                    acc[item.counselorName] = {
                      counselorId: item._id.counselor,
                      statuses: {},
                      allStatuses: []
                    };
                  }
                  acc[item.counselorName].statuses[item.status] = item;
                  acc[item.counselorName].allStatuses.push(item);
                  return acc;
                }, {})
              ).length && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No counselors found with status "{selectedStatusFilter}"</p>
                </div>
              )
            }
          </div>
        </div>
      )}


      {loading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <img src="https://eccdatacenter.ae/CentralAttendance/Images/loader.gif" alt="loader" className='h-60 max-w-full w-60 ' />
        </div>
      ) : analytics.length > 0 ? (
        <>
          {/* Summary Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
            <div className="grid grid-cols-2 gap-3">
              {renderStatCard(
                'Total Calls',
                summary.totalCalls,
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>,
                { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-300' },
                `${summary.totalOutbound} outbound, ${summary.totalInbound} inbound`
              )}

              {renderStatCard(
                'Connected Calls',
                summary.totalConnected,
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>,
                { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-300' },
                `${summary.connectionRate}% connection rate`
              )}

              {renderStatCard(
                'Missed Calls',
                summary.totalMissed,
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>,
                { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300' },
                `${((summary.totalMissed / summary.totalCalls) * 100).toFixed(1)}% missed rate`
              )}

              {renderStatCard(
                'Avg Call Duration',
                `${summary.avgDuration} min`,
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>,
                { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-300' },
                `Across ${summary.totalCounselors} counselors`
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border-2 border-red-100 dark:border-gray-700">
              <Chart
                options={callTypeOptions}
                series={[summary.totalOutbound, summary.totalInbound, summary.totalMissed]}
                type="donut"
                height={280}
              />
            </div>
          </div>


          <div className="bg-white mb-3 dark:bg-gray-800 p-3 rounded-xl border-2 border-red-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Counselor Performance
            </h3>
            <Chart
              options={counselorPerformanceOptions}
              series={[
                {
                  name: 'Outbound',
                  data: analytics.map(item => item.outboundCalls)
                },
                {
                  name: 'Inbound',
                  data: analytics.map(item => item.inboundCalls)
                },
                {
                  name: 'Missed',
                  data: analytics.map(item => item.missedCalls || 0)
                }
              ]}
              type="bar"
              height={300}
            />
          </div>
          {/* Counselor Details Table */}
          <div className="bg-white mb-6 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detailed Analysis(In Seconds)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Counselor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Outbound
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Inbound
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Connected
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Missed
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Outbound Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Inbound Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg. Outbound Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg. Inbound Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Duration (s)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.map((item, index) => {
                    const connectionRate = ((item.connectedCalls / item.totalCalls) * 100).toFixed(1);
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.counselorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.totalCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.outboundCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.inboundCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.connectedCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.missedCalls || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.outboundDuration || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.inboundDuration.toFixed(2) || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.avgOutboundDuration.toFixed(2) || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.avgInboundDuration.toFixed(2) || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(item.avgDuration.toFixed(2) || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white mb-6 dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Average Call Duration
            </h3>
            <Chart
              options={durationOptions}
              series={[
                {
                  name: 'Avg Outbound Duration (s)',
                  data: analytics.map(item => Math.round(item.avgOutboundDuration || 0))
                },
                {
                  name: 'Avg Inbound Duration (s)',
                  data: analytics.map(item => Math.round(item.avgInboundDuration || 0))
                }
              ]}
              type="line"
              height={280}
            />
          </div>
        </>) : (
        <div className="flex justify-center items-center h-[70vh]">
          <img src="https://assets-v2.lottiefiles.com/a/0e30b444-117c-11ee-9b0d-0fd3804d46cd/hIe8Ns0ZnU.png" alt="loader" className='h-60 max-w-full w-60 ' />
        </div>
      )
      }
    </div>
  );
};

export default CallAnalytics;