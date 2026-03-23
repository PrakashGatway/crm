// IncomingCallsModal.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import moment from "moment";
import { Modal } from "../../components/ui/modal";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import {
  X,
  Calendar,
  PhoneIncoming,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Clock,
  RefreshCw,
  Play,
  AlertTriangle,
  Download,
  Volume2,
  User,
  Hash,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../components/ui/button/Button";

const IncomingCallsModal = ({ leadPhone, leadName, isOpen, onClose,setSelectedLeadForActivity,setActivityModalOpen }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);
  const audioRef = useRef(null);

  // Call status mapping
  const callStatusMap = {
    "3": { text: "Answered", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: PhoneCall },
    "Answer": { text: "Answered", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: PhoneCall },

    "4": { text: "Busy", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: PhoneOff },
    "5": { text: "No Answer", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: PhoneMissed },
    "Missed": { text: "No Answer", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: PhoneMissed },

    "6": { text: "Rejected", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", icon: XCircle },
    "7": { text: "Failed", color: "text-red-700", bgColor: "bg-red-50 dark:bg-red-900/20", icon: AlertTriangle },
  };

  // Default status for unknown
  const getCallStatus = (status) => {
    return callStatusMap[status] || { 
      text: "Unknown", 
      color: "text-gray-600", 
      bgColor: "bg-gray-100 dark:bg-gray-800", 
      icon: PhoneIncoming 
    };
  };

  // Fetch incoming calls
  const fetchCalls = useCallback(
    async (reset = false, showToast = false) => {
      if ((loading && !reset) || refreshing) return;
      
      try {
        if (reset) {
          setRefreshing(true);
        } else if (page > 1) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        
        const currentPage = reset ? 1 : page;
        
        const params = {
          page: currentPage,
          limit: 20,
          ...(leadPhone && { leadPhone }), // Filter by lead phone if provided
        };

        const res = await api.get("/leads/activity/incoming", { params });
        const data = res.data;

        if (reset || currentPage === 1) {
          setCalls(data.data);
          if (data.data.length > 0) {
            setSelectedCall(data.data[0]);
          }
        } else {
          setCalls((prev) => {
            const existingIds = new Set(prev.map(call => call._id));
            const newCalls = data.data.filter(call => !existingIds.has(call._id));
            return [...prev, ...newCalls];
          });
        }

        // Check if there are more pages
        const totalPages = Math.ceil((data.pagination?.total || 0) / params.limit);
        setHasMore(currentPage < totalPages);
        
        if (showToast) {
          toast.success(`Loaded ${data.data.length} calls`);
        }
        
        // Update page number for next fetch
        if (!reset) {
          setPage(currentPage + 1);
        } else {
          setPage(2); // Start at page 2 after reset
        }
      } catch (err) {
        console.error("Failed to fetch incoming calls:", err);
        toast.error(err.response?.data?.message || "Failed to load incoming calls");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [loading, refreshing, page, leadPhone]
  );

  // Load more calls
  const loadMoreCalls = () => {
    if (!loadingMore && hasMore) {
      fetchCalls(false, false);
    }
  };

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setCalls([]);
      setSelectedCall(null);
      fetchCalls(true);
    }
  }, [isOpen]);

  // Handle audio play/pause
  const handleAudioPlay = (callId) => {
    if (audioPlaying === callId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setAudioPlaying(null);
    } else {
      setAudioPlaying(callId);
    }
  };

  // Group calls by date
  const groupedCalls = calls.reduce((acc, call) => {
    const date = moment(call.ivrSTime).format("DD MMM YYYY");
    if (!acc[date]) acc[date] = [];
    acc[date].push(call);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedCalls).sort((a, b) =>
    moment(b, "DD MMM YYYY").diff(moment(a, "DD MMM YYYY"))
  );

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-7xl w-full"
    >
      <div className="relative w-full h-[95vh] rounded-3xl bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 shadow px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <PhoneIncoming className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Incoming Calls
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCalls(true, true)}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Calls List - Left Panel */}
          <div className="w-[50%] border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Calls: {calls.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {moment().format("MMM D, YYYY")}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence>
                {sortedDates.map((date, dateIndex) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dateIndex * 0.05 }}
                    className="mb-6"
                  >
                    <div className="sticky -top-4 z-10 bg-gray-300 p-2 rounded-lg dark:bg-gray-900 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                          {moment(date, "DD MMM YYYY").format("dddd, MMMM D, YYYY")}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {groupedCalls[date].length} calls
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {groupedCalls[date].map((call, callIndex) => {
                        const status = getCallStatus(call.status);
                        const StatusIcon = status?.icon || PhoneIncoming;
                        const isSelected = selectedCall?._id === call._id;

                        return (
                          <motion.div
                            key={call._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: callIndex * 0.02 }}
                          >
                            <div
                              onClick={() => setSelectedCall(call)}
                              className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? "bg-blue-100 dark:bg-blue-900/20 border-l-4 border-blue-500 shadow-sm"
                                  : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${status.bgColor}`}>
                                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                      {call.phone}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                                      {status.text}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {moment(call.ivrSTime).format("h:mm A")}
                                    </span>
                                    <span>•</span>
                                    <span>{formatDuration(call.duration)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {hasMore && calls.length > 0 && (
                <div className="mt-6 mb-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreCalls}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        Load More Calls
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Loading Indicator for initial load */}
              {loading && calls.length === 0 && (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading calls...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && calls.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <PhoneIncoming className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Incoming Calls
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {leadPhone 
                      ? "No incoming calls found for this lead."
                      : "No incoming calls recorded yet."
                    }
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCalls(true)}
                    className="mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Call Details - Right Panel */}
          <div className=" w-1/2 flex-1 flex flex-col">
            {selectedCall ? (
              <div className="flex-1 overflow-y-auto p-6">
                <motion.div
                  key={selectedCall._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Call Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Call Details
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {moment(selectedCall.ivrSTime).format("dddd, MMMM D, YYYY")}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full ${getCallStatus(selectedCall.status)?.bgColor}`}>
                        <span className={`text-sm font-medium ${getCallStatus(selectedCall.status)?.color}`}>
                          {getCallStatus(selectedCall.status)?.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Call Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Basic Info Card */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Call Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phone Number</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedCall?.phone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Start Time</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {moment(selectedCall?.ivrSTime).format("h:mm:ss A")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Duration</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatDuration(selectedCall?.duration)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Call Type</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Incoming
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details Card */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Technical Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Target Number</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {selectedCall?.extraDetails?.did || "N/A"}
                          </span>
                        </div>
                        {selectedCall.extraDetails?.HangupBySourceDetected && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Hung Up By</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedCall.extraDetails.HangupBySourceDetected === "0" ? (
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-4 h-4" />
                                  Student
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Counselor
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                   <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Leads Details

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLeadForActivity(selectedCall.leadinfo);
                            setActivityModalOpen(true);
                          }}
                          variant="outline">
                          View Detail
                        </Button>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Name</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {selectedCall?.leadinfo?.fullName || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email Add.</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {selectedCall?.leadinfo?.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phone Number</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {selectedCall?.leadinfo?.phone10 || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status</span>
                          <span className="font-medium text-gray-900 dark:text-white uppercase text-sm">
                            {selectedCall?.leadinfo?.status || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                  {/* Recording Section */}
                  {/* {selectedCall.recordingData?.[0] && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Volume2 className="w-4 h-4" />
                          Call Recording
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadRecording(selectedCall)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <audio
                          key={selectedCall._id}
                          controls
                          className="w-full"
                          onPlay={() => setAudioPlaying(selectedCall._id)}
                          onPause={() => setAudioPlaying(null)}
                          onEnded={() => setAudioPlaying(null)}
                        >
                          <source
                            src={`https://w.digiskyweb.com/v2/recording/direct/28882897${selectedCall.recordingData[0].file}`}
                            type="audio/mpeg"
                          />
                          Your browser does not support the audio element.
                        </audio>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>Recording available: {moment(selectedCall.ivrSTime).format("MMMM D, YYYY h:mm A")}</p>
                        </div>
                      </div>
                    </div>
                  )} */}
                </motion.div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <PhoneCall className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-6" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Select a Call
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Choose a call from the list on the left to view detailed information, 
                  listen to recordings, and analyze call data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IncomingCallsModal;