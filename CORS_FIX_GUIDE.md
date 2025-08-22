# CORS Fix Guide for QR Menu App

## 🚨 Issue Identified
Your frontend at [https://qwiks-frontend.onrender.com/](https://qwiks-frontend.onrender.com/) is showing a loading message because it cannot communicate with your backend at [https://qwiks-backend.onrender.com/](https://qwiks-backend.onrender.com/) due to CORS (Cross-Origin Resource Sharing) issues.

## ✅ CORS Issues Fixed

### 1. Backend CORS Configuration ✅
- **Added frontend domain** to `CORS_ALLOWED_ORIGINS`:
  - `https://qwiks-frontend.onrender.com`
- **Enhanced CORS settings**:
  - Allowed credentials and cookies
  - Added proper headers and methods
  - Configured preflight request handling

### 2. Frontend API Configuration ✅
- **Updated API base URL** to point to backend:
  - Production: `https://qwiks-backend.onrender.com/api`
  - Development: `/api` (localhost)
- **Added environment variables** for configuration
- **Enabled credentials** for CORS requests
- **Added debugging interceptors** for troubleshooting

### 3. Render Configuration ✅
- **Environment variables** set in render.yaml
- **Proper build configuration** for both frontend and backend

## 🔧 Files Modified

### Backend (`backend/qr_menu_app/settings.py`)
```python
# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qwiks-frontend.onrender.com",  # ✅ Added
    "https://qwiks-backend.onrender.com",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [...]
CORS_ALLOWED_METHODS = [...]
CORS_EXPOSE_HEADERS = [...]
CORS_PREFLIGHT_MAX_AGE = 86400
```

### Frontend (`frontend/src/utils/api.js`)
```javascript
// Use environment variables for API URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://qwiks-backend.onrender.com/api'
    : '/api');

// Create axios instance with credentials enabled
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ Enable credentials for CORS
});
```

### Render Configuration (`render.yaml`)
```yaml
envVars:
  - key: REACT_APP_API_URL
    value: https://qwiks-backend.onrender.com/api
  - key: REACT_APP_BACKEND_URL
    value: https://qwiks-backend.onrender.com
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend Changes
1. **Commit and push** your backend changes to GitHub
2. **Redeploy** your backend on Render
3. **Verify** the backend is accessible at [https://qwiks-backend.onrender.com/](https://qwiks-backend.onrender.com/)

### Step 2: Deploy Frontend Changes
1. **Commit and push** your frontend changes to GitHub
2. **Redeploy** your frontend on Render
3. **Verify** the frontend loads properly

### Step 3: Test CORS
1. **Open browser console** on your frontend
2. **Check for CORS errors** in the console
3. **Verify API requests** are reaching the backend

## 🔍 Troubleshooting

### If CORS Still Fails
1. **Check backend logs** for CORS errors
2. **Verify domain names** are exactly correct
3. **Check browser console** for specific error messages
4. **Ensure backend is accessible** from browser

### Common CORS Issues
- **Domain mismatch**: Ensure exact domain names (including https://)
- **Credentials**: Frontend must send `withCredentials: true`
- **Headers**: Backend must allow required headers
- **Methods**: Backend must allow required HTTP methods

### Testing CORS
```bash
# Test backend accessibility
curl -I https://qwiks-backend.onrender.com/api/

# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: https://qwiks-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  https://qwiks-backend.onrender.com/api/
```

## 📱 Expected Result
After deploying these changes:
1. ✅ Frontend loads without loading message
2. ✅ API calls reach backend successfully
3. ✅ No CORS errors in browser console
4. ✅ Full functionality restored

## 🔄 Next Steps
1. **Deploy backend changes** first
2. **Deploy frontend changes** second
3. **Test functionality** on both domains
4. **Monitor logs** for any remaining issues

## 📞 Support
If issues persist:
1. Check Render deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser network tab for failed requests
