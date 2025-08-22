import React, { useState, useEffect, useMemo } from 'react';
import { tablesAPI, restaurantAPI, handleAPIError } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const QRDesignModal = ({ isOpen, onClose, table, restaurant }) => {
  const [template, setTemplate] = useState('simple');
  const [title, setTitle] = useState('Scan to Order');
  const [subtitle, setSubtitle] = useState('Point your camera at the QR');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoShape, setLogoShape] = useState('rounded'); // rounded | circle | square
  const [showUrl, setShowUrl] = useState(false);
  const [qrSize, setQrSize] = useState(320);
  const [accentColor, setAccentColor] = useState(restaurant?.primary_color || '#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState(restaurant?.secondary_color || '#06B6D4');
  const [showFrame, setShowFrame] = useState(true);
  const [frameStyle, setFrameStyle] = useState('markers'); // markers | border | shadow
  const [ctaText, setCtaText] = useState('View Menu');
  const [showCTA, setShowCTA] = useState(true);

  // Template configurations
  const templateConfigs = {
    simple: {
      name: 'Simple',
      accentColor: '#4F46E5',
      secondaryColor: '#06B6D4',
      showFrame: true,
      frameStyle: 'markers',
      includeLogo: true,
      logoShape: 'rounded'
    },
    branded: {
      name: 'Branded Card',
      accentColor: '#DC2626',
      secondaryColor: '#F59E0B',
      showFrame: true,
      frameStyle: 'border',
      includeLogo: true,
      logoShape: 'circle'
    },
    poster: {
      name: 'Poster',
      accentColor: '#059669',
      secondaryColor: '#10B981',
      showFrame: false,
      frameStyle: 'shadow',
      includeLogo: true,
      logoShape: 'square'
    },
    tent: {
      name: 'Tent (2-up)',
      accentColor: '#7C3AED',
      secondaryColor: '#A855F7',
      showFrame: true,
      frameStyle: 'markers',
      includeLogo: true,
      logoShape: 'rounded'
    },
    minimal: {
      name: 'Minimal',
      accentColor: '#374151',
      secondaryColor: '#6B7280',
      showFrame: false,
      frameStyle: 'shadow',
      includeLogo: false,
      logoShape: 'rounded'
    },
    neon: {
      name: 'Neon',
      accentColor: '#00F5FF',
      secondaryColor: '#FF00FF',
      showFrame: true,
      frameStyle: 'markers',
      includeLogo: true,
      logoShape: 'circle'
    }
  };

  // Apply template when template changes
  useEffect(() => {
    const config = templateConfigs[template];
    if (config) {
      setAccentColor(config.accentColor);
      setSecondaryColor(config.secondaryColor);
      setShowFrame(config.showFrame);
      setFrameStyle(config.frameStyle);
      setIncludeLogo(config.includeLogo);
      setLogoShape(config.logoShape);
    }
  }, [template]);

  const menuUrl = useMemo(() => {
    if (!restaurant?.slug || !table?.id) return '';
    return `${window.location.origin}/menu/${restaurant.slug}/${table.id}`;
  }, [restaurant, table]);

  if (!isOpen || !table) return null;

  const printNow = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    
    const logoCss = logoShape === 'circle' ? 'border-radius:9999px;' : (logoShape === 'square' ? 'border-radius:6px;' : 'border-radius:12px;');
    const logoShadow = template === 'neon' ? `0 0 20px ${accentColor}` : 'none';
    const titleGradient = template === 'poster' ? `background: linear-gradient(135deg, ${accentColor}, ${secondaryColor}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;` : '';
    const titleShadow = template === 'neon' ? `text-shadow: 0 0 15px ${accentColor}` : '';
    
    const header = `
      <div class="header">
        ${includeLogo && restaurant?.logo_url ? `<img class="logo" src='${restaurant.logo_url}' style="${logoCss} border-color: ${accentColor}; box-shadow: ${logoShadow};"/>` : ''}
        <div class="brand" style="color: ${accentColor}; ${template === 'neon' ? `text-shadow: 0 0 10px ${accentColor}` : ''}">${restaurant?.name || ''}</div>
        <div class="title" style="${titleGradient} ${titleShadow}">${title}</div>
        <div class="sub">Table ${table.number}${table.name ? ` • ${table.name}` : ''}${subtitle ? ` • ${subtitle}` : ''}</div>
      </div>
    `;

    const cardStyle = template === 'minimal' ? 'background: #f8fafc; border: none;' :
                     template === 'poster' ? 'box-shadow: 0 20px 40px rgba(0,0,0,0.1);' :
                     template === 'neon' ? `border-color: ${accentColor};` : '';
    
    const qrWrapStyle = template === 'minimal' ? 'border-radius: 8px;' :
                        template === 'poster' ? 'border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);' :
                        template === 'neon' ? `box-shadow: 0 0 30px ${accentColor};` : '';
    
    const frameClass = showFrame ? 
      (frameStyle === 'markers' ? 'markers' : 
       frameStyle === 'border' ? 'border' : 'shadow') : '';

    const html = `<!doctype html><html><head><meta charset='utf-8' />
      <style>
        @page { size: A4 portrait; margin: 14mm; }
        :root { --accent: ${accentColor}; --accent2: ${secondaryColor}; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial; background: #f8fafc; }
        .card { border-radius: 16px; padding: 24px; max-width: 820px; margin: 0 auto; background: #fff; box-shadow: 0 20px 50px rgba(2,6,23,0.08); border: 1px solid #e5e7eb; ${cardStyle} }
        .header { text-align:center; display:block; margin-bottom: 16px; }
        .logo { width: 56px; height: 56px; object-fit: contain; border: 1px solid #e5e7eb; background:#fff; display:block; margin: 0 auto 8px; }
        .brand { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .title { font-size: 28px; font-weight: 900; line-height: 1.1; }
        .sub { color:#6b7280; font-size: 12px; margin-top: 2px; }
        .qr-wrap { position: relative; display: inline-block; background: #fff; padding: 12px; border-radius: 16px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); border: 1px solid #e5e7eb; ${qrWrapStyle} }
        .qr { width: ${qrSize}px; height: ${qrSize}px; object-fit: contain; display:block; }
        .markers div { position:absolute; width:18px; height:18px; border:3px solid var(--accent); ${template === 'neon' ? `box-shadow: 0 0 10px var(--accent);` : ''} }
        .tl { top:6px; left:6px; border-right:none; border-bottom:none; border-radius:6px 0 0 0; }
        .tr { top:6px; right:6px; border-left:none; border-bottom:none; border-radius:0 6px 0 0; }
        .bl { bottom:6px; left:6px; border-right:none; border-top:none; border-radius:0 0 0 6px; }
        .br { bottom:6px; right:6px; border-left:none; border-top:none; border-radius:0 0 6px 0; }
        .url { margin-top: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; background:#f8fafc; padding:10px 12px; border-radius:10px; border:1px dashed #e5e7eb; word-break: break-all; ${template === 'neon' ? `box-shadow: 0 0 10px var(--accent);` : ''} }
        .cta { margin-top: 16px; display:inline-block; background: linear-gradient(135deg, var(--accent), var(--accent2)); color:#fff; padding:10px 16px; border-radius:9999px; font-weight:700; font-size:13px; text-decoration:none; box-shadow: 0 6px 16px rgba(2,6,23,0.15); ${template === 'neon' ? `box-shadow: 0 0 20px var(--accent);` : ''} }
        .divider { height:2px; background: linear-gradient(90deg, var(--accent), var(--accent2)); opacity: .25; border-radius:2px; margin:16px 0; }
      </style>
    </head><body onload="window.print(); setTimeout(()=>window.close(), 250);">
      <div class='card'>
        ${header}
        <div class='divider'></div>
        <div style='display:flex; align-items:center; gap:20px; justify-content:center; flex-direction:column;'>
          <div class='qr-wrap ${frameClass}'>
            ${showFrame && frameStyle === 'markers' ? "<div class='tl'></div><div class='tr'></div><div class='bl'></div><div class='br'></div>" : ''}
            <img class='qr' src='${table.qr_code_url}' />
          </div>
          ${showUrl ? `<div class='url'>${menuUrl}</div>` : ''}
          ${showCTA ? `<div style="text-align:center"><a class='cta' href='${menuUrl}' target='_blank' rel='noreferrer'>${ctaText}</a></div>` : ''}
        </div>
      </div>
    </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Design & Print QR</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div className="md:col-span-2">
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">Preview</div>
              <div className="bg-white rounded-lg border p-4" style={{ 
                borderColor: template === 'neon' ? accentColor : '#e5e7eb',
                boxShadow: template === 'poster' ? `0 20px 40px rgba(0,0,0,0.1)` : 'none',
                background: template === 'minimal' ? '#f8fafc' : 'white'
              }}>
                <div className="mb-3 flex flex-col items-center gap-2 text-center">
                  {includeLogo && restaurant?.logo_url && (
                    <img
                      src={restaurant.logo_url}
                      alt="logo"
                      className={`w-12 h-12 object-contain border ${logoShape === 'circle' ? 'rounded-full' : (logoShape === 'square' ? 'rounded-md' : 'rounded-xl')}`}
                      style={{ 
                        borderColor: accentColor,
                        boxShadow: template === 'neon' ? `0 0 20px ${accentColor}` : 'none'
                      }}
                    />
                  )}
                  <div className="text-xs font-extrabold" style={{ 
                    color: accentColor,
                    textShadow: template === 'neon' ? `0 0 10px ${accentColor}` : 'none'
                  }}>{restaurant?.name}</div>
                  <div className="text-xl font-extrabold" style={{
                    background: template === 'poster' ? `linear-gradient(135deg, ${accentColor}, ${secondaryColor})` : 'none',
                    WebkitBackgroundClip: template === 'poster' ? 'text' : 'none',
                    WebkitTextFillColor: template === 'poster' ? 'transparent' : 'inherit',
                    textShadow: template === 'neon' ? `0 0 15px ${accentColor}` : 'none'
                  }}>{title}</div>
                  <div className="text-xs text-gray-500">Table {table.number}{table.name ? ` • ${table.name}` : ''}{subtitle ? ` • ${subtitle}` : ''}</div>
                </div>
                <div className="flex items-center flex-col gap-3">
                  <div className={`relative inline-block p-2 bg-white ${
                    template === 'minimal' ? 'rounded-lg' : 
                    template === 'poster' ? 'rounded-2xl' : 
                    template === 'neon' ? 'rounded-xl' : 'rounded-xl'
                  }`} style={{ 
                    borderColor: showFrame ? accentColor : 'transparent',
                    borderWidth: showFrame && frameStyle === 'border' ? '2px' : '1px',
                    borderStyle: showFrame ? 'solid' : 'none',
                    boxShadow: template === 'poster' ? `0 10px 30px rgba(0,0,0,0.15)` :
                               template === 'neon' ? `0 0 30px ${accentColor}` :
                               showFrame && frameStyle === 'shadow' ? `0 10px 25px rgba(0,0,0,0.1)` : 'none'
                  }}>
                    <img src={table.qr_code_url} alt="qr" style={{ width: qrSize, height: qrSize }} className="rounded-lg" />
                    {showFrame && frameStyle === 'markers' && (
                      <>
                        <div className="absolute top-2 left-2 w-5 h-5 border-2 rounded-tl" style={{ 
                          borderColor: accentColor, 
                          borderBottom: 'none', 
                          borderRight: 'none',
                          boxShadow: template === 'neon' ? `0 0 10px ${accentColor}` : 'none'
                        }} />
                        <div className="absolute top-2 right-2 w-5 h-5 border-2 rounded-tr" style={{ 
                          borderColor: accentColor, 
                          borderBottom: 'none', 
                          borderLeft: 'none',
                          boxShadow: template === 'neon' ? `0 0 10px ${accentColor}` : 'none'
                        }} />
                        <div className="absolute bottom-2 left-2 w-5 h-5 border-2 rounded-bl" style={{ 
                          borderColor: accentColor, 
                          borderBottom: 'none', 
                          borderRight: 'none',
                          boxShadow: template === 'neon' ? `0 0 10px ${accentColor}` : 'none'
                        }} />
                        <div className="absolute bottom-2 right-2 w-5 h-5 border-2 rounded-br" style={{ 
                          borderColor: accentColor, 
                          borderTop: 'none', 
                          borderLeft: 'none',
                          boxShadow: template === 'neon' ? `0 0 10px ${accentColor}` : 'none'
                        }} />
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 min-w-[220px] space-y-2 text-center">
                    {showUrl && (
                      <div className="bg-gray-100 rounded p-2 break-all border" style={{ 
                        borderColor: accentColor,
                        boxShadow: template === 'neon' ? `0 0 10px ${accentColor}` : 'none'
                      }}>{menuUrl}</div>
                    )}
                    {showCTA && (
                      <a href={menuUrl} target="_blank" rel="noreferrer" className="inline-block text-white px-3 py-1.5 rounded-full shadow" style={{ 
                        background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                        boxShadow: template === 'neon' ? `0 0 20px ${accentColor}` : '0 4px 12px rgba(0,0,0,0.15)'
                      }}>{ctaText}</a>
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
                {Object.entries(templateConfigs).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {templateConfigs[template]?.name === 'Simple' && 'Clean, professional design with corner markers'}
                {templateConfigs[template]?.name === 'Branded Card' && 'Elegant card with border frame and circular logo'}
                {templateConfigs[template]?.name === 'Poster' && 'Bold poster style with gradient text and shadows'}
                {templateConfigs[template]?.name === 'Tent (2-up)' && 'Tent card format for table display'}
                {templateConfigs[template]?.name === 'Minimal' && 'Minimalist design with subtle styling'}
                {templateConfigs[template]?.name === 'Neon' && 'High-contrast neon style with glowing effects'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeLogo} onChange={(e) => setIncludeLogo(e.target.checked)} /> Include logo</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showUrl} onChange={(e) => setShowUrl(e.target.checked)} /> Show URL</label>
            </div>
            {includeLogo && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Logo Shape</label>
                <select value={logoShape} onChange={(e) => setLogoShape(e.target.value)} className="w-full px-2 py-1 text-sm border rounded">
                  <option value="rounded">Rounded</option>
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">QR Size (px)</label>
              <input type="number" min={160} max={640} value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} className="w-full px-2 py-1 text-sm border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Accent</label>
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-8 p-0 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Accent 2</label>
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-8 p-0 border rounded" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Frame</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showFrame} onChange={(e) => setShowFrame(e.target.checked)} /> Show Frame</label>
                <select value={frameStyle} onChange={(e) => setFrameStyle(e.target.value)} className="px-2 py-1 text-sm border rounded">
                  <option value="markers">Corner markers</option>
                  <option value="border">Border only</option>
                  <option value="shadow">Shadow only</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Call to Action</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showCTA} onChange={(e) => setShowCTA(e.target.checked)} /> Show CTA</label>
                <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="px-2 py-1 text-sm border rounded" placeholder="e.g., View Menu" />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Close</button>
              <button onClick={printNow} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary">Print</button>
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
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">No QR Code</span>
                          <button
                            onClick={() => openQRDesigner(table)}
                            className="text-xs text-purple-600 hover:text-purple-800 underline disabled:text-gray-400"
                            disabled={!table.qr_code_url}
                            title={!table.qr_code_url ? 'QR is generating, try in a moment' : 'Design & Print'}
                          >
                            Design & Print
                          </button>
                        </div>
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
                          onClick={() => openQRDesigner(table)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Design & Print"
                        >
                          🖨️
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