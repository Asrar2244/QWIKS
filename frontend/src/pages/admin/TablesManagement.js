import React, { useState, useEffect, useMemo, useRef } from 'react';
import { tablesAPI, restaurantAPI, handleAPIError } from '../../utils/api';

const QRDesignModal = ({ isOpen, onClose, table, restaurant, defaultTemplate = 'branded' }) => {
  const [template, setTemplate] = useState(defaultTemplate);
  const [title, setTitle] = useState('Scan to Order');
  const [instructions, setInstructions] = useState('Open your camera and scan the QR code');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeRestaurantName, setIncludeRestaurantName] = useState(true);
  const [includeTableName, setIncludeTableName] = useState(true);
  const [showUrl, setShowUrl] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [paper, setPaper] = useState('A4');
  const [qrSize, setQrSize] = useState(320);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#111827');
  const [accentColor, setAccentColor] = useState(restaurant?.primary_color || '#3B82F6');

  const containerRef = useRef(null);

  const menuUrl = useMemo(() => {
    if (!restaurant?.slug || !table?.id) return '';
    return `${window.location.origin}/menu/${restaurant.slug}/${table.id}`;
  }, [restaurant, table]);

  if (!isOpen || !table) return null;

  const openPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @page { size: ${paper} ${orientation}; margin: 14mm; }
        html, body { padding: 0; margin: 0; }
        body { background: #fff; color: ${textColor}; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji'; }
        .sheet { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        .card { width: 100%; max-width: 800px; border: 2px solid ${accentColor}; border-radius: 16px; padding: 24px; box-sizing: border-box; background: ${bgColor}; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; }
        .title { font-size: 28px; font-weight: 800; margin: 0; color: ${textColor}; }
        .subtitle { margin: 4px 0 0 0; color: #6b7280; }
        .qr-wrap { display: flex; align-items: center; justify-content: center; padding: 16px; background: #fff; border-radius: 12px; border: 1px dashed ${accentColor}; }
        .qr { width: ${qrSize}px; height: ${qrSize}px; object-fit: contain; }
        .meta { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 8px; }
        .badge { display: inline-block; background: ${accentColor}20; color: ${accentColor}; padding: 4px 10px; border-radius: 999px; font-weight: 600; }
        .url { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; background: #f3f4f6; padding: 8px 10px; border-radius: 8px; word-break: break-all; }
        .divider { height: 2px; background: ${accentColor}; opacity: 0.25; margin: 16px 0; border-radius: 2px; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; }
        .tent { display: grid; grid-template-rows: 1fr 1fr; gap: 16px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; }
      </style>
    `;

    const brandedHeader = `
      <div class="header">
        ${includeLogo && restaurant?.logo_url ? `<img class="logo" src="${restaurant.logo_url}" />` : ''}
        <div>
          ${includeRestaurantName ? `<div class="badge">${restaurant?.name || ''}</div>` : ''}
          <h1 class="title">${title}</h1>
          ${includeTableName ? `<p class="subtitle">Table ${table.number}${table.name ? ` • ${table.name}` : ''}</p>` : ''}
        </div>
      </div>
    `;

    const simpleHeader = `
      <div>
        <h1 class="title" style="text-align:center">${title}</h1>
        ${includeTableName ? `<p class="subtitle" style="text-align:center">Table ${table.number}${table.name ? ` • ${table.name}` : ''}</p>` : ''}
      </div>
    `;

    const qrBlock = `
      <div class="qr-wrap">
        <img class="qr" src="${table.qr_code_url}" />
      </div>
    `;

    const metaBlock = `
      <div class="meta">
        ${showUrl ? `<div class="url">${menuUrl}</div>` : ''}
        ${instructions ? `<div class="footer">${instructions}</div>` : ''}
      </div>
    `;

    const contentByTemplate = {
      simple: `
        <div class="card">
          ${simpleHeader}
          ${qrBlock}
          <div class="divider"></div>
          ${metaBlock}
        </div>
      `,
      branded: `
        <div class="card">
          ${brandedHeader}
          <div class="row">
            ${qrBlock}
            <div>
              ${metaBlock}
            </div>
          </div>
        </div>
      `,
      tent: `
        <div class="card tent">
          <div>
            ${brandedHeader}
            ${qrBlock}
          </div>
          <div>
            ${simpleHeader}
            ${qrBlock}
          </div>
        </div>
      `,
    };

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          ${styles}
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 250);">
          <div class="sheet">
            ${contentByTemplate[template]}
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold">Design & Print QR</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div className="md:col-span-2">
            <div ref={containerRef} className="border rounded-lg p-4 bg-gray-50">
              <div className="mb-2 text-sm text-gray-600">Preview</div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-4">
                  {includeLogo && restaurant?.logo_url && (
                    <img src={restaurant.logo_url} alt="logo" className="w-10 h-10 rounded object-contain border" />
                  )}
                  <div>
                    <div className="text-xs text-primary font-semibold" style={{ color: accentColor }}>
                      {includeRestaurantName ? restaurant?.name : ''}
                    </div>
                    <div className="text-xl font-extrabold" style={{ color: textColor }}>{title}</div>
                    {includeTableName && (
                      <div className="text-xs text-gray-500">Table {table.number}{table.name ? ` • ${table.name}` : ''}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded border" style={{ borderColor: accentColor }}>
                    <img src={table.qr_code_url} alt="qr" style={{ width: qrSize, height: qrSize }} />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    {showUrl && (
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                        {menuUrl}
                      </div>
                    )}
                    {instructions && (
                      <div className="text-sm text-gray-600">{instructions}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Template</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full px-2 py-1 text-sm border rounded">
                <option value="simple">Simple</option>
                <option value="branded">Branded</option>
                <option value="tent">Tent Card (2-up)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
              <input value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeLogo} onChange={(e) => setIncludeLogo(e.target.checked)} /> Include logo</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeRestaurantName} onChange={(e) => setIncludeRestaurantName(e.target.checked)} /> Restaurant name</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeTableName} onChange={(e) => setIncludeTableName(e.target.checked)} /> Table name</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showUrl} onChange={(e) => setShowUrl(e.target.checked)} /> Show URL</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">QR Size (px)</label>
              <input type="number" min={160} max={640} value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} className="w-full px-2 py-1 text-sm border rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-8 p-0 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 p-0 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Accent</label>
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-8 p-0 border rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Paper</label>
                <select value={paper} onChange={(e) => setPaper(e.target.value)} className="w-full px-2 py-1 text-sm border rounded">
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Orientation</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="w-full px-2 py-1 text-sm border rounded">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Close</button>
              <button onClick={openPrint} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary">Print</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTable, setQrTable] = useState(null);
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

  const openQRDesigner = (table) => {
    setQrTable(table);
    setShowQRModal(true);
  };

  const closeQRDesigner = () => {
    setShowQRModal(false);
    setQrTable(null);
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

      <QRDesignModal
        isOpen={showQRModal}
        onClose={closeQRDesigner}
        table={qrTable}
        restaurant={restaurant}
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
                          <div className="flex items-center gap-3">
                            <a
                              href={table.qr_code_url}
                              download={`table-${table.number}-qr.png`}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Download PNG
                            </a>
                            <button
                              onClick={() => openQRDesigner(table)}
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              Design & Print
                            </button>
                          </div>
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