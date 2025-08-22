import React, { useState, useEffect, useRef } from 'react';
import { restaurantAPI, handleAPIError } from '../../utils/api';

const RestaurantSettings = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [newLogoFile, setNewLogoFile] = useState(null); // Track new logo file
  const formRef = useRef(null);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  // Update document title with restaurant name
  useEffect(() => {
    if (restaurant?.name) {
      document.title = `${restaurant.name} - Restaurant Settings`;
    } else {
      document.title = 'Restaurant Settings';
    }
    
    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'QR Menu Admin';
    };
  }, [restaurant?.name]);

  const fetchRestaurant = async () => {
    try {
      const response = await restaurantAPI.getDetails();
      setRestaurant(response.data);
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required field validation
    if (!restaurant?.name?.trim()) {
      errors.name = 'Restaurant name is required';
    }

    // Email validation
    if (restaurant?.email && !/\S+@\S+\.\S+/.test(restaurant.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (restaurant?.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(restaurant.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // GSTIN validation (15 characters alphanumeric)
    if (restaurant?.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(restaurant.gstin)) {
      errors.gstin = 'GSTIN must be 15 characters (format: 22AAAAA0000A1Z5)';
    }

    // FSSAI validation (14 digits)
    if (restaurant?.fssai && !/^\d{14}$/.test(restaurant.fssai)) {
      errors.fssai = 'FSSAI license must be exactly 14 digits';
    }

    // Pincode validation (6 digits)
    if (restaurant?.pincode && !/^\d{6}$/.test(restaurant.pincode)) {
      errors.pincode = 'Pin code must be exactly 6 digits';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the errors highlighted in red below');
      setSaving(false);
      scrollToTop();
      return;
    }

    try {
      const formData = new FormData();
      
      // Add all restaurant fields except logo-related fields
      Object.keys(restaurant).forEach(key => {
        if (key !== 'logo' && key !== 'logo_url' && key !== 'created_at' && key !== 'slug') {
          formData.append(key, restaurant[key] || '');
        }
      });

      // Only include logo if a new file was selected
      if (newLogoFile) {
        formData.append('logo', newLogoFile);
      }

      const response = await restaurantAPI.updateDetails(formData);
      setRestaurant(response.data);
      setNewLogoFile(null); // Clear the new logo file state
      setSuccess('Restaurant settings updated successfully!');
      scrollToTop();
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
      scrollToTop();
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRestaurant(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, logo: 'File size must be less than 10MB' }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFieldErrors(prev => ({ ...prev, logo: 'Please select a valid image file' }));
        return;
      }
      
      // Store the new file separately, don't modify restaurant.logo
      setNewLogoFile(file);
      
      // Clear logo error if file is valid
      if (fieldErrors.logo) {
        setFieldErrors(prev => ({ ...prev, logo: '' }));
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={formRef}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {restaurant?.name ? `${restaurant.name} - Settings` : 'Restaurant Settings'}
        </h1>
        <p className="text-gray-600">Manage your restaurant information and branding</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Restaurant Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={restaurant?.name || ''}
                onChange={handleInputChange}
                className={getFieldClassName('name')}
              />
              {renderFieldError('name')}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={restaurant?.phone || ''}
                onChange={handleInputChange}
                className={getFieldClassName('phone')}
                placeholder="+91-9876543210"
              />
              {renderFieldError('phone')}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <div className="flex space-x-4 mt-1">
                {[
                  { value: 'light', label: 'Light', desc: 'Bright, clean, white backgrounds' },
                  { value: 'dark', label: 'Dark', desc: 'Dark backgrounds, light text' },
                  { value: 'modern', label: 'Modern', desc: 'Bold accent colors, card layouts' },
                ].map(themeOption => (
                  <label
                    key={themeOption.value}
                    className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition-all duration-150
                      ${restaurant?.theme === themeOption.value ? 'border-primary ring-2 ring-primary' : 'border-gray-300 hover:border-primary'}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={themeOption.value}
                      checked={restaurant?.theme === themeOption.value}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className="font-semibold mb-1">{themeOption.label}</div>
                    <div className="text-xs text-gray-500">{themeOption.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={restaurant?.email || ''}
                onChange={handleInputChange}
                className={getFieldClassName('email')}
                placeholder="restaurant@example.com"
              />
              {renderFieldError('email')}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={restaurant?.city || ''}
                onChange={handleInputChange}
                className={getFieldClassName('city')}
              />
              {renderFieldError('city')}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                name="state"
                id="state"
                value={restaurant?.state || ''}
                onChange={handleInputChange}
                className={getFieldClassName('state')}
              />
              {renderFieldError('state')}
            </div>

            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                Pin Code
              </label>
              <input
                type="text"
                name="pincode"
                id="pincode"
                value={restaurant?.pincode || ''}
                onChange={handleInputChange}
                className={getFieldClassName('pincode')}
                placeholder="560001"
                maxLength="6"
              />
              {renderFieldError('pincode')}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={restaurant?.description || ''}
              onChange={handleInputChange}
              className={getFieldClassName('description')}
              placeholder="Describe your restaurant..."
            />
            {renderFieldError('description')}
          </div>

          <div className="mt-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              id="address"
              rows={2}
              value={restaurant?.address || ''}
              onChange={handleInputChange}
              className={getFieldClassName('address')}
              placeholder="Restaurant address..."
            />
            {renderFieldError('address')}
          </div>
        </div>

        {/* Legal Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Legal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gstin" className="block text-sm font-medium text-gray-700">
                GSTIN Number
              </label>
              <input
                type="text"
                name="gstin"
                id="gstin"
                value={restaurant?.gstin || ''}
                onChange={handleInputChange}
                placeholder="22AAAAA0000A1Z5"
                className={getFieldClassName('gstin')}
                maxLength="15"
              />
              <p className="mt-1 text-xs text-gray-500">GST Identification Number (15 characters)</p>
              {renderFieldError('gstin')}
            </div>

            <div>
              <label htmlFor="fssai" className="block text-sm font-medium text-gray-700">
                FSSAI License Number
              </label>
              <input
                type="text"
                name="fssai"
                id="fssai"
                value={restaurant?.fssai || ''}
                onChange={handleInputChange}
                placeholder="12345678901234"
                className={getFieldClassName('fssai')}
                maxLength="14"
              />
              <p className="mt-1 text-xs text-gray-500">FSSAI License Number (14 digits)</p>
              {renderFieldError('fssai')}
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These details will appear on customer bills and invoices for legal compliance.
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Logo</h2>
          <div className="flex items-center space-x-6">
            {restaurant?.logo_url && (
              <div className="flex-shrink-0">
                <img 
                  src={restaurant.logo_url} 
                  alt="Restaurant logo"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            <div className="flex-1">
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                {restaurant?.logo_url ? 'Update Logo' : 'Upload Logo'}
              </label>
              <input
                type="file"
                name="logo"
                id="logo"
                accept="image/*"
                onChange={handleFileChange}
                className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-secondary ${fieldErrors.logo ? 'border-red-500' : ''}`}
              />
              
              {/* Show new file selection */}
              {newLogoFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-800">
                      New logo selected: <strong>{newLogoFile.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLogoFile(null);
                      document.getElementById('logo').value = '';
                    }}
                    className="text-green-600 hover:text-green-800 text-sm underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
                {restaurant?.logo_url && !newLogoFile && (
                  <span className="text-green-600 ml-2">• Current logo will be preserved if no new file is selected</span>
                )}
              </p>
              {renderFieldError('logo')}
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="color"
                  name="primary_color"
                  id="primary_color"
                  value={restaurant?.primary_color || '#3B82F6'}
                  onChange={handleInputChange}
                  className="h-10 w-20 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={restaurant?.primary_color || '#3B82F6'}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700">
                Secondary Color
              </label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="color"
                  name="secondary_color"
                  id="secondary_color"
                  value={restaurant?.secondary_color || '#1E40AF'}
                  onChange={handleInputChange}
                  className="h-10 w-20 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={restaurant?.secondary_color || '#1E40AF'}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accent_color" className="block text-sm font-medium text-gray-700">
                Accent Color
              </label>
              <div className="mt-1 flex items-center space-x-3">
                <input
                  type="color"
                  name="accent_color"
                  id="accent_color"
                  value={restaurant?.accent_color || '#EF4444'}
                  onChange={handleInputChange}
                  className="h-10 w-20 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={restaurant?.accent_color || '#EF4444'}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Preview:</strong> These colors will be applied to your customer-facing menu.
            </p>
            <div className="mt-2 flex space-x-2">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: restaurant?.primary_color }}
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: restaurant?.secondary_color }}
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: restaurant?.accent_color }}
              ></div>
            </div>
          </div>
        </div>

        {/* Restaurant URL */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Restaurant URL</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Your restaurant menu URL:</p>
            <p className="text-lg font-mono bg-white p-2 rounded border">
              {typeof window !== 'undefined' ? window.location.origin : 'https://qwiks-frontend.onrender.com'}/menu/{restaurant?.slug}/[table-id]
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This URL will be encoded in QR codes for each table
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center"
          >
            {saving ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantSettings; 