import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, Mail, Phone, UserPlus, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from './axiosInstance';

const JoinMeetingPage = () => {
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const meetingId = window.location.pathname.split('/').pop(); // Extract meeting ID from URL

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: ''
  });

  const [joinWindow, setJoinWindow] = useState({
    canJoin: false,
    status: 'loading', // 'loading' | 'upcoming' | 'available' | 'ended' | 'expired'
    message: '',
    timeRemaining: null
  });

  const [isJoining, setIsJoining] = useState(false);
  const [errors, setErrors] = useState({});

  // 🔄 Fetch meeting data from API
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/leads/meeting/activity/${meetingId}`);
        const result = response.data

        if (!result.success || !result.data?.[0]) {
          throw new Error('Meeting not found');
        }

        const meeting = result.data[0];
        setMeetingData(meeting);

        // Pre-fill form with lead data if available
        if (meeting.lead) {
          setFormData({
            fullName: meeting.lead.fullName || '',
            email: meeting.lead.email || '',
            phone: meeting.lead.phone || meeting.lead.phone10 || '',
            company: ''
          });
        }

      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch meeting:', err);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);

  // ⏰ Check 5-minute join window (runs every 30 seconds)
  useEffect(() => {
    if (!meetingData?.meetingDetails?.scheduledAt) return;

    const checkJoinWindow = () => {
      const now = new Date();
      const scheduledAt = new Date(meetingData.meetingDetails.scheduledAt);
      const windowMs = 5 * 60 * 1000; // 5 minutes in milliseconds

      const timeDiff = now - scheduledAt;
      const absDiff = Math.abs(timeDiff);

      // Calculate remaining time for display
      let timeRemaining = null;
      if (timeDiff < -windowMs) {
        const untilStart = scheduledAt - now;
        const mins = Math.ceil(untilStart / 60000);
        timeRemaining = mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
      }

      // Determine join status based on 5-minute window
      if (absDiff <= windowMs) {
        // ✅ Within 5 min before OR after scheduled time
        setJoinWindow({
          canJoin: true,
          status: 'available',
          message: timeDiff <= 0 ? 'Meeting is starting soon' : 'Meeting is in progress',
          timeRemaining: null
        });
      } else if (timeDiff < -windowMs) {
        // ⏳ More than 5 min before start
        setJoinWindow({
          canJoin: false,
          status: 'upcoming',
          message: `Joining opens 5 minutes before start time`,
          timeRemaining: timeRemaining
        });
      } else if (timeDiff > windowMs) {
        // ❌ More than 5 min after start (meeting ended/expired)
        setJoinWindow({
          canJoin: false,
          status: meetingData.meetingDetails.status === 'completed' ? 'expired' : 'ended',
          message: 'Joining window has closed',
          timeRemaining: null
        });
      }
    };

    checkJoinWindow();
    const interval = setInterval(checkJoinWindow, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [meetingData]);

  const formatDateTime = (isoString) => {
    if (!isoString) return { date: '', time: '' };
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    if (!validateForm() || !joinWindow.canJoin) return;

    setIsJoining(true);
    try {
      // Register attendee with backend
      const response = await api.get(`/meetings/${meetingId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            company: formData.company
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to register');

      // Redirect to actual meeting link
      window.open(meetingData.meetingDetails.link, '_blank', 'noopener,noreferrer');

    } catch (err) {
      setError(err.message);
      alert('Failed to join meeting. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  // ❌ Error State
  if (error || !meetingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load meeting</h3>
          <p className="text-gray-500 mb-6">{error || 'Meeting not found or has been removed.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { date: formattedDate, time: formattedTime } = formatDateTime(meetingData.meetingDetails.scheduledAt);
  const getStatusBadge = () => {
    const styles = {
      available: 'bg-green-100 text-green-800 border-green-200',
      upcoming: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ended: 'bg-gray-100 text-gray-600 border-gray-200',
      expired: 'bg-red-100 text-red-800 border-red-200'
    };
    const icons = {
      available: <CheckCircle className="w-3 h-3 mr-1" />,
      upcoming: <Clock className="w-3 h-3 mr-1" />,
      ended: <Clock className="w-3 h-3 mr-1" />,
      expired: <AlertCircle className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[joinWindow.status]}`}>
        {icons[joinWindow.status]}
        {joinWindow.status === 'available' ? 'Join Available' :
          joinWindow.status === 'upcoming' ? 'Upcoming' :
            joinWindow.status === 'expired' ? 'Expired' : 'Ended'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-38 h-full">
                <img src="https://www.gatewayabroadeducations.com/images/logo.svg" alt="" />
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-3">
          <div className="lg:col-span-1 space-y-6 h-full">
            {/* Meeting Card */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-800 to-blue-500 px-6 py-3">
                <h2 className="text-lg font-semibold text-white mb-1">{meetingData.title}</h2>
                <p className="text-blue-100 text-sm line-clamp-2">{meetingData.description}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Schedule */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                    Scheduled Time
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{formattedDate}</p>
                        <p className="text-sm text-gray-500">
                          {meetingData?.meetingDetails?.scheduledAt
                            ? new Date(meetingData.meetingDetails.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "N/A"}
                        </p>     </div>
                    </div>
                    {joinWindow.status === 'upcoming' && joinWindow.timeRemaining && (
                      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Starts in {joinWindow.timeRemaining}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5-Minute Window Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <Clock className="w-4 h-4 inline mr-1 -mt-0.5" />
                    You can join this meeting from <strong>5 minutes before</strong> until <strong>5 minutes after</strong> the scheduled start time.
                  </p>
                </div>

                {/* Lead Info (if available) */}
                {meetingData.lead && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                      Registered User
                    </label>
                    <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{meetingData.lead.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{meetingData.lead.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Join Form / Status */}
          <div className="lg:col-span-2 h-full">
            <div className="bg-white rounded-2xl p-6 lg:p-8 h-full">

              {/* ✅ Can Join - Show Form */}
              {joinWindow.canJoin ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h3 className="text-xl font-semibold text-gray-900">Join the meeting</h3>
                    </div>
                    <p className="text-gray-500">
                      {joinWindow.message}. Please confirm your details below to join the video call.
                    </p>
                  </div>

                  <form onSubmit={handleJoinMeeting} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            placeholder="john@company.com"
                          />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone Number <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Company <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Company name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Security Note */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        Your details are securely registered. You'll be redirected to the meeting platform immediately.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={isJoining}
                        className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJoining ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Joining...</span>
                          </>
                        ) : (
                          <>
                            <span>Join Meeting Now</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center pt-2">
                      By joining, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${joinWindow.status === 'upcoming' ? 'bg-gray-100' : 'bg-gray-100'
                    }`}>
                    {joinWindow.status === 'upcoming' ? (
                      <Clock className="w-12 stroke-[1.4px] h-12 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-12 h-12 stroke-[1.4px] text-gray-400" />
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {joinWindow.status === 'upcoming' ? 'Meeting hasn\'t started yet' : 'Joining is no longer available'}
                  </h3>

                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {joinWindow.message}
                    {joinWindow.status === 'upcoming' && (
                      <>
                        <br className="sm:hidden" />
                        <span className="hidden sm:inline"> </span>
                        Please return when the join window opens.
                      </>
                    )}
                  </p>

                  {joinWindow.status === 'upcoming' && joinWindow.timeRemaining && (
                    <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-5 py-3 mb-6">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm">
                        Joining opens in <strong className="text-blue-900">{joinWindow.timeRemaining}</strong>
                      </span>
                    </div>
                  )}

                  {joinWindow.status === 'upcoming' && (
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm block mx-auto border p-2  text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Refresh page to check status
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-500">
          <p>© 2026 Gateway Abroad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default JoinMeetingPage;