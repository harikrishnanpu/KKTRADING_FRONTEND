import React, { useState, useEffect } from 'react';
import api from './api'; // Axios instance
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const StockUpdatePage = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userSignin);

  const [searchQuery, setSearchQuery] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [quantityChange, setQuantityChange] = useState('');
  const [remark, setRemark] = useState('');

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [loading, setLoading] = useState(false);
  const [logError, setLogError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    setLogError('');
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (filterName) params.name = filterName;
      if (filterBrand) params.brand = filterBrand;
      if (filterCategory) params.category = filterCategory;
      params.sortField = sortField;
      params.sortDirection = sortDirection;

      const { data } = await api.get('/api/stock-update/logs', { params });
      setLogs(data);
    } catch (error) {
      setLogError('Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fromDate, toDate, filterName, filterBrand, filterCategory, sortField, sortDirection]);

  useEffect(() => {
    setFilteredLogs(logs);
  }, [logs]);

  // Product search
  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length === 0) {
      setProductSuggestions([]);
      return;
    }
    try {
      const { data } = await api.get('/api/stock-update/search-products', {
        params: { q },
      });
      setProductSuggestions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setProductSuggestions([]);
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct) {
      setUpdateError('No product selected.');
      return;
    }

    if (!quantityChange || isNaN(parseFloat(quantityChange)) || parseFloat(quantityChange) === 0) {
      setUpdateError('Enter a valid quantity change (e.g. +10 or -5).');
      return;
    }

    setUpdateError('');
    try {
      const { data } = await api.post('/api/stock-update/create', {
        item_id: selectedProduct.item_id,
        quantityChange,
        submittedBy: userInfo?.name || 'Unknown',
        remark
      });
      // After update, refetch logs and product details
      fetchLogs();
    //   const productRes = await api.get(`/api/products/itemId/${selectedProduct.item_id}`);
      setSelectedProduct('');
      setSearchQuery('');
      setQuantityChange('');
      setRemark('');
    } catch (error) {
      console.error(error);
      setUpdateError(error.response?.data?.message || 'Failed to update stock.');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this update log?')) return;
    try {
      const { data } = await api.delete(`/api/stock-update/${logId}`);
      setDeleteMessage(data.message);
      fetchLogs();
      if (selectedProduct) {
        const productRes = await api.get(`/api/products/itemId/${selectedProduct.item_id}`);
        setSelectedProduct(productRes.data);
      }
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setDeleteMessage('Failed to delete log.');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Stock Update Logs', 14, 15);
    doc.setFontSize(10);
    doc.text(`Filters: From: ${fromDate || 'All'} To: ${toDate || 'All'}`, 14, 22);
    doc.text(`Name: ${filterName || 'All'}, Brand: ${filterBrand || 'All'}, Category: ${filterCategory || 'All'}`, 14, 27);

    const columns = ['Date', 'Product Name', 'Brand', 'Category', 'Quantity Change', 'Updated By', 'Remark'];
    const rows = filteredLogs.map(log => [
      new Date(log.date).toLocaleString(),
      log.name,
      log.brand,
      log.category,
      log.quantity > 0 ? `+${log.quantity}` : `${log.quantity}`,
      log.submittedBy,
      log.remark || ''
    ]);

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 32,
      styles: { fontSize: 8 },
    });

    doc.save('stock_updates.pdf');
  };

  // Sorting and filtering handled by effect on logs fetch
  // Pagination (if needed)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginateLogs = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-3 rounded-lg mb-2 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-base font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Stock Update</p>
        </div>
        <i className="fa fa-cubes text-gray-500 text-lg" />
      </div>

      {/* Product Search and Update */}
      <div className="bg-white p-2 rounded-lg shadow-md mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Update Stock</h3>
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full border border-gray-300 rounded p-1 text-xs"
            placeholder="Search product by name or item_id..."
          />
          {productSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border mt-1 rounded shadow-md max-h-40 overflow-y-auto text-xs">
              {productSuggestions.map((p) => (
                <li
                  key={p._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectProduct(p)}
                >
                  {p.item_id} - {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedProduct && (
          <div className="border rounded p-2 text-xs bg-gray-50 mb-2 animate-fadeIn">
            <p className="font-bold text-gray-700 mb-1">
              {selectedProduct.name} ({selectedProduct.item_id})
            </p>
            <p className="text-gray-600 mb-1">Brand: {selectedProduct.brand}</p>
            <p className="text-gray-600 mb-1">Category: {selectedProduct.category}</p>
            <p className="text-gray-600 mb-1">
              Current Stock: {selectedProduct.countInStock}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-bold mb-1">Quantity Change (+/-)</label>
            <input
              type="text"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="+10 or -5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Remark</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Optional remark"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleStockUpdate}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1 rounded text-xs"
            >
              Update Stock
            </button>
          </div>
        </div>
        {updateError && <p className="text-red-500 text-xs mt-1">{updateError}</p>}
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-lg shadow-md mb-2">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Filters & Sorting</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
          <div>
            <label className="block text-xs font-bold mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Name</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Filter by name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Brand</label>
            <input
              type="text"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Filter by brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Category</label>
            <input
              type="text"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Filter by category"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Sort Field</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
              <option value="quantity">Quantity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Sort Direction</label>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generatePDF}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1 rounded text-xs"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {logError && <p className="text-red-500 text-xs mb-2 text-center">{logError}</p>}
      {deleteMessage && <p className="text-green-600 text-xs mb-2 text-center">{deleteMessage}</p>}

      {loading ? (
        <div className="text-center text-gray-500 text-xs">Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <p className="text-center text-gray-500 text-xs">No logs found.</p>
      ) : (
        <>
          {/* Table for large screens */}
          <div className="hidden md:block">
            <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Brand</th>
                  <th className="px-2 py-1 text-left">Category</th>
                  <th className="px-2 py-1 text-center">Quantity</th>
                  <th className="px-2 py-1 text-left">Updated By</th>
                  <th className="px-2 py-1 text-left">Remark</th>
                  <th className="px-2 py-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginateLogs().map((log) => (
                  <tr key={log._id} className="hover:bg-gray-100">
                    <td className="px-2 py-1 text-left">
                      {new Date(log.date).toLocaleString()}
                    </td>
                    <td className="px-2 py-1">{log.name}</td>
                    <td className="px-2 py-1">{log.brand}</td>
                    <td className="px-2 py-1">{log.category}</td>
                    <td className={`px-2 py-1 text-center font-bold ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                    </td>
                    <td className="px-2 py-1">{log.submittedBy}</td>
                    <td className="px-2 py-1">{log.remark}</td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for small screens */}
          <div className="md:hidden">
            {paginateLogs().map((log) => (
              <div key={log._id} className="bg-white rounded-lg shadow-md p-2 mb-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-gray-700">{log.name}</p>
                  <p className="text-xs text-gray-400">{new Date(log.date).toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-600">Brand: {log.brand}</p>
                <p className="text-xs text-gray-600">Category: {log.category}</p>
                <p className={`text-xs font-bold ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Quantity: {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                </p>
                <p className="text-xs text-gray-600">Updated By: {log.submittedBy}</p>
                <p className="text-xs text-gray-600">Remark: {log.remark}</p>
                <div className="text-right mt-2">
                  <button
                    onClick={() => handleDeleteLog(log._id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded ${
                currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded ${
                currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StockUpdatePage;
