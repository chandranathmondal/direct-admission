
import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

interface LoginProps {
  onLogin: (token: string) => void;
  loginError?: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, loginError: appError }) => {
  const [loginError, setLoginError] = useState<string | null>(null);

  React.useEffect(() => {
    if (appError) {
      setLoginError(appError);
    }
  }, [appError]);
  
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    setLoginError(null); // Clear previous errors

    if (credentialResponse.credential) {
      try {
        // Pass the entire token to the parent component
        onLogin(credentialResponse.credential);
        
      } catch (error) {
        console.error("Login Failed: Invalid Token", error);
        setLoginError("Login verification failed. Please try again.");
      }
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    setLoginError("Google Sign-In was unsuccessful. Please check your network configuration.");
  };

  return (
    <div className="flex justify-center px-4 py-6 lg:py-0 lg:min-h-[80vh] lg:items-center">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 font-serif">Admin Access</h2>
          <p className="mt-2 text-sm text-slate-600 font-sans">
            Secure sign-in for authorized personnel only
          </p>
        </div>
        
        <div className="mt-8 flex justify-center flex-col items-center">
           {!process.env.REACT_APP_GOOGLE_CLIENT_ID ? (
             <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 w-full mb-4">
               <strong>Configuration Error:</strong><br/>
               Missing <code>REACT_APP_GOOGLE_CLIENT_ID</code>.<br/>
               Please configure this in your environment variables.
             </div>
           ) : (
             <div className="w-full flex flex-col items-center gap-4">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  theme="outline"
                  size="large"
                  shape="pill"
                  width="300"
                  text="signin_with"
                />

                {/* Error Message UI */}
                {loginError && (
                  <div className="w-full p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-sm text-red-800">
                      <span className="font-bold block text-red-900">Login Failed</span>
                      {loginError}
                    </div>
                  </div>
                )}
             </div>
           )}
           <p className="mt-6 text-xs text-slate-400 text-center max-w-xs mx-auto">
             By signing in, you verify your identity with Google. Access is restricted to pre-authorized emails only.
           </p>
        </div>
      </div>
    </div>
  );
};