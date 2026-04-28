import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/UserContext";
import api from "../../axiosInstance";

export default function SignInForm() {
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/send-otp", { email });

      if (response.data.success) {
        setOtpSent(true);
        setStep("otp");
        startCountdown(60);
        setError("");
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      if (response.data.success) {
        const { token } = response.data;

        // Store token based on "Remember me" preference
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("accessToken", token);

        // Set default auth header
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Fetch user profile
        await fetchUserProfile();

        // Navigate to dashboard
        navigate("/");
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "OTP verification failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/send-otp", { email });

      if (response.data.success) {
        startCountdown(60);
        setError("");
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to resend OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle back to email
  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError("");
    setCountdown(0);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {step === "email" ? "Sign In" : "Verify OTP"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === "email"
                ? "Enter your email to receive a login OTP"
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          {step === "email" ? (
            // Email Form
            <form onSubmit={handleSendOtp}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <Label htmlFor="rememberMe" className="!mb-0 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                    isLoading={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            // OTP Form
            <form onSubmit={handleVerifyOtp}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="otp">
                    OTP Code <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 6) {
                        setOtp(value);
                      }
                    }}
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Please enter the 6-digit verification code sent to your email
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    ← Use different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className={`text-sm ${
                      countdown > 0 || loading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    }`}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                    isLoading={loading}
                  >
                    {loading ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === "email" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}