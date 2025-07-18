import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { restaurantAPI, handleAPIError } from '../../utils/api';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  
  const { uid, token } = useParams();
  const navigate = useNavigate();

  // Validate URL parameters
  useEffect(() => {
    if (!uid || !token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate form
    const errors = {};
    
    if (!formData.new_password) {
      errors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors highlighted below');
      setLoading(false);
      return;
    }

    try {
      await restaurantAPI.resetPassword({
        uid,
        token,
        new_password: formData.new_password
      });
      
      setSuccess(true);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      setError(errorMessage);
      
      // Handle field-specific errors from backend
      if (error.response?.data && typeof error.response.data === 'object') {
        const backendErrors = {};
        Object.keys(error.response.data).forEach(field => {
          if (Array.isArray(error.response.data[field])) {
            backendErrors[field] = error.response.data[field][0];
          } else {
            backendErrors[field] = error.response.data[field];
          }
        });
        setFieldErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear general error when user makes changes
    if (error) {
      setError('');
    }
  };

  const getFieldClassName = (fieldName) => {
    const baseClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary";
    return fieldErrors[fieldName] 
      ? `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`
      : `${baseClass} border-gray-300 focus:border-primary`;
  };

  const renderFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {fieldErrors[fieldName]}
        </p>
      );
    }
    return null;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Password Reset Complete</h2>
            <p className="text-blue-100">Your password has been successfully reset</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              
              <Link
                to="/admin/login"
                className="block w-full text-center px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-blue-100">Enter your new password</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password *
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                value={formData.new_password}
                onChange={handleChange}
                className={getFieldClassName('new_password')}
                placeholder="Enter your new password"
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
              {renderFieldError('new_password')}
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm New Password *
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                className={getFieldClassName('confirm_password')}
                placeholder="Confirm your new password"
              />
              {renderFieldError('confirm_password')}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  At least 8 characters long
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Both passwords must match
                </li>
              </ul>
            </div>
            
            <button
              type="submit"
              disabled={loading || !uid || !token}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Reset Password
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/admin/login"
                className="text-sm text-primary hover:text-secondary transition-colors duration-200"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 