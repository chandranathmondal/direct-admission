import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        // Decode the JWT to get user information
        const decoded: any = jwtDecode(credentialResponse.credential);
        
        // Extract the email and pass it to the login handler
        if (decoded.email) {
          onLogin(decoded.email);
        } else {
          alert("Could not retrieve email from Google Account.");
        }
      } catch (error) {
        console.error("Login Failed: Invalid Token", error);
        alert("Login failed. Please try again.");
      }
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    alert("Google Sign-In was unsuccessful. Please check your network or configuration.");
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
             <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
               <strong>Configuration Error:</strong><br/>
               Missing <code>REACT_APP_GOOGLE_CLIENT_ID</code>.<br/>
               Please configure this in your environment variables.
             </div>
           ) : (
             <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  theme="filled_blue"
                  size="large"
                  width="100%"
                  text="signin_with"
                  shape="rectangular"
                />
             </div>
           )}
           <p className="mt-4 text-xs text-slate-400 text-center">
             By signing in, you verify your identity with Google. Access is restricted to pre-authorized emails only.
           </p>
        </div>
      </div>
    </div>
  );
};