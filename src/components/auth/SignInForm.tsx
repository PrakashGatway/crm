import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeClosedIcon, EyeCloseIcon, EyeIcon, LucideEyeOff } from "lucide-react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/UserContext";
import api from "../../axiosInstance"; // Import your Axios instance

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token } = response.data;

    if (!token) {
      throw new Error("Token not received from server");

    }

    console.log(token)

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("accessToken", token);

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    await fetchUserProfile();

    navigate("/");
  } catch (err) {
    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Login failed. Please try again.";

    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
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
                />
              </div>
              
              <div>
                <Label htmlFor="password">
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="current-password"
                  />
               
                </div>
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
                  {loading ? "Signing..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>
             <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-145 top-105 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <LucideEyeOff className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                      
                    )}
                  </button>
{/*           
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
          </div> */}
        </div>
      </div>
    </div>
  );
}