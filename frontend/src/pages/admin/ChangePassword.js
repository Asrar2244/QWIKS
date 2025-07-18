import React, { useState } from 'react';
import { restaurantAPI, handleAPIError } from '../../utils/api';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
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

  const validateForm = () => {
    const errors = {};
    
    // Required field validation
    if (!formData.current_password) {
      errors.current_password = 'Current password is required';
    }

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

    // Check if new password is same as current password
    if (formData.current_password && formData.new_password && 
        formData.current_password === formData.new_password) {
      errors.new_password = 'New password must be different from current password';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the errors highlighted below');
      setLoading(false);
      return;
    }

    try {
      await restaurantAPI.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      setSuccess('Password changed successfully!');
      
      // Clear form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="text-gray-600">Update your account password</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
              Current Password *
            </label>
            <input
              type="password"
              name="current_password"
              id="current_password"
              required
              value={formData.current_password}
              onChange={handleInputChange}
              className={getFieldClassName('current_password')}
              placeholder="Enter your current password"
            />
            {renderFieldError('current_password')}
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
              New Password *
            </label>
            <input
              type="password"
              name="new_password"
              id="new_password"
              required
              value={formData.new_password}
              onChange={handleInputChange}
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
              type="password"
              name="confirm_password"
              id="confirm_password"
              required
              value={formData.confirm_password}
              onChange={handleInputChange}
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
                Different from your current password
              </li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  current_password: '',
                  new_password: '',
                  confirm_password: ''
                });
                setFieldErrors({});
                setError('');
                setSuccess('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Changing Password...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 