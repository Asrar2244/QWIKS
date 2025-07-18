import React, { useState, useEffect } from 'react';
import { tablesAPI, restaurantAPI, handleAPIError } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TableModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3">
            {isEditing ? 'Edit Table' : 'Add New Table'}
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                Table Number *
              </label>
              <input
                type="text"
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Table Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Window Seat, VIP Table"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const TablesManagement = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    name: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tablesResponse, restaurantResponse] = await Promise.all([
        tablesAPI.getAll(),
        restaurantAPI.getDetails()
      ]);
      setTables(tablesResponse.data.results || tablesResponse.data);
      setRestaurant(restaurantResponse.data);
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tablesAPI.update(editingTable.id, formData);
      } else {
        await tablesAPI.create(formData);
      }
      setShowAddModal(false);
      setEditingTable(null);
      setFormData({ number: '', name: '' });
      fetchData();
    } catch (error) {
      setError(handleAPIError(error));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        await tablesAPI.delete(id);
        fetchData();
      } catch (error) {
        setError(handleAPIError(error));
      }
    }
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      name: table.name || ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTable(null);
    setFormData({ number: '', name: '' });
  };

  const copyToClipboard = (text, successMessage) => {
    navigator.clipboard.writeText(text);
    alert(successMessage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tables Management</h1>
          <p className="text-sm text-gray-600">Manage restaurant tables and QR codes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary"
        >
          Add Table
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <TableModal
        isOpen={showAddModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        isEditing={!!editingTable}
      />

      {tables.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-2">🪑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tables yet</h3>
          <p className="text-sm text-gray-600 mb-4">Get started by adding your first table</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary"
          >
            Add First Table
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">Tables ({tables.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu URL</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Table {table.number}</div>
                        {table.name && (
                          <div className="text-xs text-gray-500">{table.name}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          Created {new Date(table.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {table.qr_code_url ? (
                        <div className="flex items-center space-x-2">
                          <img 
                            src={table.qr_code_url} 
                            alt={`QR Code for Table ${table.number}`}
                            className="w-12 h-12 border border-gray-300 rounded"
                          />
                          <a
                            href={table.qr_code_url}
                            download={`table-${table.number}-qr.png`}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No QR Code</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        table.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {table.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {restaurant?.slug ? (
                        <div className="text-xs">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 break-all">
                            {`${window.location.origin}/menu/${restaurant.slug}/${table.id}`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(
                              `${window.location.origin}/menu/${restaurant.slug}/${table.id}`,
                              'Menu URL copied to clipboard!'
                            )}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="Copy URL"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">URL not available</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(table)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit table"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(table.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete table"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesManagement; 