import React from 'react';
import { useParams } from 'react-router-dom';

const OrderConfirmation = () => {
  const { orderNumber } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Your order has been received and is being prepared.</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Number</h2>
          <p className="text-2xl font-bold text-primary">{orderNumber}</p>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-center">
            <span className="mr-2">⏱️</span>
            <span>Estimated preparation time: 15-25 minutes</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="mr-2">🔔</span>
            <span>We'll notify the restaurant staff</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="mr-2">📱</span>
            <span>Keep this number for order tracking</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Thank you for your order!</strong><br />
            Please show this order number to the restaurant staff if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 