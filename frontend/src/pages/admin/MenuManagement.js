import React, { useState, useEffect, useCallback } from 'react';
import { categoriesAPI, menuItemsAPI, handleAPIError } from '../../utils/api';

const CategoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  isEditing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
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

// Move ItemModal outside the main component
const ItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  categories,
  isEditing,
  imageError,
  setImageError,
  imagePreview,
  setImagePreview,
  error,
  setError,
  menuItems,
  editingItem,
}) => {
  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImageError(''); // Clear error on new file selection
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setImageError('');
    setError('');
    
    // Validate image only on create, not on edit
    if (!isEditing && !formData.image) {
      setImageError('An image is required for new menu items.');
      return;
    }
    
    // Validate image file type if image is selected
    if (formData.image && formData.image.type && !formData.image.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPEG, PNG, GIF, etc.).');
      return;
    }
    
    // Validate image size (max 5MB)
    if (formData.image && formData.image.size && formData.image.size > 5 * 1024 * 1024) {
      setImageError('Image file size must be less than 5MB.');
      return;
    }
    
    // Check for duplicate names in the same category
    const existingItem = menuItems.find(item => 
      item.name.toLowerCase() === formData.name.toLowerCase() && 
      item.category === formData.category &&
      (!isEditing || item.id !== editingItem?.id)
    );
    
    if (existingItem) {
      setError(`A menu item with the name "${formData.name}" already exists in this category. Please choose a different name.`);
      return;
    }
    
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3">
            {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          
          {categories.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
              <p className="text-sm text-amber-800">
                ⚠️ Create at least one category first before adding an item.
              </p>
            </div>
          )}
          
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {/* Display general errors */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  ❌ {error}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={categories.length === 0}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-secondary"
              />
              {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
              
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                <input
                  type="number"
                  name="preparation_time"
                  value={formData.preparation_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Available
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="is_vegetarian"
                    checked={formData.is_vegetarian}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="is_vegan"
                    checked={formData.is_vegan}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Vegan
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    name="is_spicy"
                    checked={formData.is_spicy}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Spicy
                </label>
              </div>
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

const MenuManagement = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    order: 0
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    preparation_time: 15,
    order: 0
  });

  // Wrap functions in useCallback to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      const [categoriesResponse, itemsResponse] = await Promise.all([
        categoriesAPI.getAll(),
        menuItemsAPI.getAll()
      ]);
      setCategories(categoriesResponse.data.results || categoriesResponse.data);
      setMenuItems(itemsResponse.data.results || itemsResponse.data);
    } catch (error) {
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategorySubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, categoryForm);
      } else {
        await categoriesAPI.create(categoryForm);
      }
      closeCategoryModal();
      fetchData();
    } catch (error) {
      setError(handleAPIError(error));
    }
  }, [editingCategory, categoryForm, fetchData]);

  const handleItemSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(itemForm).forEach(key => {
        if (key === 'image' && itemForm[key] && typeof itemForm[key] === 'object') {
          // Handle image field properly - ensure it's not an array
          const imageValue = itemForm[key];
          if (Array.isArray(imageValue)) {
            // If it's an array, take the first item or null
            if (imageValue.length > 0) {
              formData.append(key, imageValue[0]);
            }
            // If array is empty, don't append anything (null)
          } else {
            // Single file object
            formData.append(key, imageValue);
          }
        } else if (key !== 'image_url') {
          formData.append(key, itemForm[key]);
        }
      });

      if (editingItem) {
        await menuItemsAPI.update(editingItem.id, formData);
      } else {
        await menuItemsAPI.create(formData);
      }
      closeItemModal();
      fetchData();
    } catch (error) {
      setError(handleAPIError(error));
    }
  }, [editingItem, itemForm, fetchData, closeItemModal]);

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', order: 0 });
  }

  function closeItemModal() {
    setShowItemModal(false);
    setEditingItem(null);
    resetItemForm();
  }

  function resetItemForm() {
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null,
      is_available: true,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      preparation_time: 15,
      order: 0
    });
    setImageError('');
    setImagePreview(null);
  }

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      order: category.order
    });
    setShowCategoryModal(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image: null,
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_spicy: item.is_spicy,
      preparation_time: item.preparation_time,
      order: item.order
    });
    // If the item has an existing image, show it as the preview
    if (item.image_url) {
      setImagePreview(item.image_url);
    }
    setShowItemModal(true);
  };

  const deleteCategory = async (id) => {
    if (window.confirm('Are you sure? This will also delete all items in this category.')) {
      try {
        await categoriesAPI.delete(id);
        fetchData();
      } catch (error) {
        setError(handleAPIError(error));
      }
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await menuItemsAPI.delete(id);
        fetchData();
      } catch (error) {
        setError(handleAPIError(error));
      }
    }
  };

  const toggleItemAvailability = async (itemId, currentStatus) => {
    try {
      await menuItemsAPI.update(itemId, { is_available: !currentStatus });
      fetchData(); // Refresh the data to show updated status
    } catch (error) {
      setError(handleAPIError(error));
    }
  };

  const filteredItems = menuItems.filter(item => {
    // Filter by category
    const categoryMatch = selectedCategory === 'all' || item.category.toString() === selectedCategory;
    
    // Filter by search query
    const searchMatch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category_name && item.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by vegetarian status
    const vegMatch = vegFilter === 'all' || 
      (vegFilter === 'veg' && item.is_vegetarian) ||
      (vegFilter === 'non-veg' && !item.is_vegetarian);
    
    return categoryMatch && searchMatch && vegMatch;
  });

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
          <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-sm text-gray-600">Manage categories and menu items</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('items')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menu Items ({menuItems.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories ({categories.length})
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'items' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-1">
                  {/* Search Box */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>

                  {/* Veg/Non-Veg Filter */}
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => setVegFilter('all')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                        vegFilter === 'all' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setVegFilter('veg')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 flex items-center space-x-1 ${
                        vegFilter === 'veg' 
                          ? 'bg-green-100 text-green-800 shadow-sm' 
                          : 'text-gray-600 hover:text-green-700'
                      }`}
                    >
                      <span className="text-green-600">🌱</span>
                      <span>Veg</span>
                    </button>
                    <button
                      onClick={() => setVegFilter('non-veg')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 flex items-center space-x-1 ${
                        vegFilter === 'non-veg' 
                          ? 'bg-red-100 text-red-800 shadow-sm' 
                          : 'text-gray-600 hover:text-red-700'
                      }`}
                    >
                      <span className="text-red-600">🍖</span>
                      <span>Non-Veg</span>
                    </button>
                  </div>
                  
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {filteredItems.length} of {menuItems.length} items
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    if (categories.length === 0) {
                      alert('Please create at least one category first.');
                      setActiveTab('categories');
                      return;
                    }
                    setShowItemModal(true);
                  }}
                  className={`px-3 py-1.5 text-sm rounded whitespace-nowrap ${categories.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-secondary'}`}
                  disabled={categories.length === 0}
                >
                  Add Item
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🍽️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {searchQuery ? 'No items found' : 'No menu items'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchQuery 
                      ? `No items match "${searchQuery}". Try a different search term.`
                      : 'Add items to build your menu'
                    }
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowItemModal(true)}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary"
                    >
                      Add First Item
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center">
                              {item.image_url && (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded mr-3 flex-shrink-0"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.category_name}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">₹{item.price}</td>
                          <td className="px-3 py-2">
                            <span 
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                                item.is_available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                              onClick={() => toggleItemAvailability(item.id, item.is_available)}
                              title="Click to toggle availability"
                            >
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <div className="flex space-x-1">
                              {item.is_vegetarian && <span className="text-green-600" title="Vegetarian">🌱</span>}
                              {item.is_vegan && <span className="text-green-600" title="Vegan">🌿</span>}
                              {item.is_spicy && <span className="text-red-600" title="Spicy">🌶️</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditItem(item)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
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
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary"
                >
                  Add Category
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📂</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No categories</h3>
                  <p className="text-sm text-gray-600 mb-4">Create categories to organize your menu</p>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-secondary"
                  >
                    Add First Category
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Order: {category.order} • Items: {category.items_count || 0}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        onSubmit={handleCategorySubmit}
        formData={categoryForm}
        setFormData={setCategoryForm}
        isEditing={!!editingCategory}
      />

      {/* Item Modal */}
      <ItemModal
        isOpen={showItemModal}
        onClose={closeItemModal}
        onSubmit={handleItemSubmit}
        formData={itemForm}
        setFormData={setItemForm}
        categories={categories}
        isEditing={!!editingItem}
        imageError={imageError}
        setImageError={setImageError}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        error={error}
        setError={setError}
        menuItems={menuItems}
        editingItem={editingItem}
      />
    </div>
  );
};

export default MenuManagement;