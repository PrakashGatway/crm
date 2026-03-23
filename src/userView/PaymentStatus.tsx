// src/pages/PaymentStatusPage.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, ArrowRight, Home, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import confetti from "canvas-confetti";

type PaymentStatus = "success" | "failed" | "pending";

interface PaymentState {
  status: PaymentStatus;
  amount?: number; // in paise
  courseTitle?: string;
  orderId?: string;
  transactionId?: string;
  paymentMethod?: string;
  purchaseDate?: string;
  currency?: string;
}

const PaymentStatusPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const {
    status = "success",
    amount = 0,
    orderId = "ORDER-XXXX",
    transactionId = "TXN-XXXX",
    paymentMethod = "—",
    purchaseDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    currency = "INR"
  } = (location.state || {}) as PaymentState;

  // Trigger confetti on success
  useEffect(() => {
    if (status === "success") {
      const end = Date.now() + 3000;
      const colors = ["#10B981", "#059669", "#047857", "#065F46", "#ECFDF5"];

      const frame = () => {
        if (Date.now() > end) return;
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
        requestAnimationFrame(frame);
      };
      frame();
    }
  }, [status]);

  // Auto-redirect
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      setIsRedirecting(true);
      setTimeout(() => {
        if (status === "success") {
          navigate("/my-courses", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 600);
    }, 85000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [navigate, status]);

  const formatINR = (paise: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const handleDownloadInvoice = () => {
    alert("Invoice download started!");
  };

  // Status-specific config
  const statusConfig = {
    success: {
      title: "Payment Successful!",
      subtitle: "Welcome to your new course! You can start learning immediately.",
      icon: <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      primaryBtnText: "Start Learning Now",
      redirectPath: "/my-courses",
      showDetails: true,
      countdownColor: "text-green-600 dark:text-green-400"
    },
    failed: {
      title: "Payment Failed",
      subtitle: "Something went wrong. Please try again or contact support.",
      icon: <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      primaryBtnText: "Retry Payment",
      redirectPath: "/",
      showDetails: false,
      countdownColor: "text-red-600 dark:text-red-400"
    },
    pending: {
      title: "Payment Processing...",
      subtitle: "Please wait while we confirm your payment.",
      icon: <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      primaryBtnText: "Check Status",
      redirectPath: "/",
      showDetails: false,
      countdownColor: "text-blue-600 dark:text-blue-400"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden ${
      status === "success" 
        ? "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        : status === "failed"
        ? "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    }`}>
      {/* Confetti Canvas */}
      <canvas 
        id="confetti-canvas" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          zIndex: 10 
        }} 
      />

      {/* Background Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-current/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-current/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-75"></div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-2xl">
        <div className="text-center">
          {/* Animated Icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ scale: 0, rotate: status === "success" ? -180 : 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 250, 
                damping: 20 
              }}
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${config.iconBg}`}
            >
              {config.icon}
            </motion.div>
          </AnimatePresence>

          {/* Title & Subtitle */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3"
          >
            {config.title}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-8"
          >
            {config.subtitle}
          </motion.p>

          {/* Payment Details (Success Only) */}
          {status === "success" && config.showDetails && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8 border border-green-100 dark:border-green-900/30 max-w-md mx-auto"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Payment Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatINR(amount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                  <span className="font-mono">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Method</span>
                  <span>{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date</span>
                  <span>{purchaseDate}</span>
                </div>
              </div>
              <button
                onClick={handleDownloadInvoice}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-lg font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </button>
            </motion.div>
          )}

          {/* Countdown & Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: status === "success" ? 0.4 : 0.2 }}
            className="space-y-4 max-w-md mx-auto"
          >
            <p className={`text-sm font-mono ${config.countdownColor}`}>
              Redirecting in <span className="font-bold">{countdown}s</span>
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsRedirecting(true);
                setTimeout(() => navigate(config.redirectPath), 300);
              }}
              disabled={isRedirecting}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold shadow-lg transition-all ${
                status === "success"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  : status === "failed"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              } ${isRedirecting ? "opacity-80 cursor-not-allowed" : ""}`}
            >
              {isRedirecting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5"
                  >
                    <ArrowRight />
                  </motion.div>
                  {status === "success" ? "Going to Dashboard..." : "Redirecting..."}
                </>
              ) : (
                <>
                  {config.primaryBtnText}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>

            {status !== "pending" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-3 px-6 rounded-xl font-medium border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                Back to Homepage
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusPage;