import { useEffect } from "react";

export default function SaveTokenFromQuery() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("access");

    if (token) {
      localStorage.setItem("accessToken", token);
      
      console.log("Token saved to localStorage:", token);
      const url = new URL(window.location.href);
      
      url.searchParams.delete("access");

      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  return null; // nothing visible, just runs effect
}
