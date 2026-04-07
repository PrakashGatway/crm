import { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { useAuth } from '../../context/UserContext';
import PageMeta from "../../components/common/PageMeta";
import api from '../../axiosInstance';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LeadStatus } from '../Leads/LeadManagement';
import {
  SquareArrowOutUpRight, Phone, PhoneIncoming, PhoneMissed, PhoneCall,
  Clock, Users, TrendingUp, TrendingDown, Calendar, Filter, Download,
  ChevronDown, RefreshCw, AlertCircle, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router';

const CallAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState('all');
  const [days, setDays] = useState(1);
  const [statusWise, setStatusWise] = useState([]);
  const [counselorStatusSelections, setCounselorStatusSelections] = useState({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('performance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    endDate: new Date()
  });

  const [summary, setSummary] = useState({
    totalCalls: 0,
    totalOutbound: 0,
    totalInbound: 0,
    totalConnected: 0,
    totalMissed: 0,
    avgDuration: 0,
    totalCounselors: 0,
    connectionRate: 0,
    avgOutboundDuration: 0,
    avgInboundDuration: 0
  });

  // Fetch Analytics Data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        ...(selectedCounselor !== 'all' && { counselorId: selectedCounselor })
      };

      const [response, statusResponse] = await Promise.all([
        api.get('/leads/reports', { params }),
        api.get('/leads/reports/status', { params })
      ]);

      setStatusWise(statusResponse.data?.data || []);
      const data = response.data.data || [];
      setAnalytics(data);
      setCounselors(response.data.counselors || []);

      if (data.length > 0) {
        const totalCalls = data.reduce((sum, item) => sum + (item.totalCalls || 0), 0);
        const totalOutbound = data.reduce((sum, item) => sum + (item.outboundCalls || 0), 0);
        const totalInbound = data.reduce((sum, item) => sum + (item.inboundCalls || 0), 0);
        const totalConnected = data.reduce((sum, item) => sum + (item.connectedCalls || 0), 0);
        const totalMissed = data.reduce((sum, item) => sum + (item.missedCalls || 0), 0);
        const totalDuration = data.reduce((sum, item) => sum + (item.totalDuration || 0), 0);
        const totalOutboundDuration = data.reduce((sum, item) => sum + (item.outboundDuration || 0), 0);
        const totalInboundDuration = data.reduce((sum, item) => sum + (item.inboundDuration || 0), 0);
        const totalOutboundConnected = data.reduce((sum, item) => sum + (item.outboundConnected || 0), 0);
        const totalInboundConnected = data.reduce((sum, item) => sum + (item.inboundConnected || 0), 0);

        setSummary({
          totalCalls,
          totalOutbound,
          totalInbound,
          totalConnected,
          totalMissed,
          avgDuration: totalConnected > 0 ? (totalDuration / totalConnected / 60).toFixed(1) : 0,
          totalCounselors: data.length,
          connectionRate: totalCalls > 0 ? ((totalConnected / totalCalls) * 100).toFixed(1) : 0,
          avgOutboundDuration: totalOutboundConnected > 0 ? (totalOutboundDuration / totalOutboundConnected / 60).toFixed(1) : 0,
          avgInboundDuration: totalInboundConnected > 0 ? (totalInboundDuration / totalInboundConnected / 60).toFixed(1) : 0
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange.startDate, dateRange.endDate, selectedCounselor]);

  // Quick Range Options
  const rangeOptions = [
    { value: '12h', label: 'Today', days: 0 },
    { value: '24h', label: 'Last 24H', days: 1 },
    { value: '7d', label: 'Last 7 Days', days: 7 },
    // { value: '30d', label: 'Last 30 Days', days: 30 },
  ];

  const handleQuickRange = (days) => {
    setDays(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({ startDate: start, endDate: end });
  };

  // Chart Configurations
  const getCallDistributionOptions = () => ({
    chart: {
      type: 'donut',
      height: 320,
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    labels: ['Outbound', 'Inbound', 'Missed'],
    colors: ['#3B82F6', '#10B981', '#EF4444'],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 500,
      offsetY: 10,
      markers: { radius: 4 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Calls',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6B7280',
              formatter: () => summary.totalCalls.toLocaleString()
            },
            value: {
              fontSize: '20px',
              fontWeight: 700,
              formatter: (val) => val.toLocaleString()
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      style: { fontSize: '11px', fontWeight: 500 }
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (val) => `${val} calls` }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { height: 280 },
        legend: { position: 'bottom', fontSize: '10px' }
      }
    }]
  });

  const getCounselorPerformanceOptions = () => ({
    chart: {
      type: 'bar',
      height: 380,
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: { show: false },
      stacked: true,
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8,
        borderRadiusApplication: 'around',
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4, padding: { left: 10, right: 10 } },
    xaxis: {
      categories: analytics.map(item => {
        const name = item.counselorName || 'Unknown';
        return name.length > 12 ? name.substring(0, 12) + '...' : name;
      }),
      labels: {
        rotate: -45, trim: true, minHeight: 50,
        style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: { text: 'Calls', style: { fontSize: '11px', fontWeight: 500, color: '#6B7280' } },
      labels: {
        formatter: (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val),
        style: { fontSize: '10px', colors: '#6B7280' }
      }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    legend: {
      position: 'top', horizontalAlign: 'right',
      fontSize: '11px', fontWeight: 500, markers: { radius: 4 }, offsetY: -5
    },
    tooltip: { shared: true, intersect: false, theme: 'light', y: { formatter: (val) => `${val} calls` } },
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: { bar: { columnWidth: '80%' } },
        legend: { position: 'bottom', horizontalAlign: 'center' }
      }
    }]
  });

  const getDurationTrendOptions = () => ({
    chart: {
      type: 'line',
      height: 380,
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      drop: { enabled: true, top: 3, left: 0, blur: 4, opacity: 0.1 }
    },
    stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
    dataLabels: { enabled: false },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4, padding: { left: 10, right: 10 } },
    xaxis: {
      categories: analytics.map(item => {
        const name = item.counselorName || 'Unknown';
        return name.length > 12 ? name.substring(0, 12) + '...' : name;
      }),
      labels: {
        rotate: -45, trim: true, minHeight: 50,
        style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: { text: 'Avg Duration (min)', style: { fontSize: '11px', fontWeight: 500, color: '#6B7280' } },
      labels: {
        formatter: (val) => `${val.toFixed(1)}m`,
        style: { fontSize: '10px', colors: '#6B7280' }
      }
    },
    colors: ['#3B82F6', '#10B981'],
    markers: { size: 4, strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
    legend: {
      position: 'top', horizontalAlign: 'right',
      fontSize: '11px', fontWeight: 500, markers: { radius: 4 }, offsetY: -5
    },
    tooltip: { theme: 'light', shared: true, intersect: false, y: { formatter: (val) => `${val.toFixed(1)} minutes` } },
    responsive: [{
      breakpoint: 768,
      options: { legend: { position: 'bottom', horizontalAlign: 'center' } }
    }]
  });

  const getConnectionRateOptions = () => ({
    chart: {
      type: 'radialBar',
      height: 280,
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: '70%', background: '#F9FAFB' },
        track: { background: '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          show: true,
          name: { fontSize: '13px', fontWeight: 600, color: '#6B7280', offsetY: -10 },
          value: { fontSize: '24px', fontWeight: 700, color: '#111827', formatter: (val) => `${val}%`, offsetY: 5 },
          total: {
            show: true, label: 'Connection Rate', fontSize: '11px', fontWeight: 500,
            color: '#9CA3AF', formatter: () => `${summary.connectionRate}%`
          }
        }
      }
    },
    stroke: { lineCap: 'round' },
    colors: [summary.connectionRate >= 70 ? '#10B981' : summary.connectionRate >= 40 ? '#F59E0B' : '#EF4444'],
    labels: ['Connected']
  });

  // Stat Card Component
  const StatCard = ({ title, value, icon, trend, subtitle, color = 'blue', suffix = '' }) => {
    const colorConfig = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200', trend: 'text-blue-600' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200', trend: 'text-green-600' },
      red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200', trend: 'text-red-600' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200', trend: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200', trend: 'text-orange-600' },
    };
    const config = colorConfig[color] || colorConfig.blue;

    return (
      <div className={`bg-white rounded-xl border ${config.border} p-5 hover:-md transition-all duration-200 group`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
            <div className="flex items-baseline gap-1 mt-2">
              <p className="text-2xl font-bold text-gray-900 truncate">
                {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
              </p>
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-1.5">{subtitle}</p>}
            {trend !== undefined && (
              <div className="flex items-center gap-1.5 mt-2.5">
                {trend >= 0 ? (
                  <ArrowUpRight className={`w-3.5 h-3.5 ${config.trend}`} />
                ) : (
                  <ArrowDownRight className={`w-3.5 h-3.5 ${config.trend}`} />
                )}
                <span className={`text-xs font-semibold ${config.trend}`}>
                  {Math.abs(trend).toFixed(1)}% vs last period
                </span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Phone className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No call data available</h3>
      <p className="text-gray-500 text-sm mb-4">Try adjusting your date range or counselor filter to see analytics</p>
      <button
        onClick={() => {
          setDays(1);
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 1);
          setDateRange({ startDate: start, endDate: end });
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reset to Last 24 Hours
      </button>
    </div>
  );

  // Error State
  const ErrorState = () => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-red-900">Failed to load data</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-gray-50 to-gray-100">
      <PageMeta
        title="Call Analytics Dashboard"
        description="Comprehensive analysis of counselor call performance and lead conversion metrics"
      />

      <div className="p-4 mx-auto">

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 -sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date Range:</span>
            </div>

            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQuickRange(option.days)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${days === option.days
                      ? 'bg-white text-gray-900 -sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <DatePicker
                selected={dateRange.startDate}
                onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                selectsStart
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                dateFormat="dd MMM yyyy"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholderText="Start"
              />
              <span className="text-sm text-gray-400">—</span>
              <DatePicker
                selected={dateRange.endDate}
                onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                selectsEnd
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                minDate={dateRange.startDate}
                dateFormat="dd MMM yyyy"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholderText="End"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
              >
                <option value="all">All Counselors</option>
                {counselors.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : analytics.length === 0 && statusWise.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Calls"
                value={summary.totalCalls}
                icon={<Phone className="w-5 h-5" />}
                subtitle={`${summary.totalOutbound} out · ${summary.totalInbound} in`}
                color="blue"
              />
              <StatCard
                title="Connected"
                value={summary.totalConnected}
                icon={<PhoneCall className="w-5 h-5" />}
                subtitle={`${summary.connectionRate}% connection rate`}
                color="green"
              />
              <StatCard
                title="Missed"
                value={summary.totalMissed}
                icon={<PhoneMissed className="w-5 h-5" />}
                subtitle={`${summary.totalCalls > 0 ? ((summary.totalMissed / summary.totalCalls) * 100).toFixed(1) : 0}% missed rate`}
                color="red"
              />
              <StatCard
                title="Avg Duration"
                value={summary.avgDuration}
                icon={<Clock className="w-5 h-5" />}
                subtitle={`Out: ${summary.avgOutboundDuration}m · In: ${summary.avgInboundDuration}m`}
                color="purple"
                suffix=" min"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Call Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 -sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    Call Distribution
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {summary.totalCalls.toLocaleString()} total
                  </span>
                </div>
                <Chart
                  options={getCallDistributionOptions()}
                  series={[summary.totalOutbound, summary.totalInbound, summary.totalMissed]}
                  type="donut"
                  height={320}
                />
              </div>

              {/* Connection Rate */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 -sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    Connection Performance
                  </h3>
                </div>
                <div className="flex items-center justify-center">
                  <Chart
                    options={getConnectionRateOptions()}
                    series={[parseFloat(summary.connectionRate)]}
                    type="radialBar"
                    height={280}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{summary.totalConnected}</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{summary.totalMissed}</p>
                    <p className="text-xs text-gray-500">Missed</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{summary.totalCalls}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Counselor Performance Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 -sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Counselor Performance Overview
                </h3>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {['performance', 'duration'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveChartTab(tab)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeChartTab === tab
                          ? 'bg-white text-gray-900 -sm'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {tab === 'performance' ? 'Call Volume' : 'Duration Trends'}
                    </button>
                  ))}
                </div>
              </div>

              {activeChartTab === 'performance' ? (
                <Chart
                  options={getCounselorPerformanceOptions()}
                  series={[
                    { name: 'Outbound', data: analytics.map(item => item.outboundCalls || 0) },
                    { name: 'Inbound', data: analytics.map(item => item.inboundCalls || 0) },
                    { name: 'Missed', data: analytics.map(item => item.missedCalls || 0) }
                  ]}
                  type="bar"
                  height={380}
                />
              ) : (
                <Chart
                  options={getDurationTrendOptions()}
                  series={[
                    {
                      name: 'Avg Outbound',
                      data: analytics.map(item =>
                        item.avgOutboundDuration ? parseFloat(item.avgOutboundDuration) / 60 : 0
                      )
                    },
                    {
                      name: 'Avg Inbound',
                      data: analytics.map(item =>
                        item.avgInboundDuration ? parseFloat(item.avgInboundDuration) / 60 : 0
                      )
                    }
                  ]}
                  type="line"
                  height={380}
                />
              )}
            </div>

            {/* ========================================== */}
            {/* STATUS-WISE LEAD ANALYSIS - ORIGINAL TABLE */}
            {/* ========================================== */}
            {statusWise.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 -sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Status-wise Lead Analysis</h3>
                </div>

                {/* Status Filter Bar - Original Style */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-600">Filter by Status:</span>
                    {Object.entries(LeadStatus).map(([value, label], index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedStatusFilter(value === 'all' ? null : value);
                          setCounselorStatusSelections({});
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${(selectedStatusFilter === null && value === 'all') || selectedStatusFilter === value
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {value === 'all' ? 'All' : label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Original Table Structure */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counselor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Connected</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Missed</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Call Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(
                        statusWise.reduce((acc, item) => {
                          if (!acc[item.counselorName]) {
                            acc[item.counselorName] = {
                              counselorId: item?._id?.counselor,
                              statuses: {},
                              allStatuses: []
                            };
                          }
                          acc[item.counselorName].statuses[item.status] = item;
                          acc[item.counselorName].allStatuses.push(item);
                          return acc;
                        }, {})
                      ).map(([counselorName, counselorData], index) => {
                        const availableStatuses = counselorData.allStatuses.map(s => s.status);
                        const currentStatus = selectedStatusFilter && availableStatuses.includes(selectedStatusFilter)
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
                            avgDuration: all.reduce((sum, s) => sum + (s.avgDuration || 0), 0) / (all.length || 1)
                          };
                        } else {
                          currentData = counselorData.statuses[currentStatus];
                        }

                        if (selectedStatusFilter && !availableStatuses.includes(selectedStatusFilter)) {
                          return null;
                        }

                        return (
                          <tr key={`${counselorName}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{counselorName}</span>
                                <button
                                  onClick={() => navigate(`/leads?user=${counselorData.counselorId}&status=${currentStatus || 'new'}`)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="View leads"
                                >
                                  <SquareArrowOutUpRight size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <select
                                value={currentStatus}
                                onChange={(e) => {
                                  setCounselorStatusSelections({
                                    ...counselorStatusSelections,
                                    [counselorName]: e.target.value
                                  });
                                  setSelectedStatusFilter(null);
                                }}
                                className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              >
                                <option value="all">All ({counselorData.allStatuses.reduce((acc, status) => acc + (status.leadCount || 0), 0)} leads)</option>
                                {counselorData.allStatuses.map(status => (
                                  <option key={status.status} value={status.status}>
                                    {LeadStatus[status.status] || status.status} ({status.leadCount || 0} leads)
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900">{currentData?.leadCount || 0}</span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <span className="text-sm text-gray-900">{currentData?.totalCalls || 0}</span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <span className="text-sm font-medium text-green-600">{currentData?.connectedCalls || 0}</span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <span className="text-sm text-red-600">{currentData?.missedCalls || 0}</span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-900">
                                {currentData?.totalDuration > 0 ? `${Math.round(currentData.totalDuration / 60)}m` : '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {currentData?.avgDuration > 0 ? `${Math.round(currentData.avgDuration)}s avg` : ''}
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Out:</span>
                                  <span className="text-xs font-medium text-blue-600">{currentData?.outboundCalls || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">In:</span>
                                  <span className="text-xs font-medium text-green-600">{currentData?.inboundCalls || 0}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }).filter(Boolean)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 -sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Detailed Call Metrics</h3>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Counselor</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Outbound</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Inbound</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Connected</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Missed</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Duration</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Connect Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.map((item, index) => {
                      const connectRate = item.totalCalls > 0
                        ? ((item.connectedCalls || 0) / item.totalCalls * 100).toFixed(1)
                        : 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{item.counselorName}</span>
                              <button
                                onClick={() => navigate(`/leads?user=${item._id}`)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                              >
                                <SquareArrowOutUpRight size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-gray-900">{item.totalCalls}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-blue-600">{item.outboundCalls}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-green-600">{item.inboundCalls}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-green-600">{item.connectedCalls || 0}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-red-600">{item.missedCalls || 0}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-gray-700">
                              {item.avgDuration ? `${Math.round(item.avgDuration / 60)}m` : '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${connectRate >= 70 ? 'bg-green-100 text-green-700' :
                                connectRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                              {connectRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CallAnalytics;