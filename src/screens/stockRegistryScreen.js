import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Make sure this points to your axios instance
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StockRegistry = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [changeType, setChangeType] = useState('');

  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products/stock/stock-logs');
      setLogs(response.data);
    } catch (err) {
      setError('Failed to fetch stock logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filterLogs = () => {
    let filtered = logs;

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter(
        (log) => new Date(log.date).toISOString().split('T')[0] >= fromDate
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        (log) => new Date(log.date).toISOString().split('T')[0] <= toDate
      );
    }

    // Item name filter
    if (itemName) {
      filtered = filtered.filter((log) =>
        log.name.toLowerCase().includes(itemName.toLowerCase())
      );
    }

    // Brand filter
    if (brand) {
      filtered = filtered.filter((log) =>
        (log.brand || '').toLowerCase().includes(brand.toLowerCase())
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter((log) =>
        (log.category || '').toLowerCase().includes(category.toLowerCase())
      );
    }

    // InvoiceNo filter
    if (invoiceNo) {
      filtered = filtered.filter((log) =>
        log.invoiceNo ? log.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase()) : false
      );
    }

    // ChangeType filter
    if (changeType) {
      filtered = filtered.filter(
        (log) => log.changeType.toLowerCase() === changeType.toLowerCase()
      );
    }

    // Sort
    if (sortField) {
      filtered.sort((a, b) => {
        let fieldA = a[sortField];
        let fieldB = b[sortField];

        // For date sorting
        if (sortField === 'date') {
          fieldA = new Date(fieldA);
          fieldB = new Date(fieldB);
        } else {
          // Convert strings to lowercase for consistent sorting
          if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
          if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();
        }

        if (sortDirection === 'asc') {
          return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
        } else {
          return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
        }
      });
    }

    setFilteredLogs(filtered);
  };

  useEffect(() => {
    filterLogs();
  }, [fromDate, toDate, itemName, brand, category, invoiceNo, changeType, sortField, sortDirection, logs]);

  const paginateLogs = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Autocomplete suggestions
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);

  useEffect(() => {
    const uniqueItems = [...new Set(logs.map((l) => l.name))];
    setItemSuggestions(uniqueItems);

    const uniqueBrands = [...new Set(logs.map((l) => l.brand || ''))].filter(Boolean);
    setBrandSuggestions(uniqueBrands);

    const uniqueCategories = [...new Set(logs.map((l) => l.category || ''))].filter(Boolean);
    setCategorySuggestions(uniqueCategories);

    const uniqueInvoices = [...new Set(logs.map((l) => l.invoiceNo || ''))].filter(Boolean);
    setInvoiceSuggestions(uniqueInvoices);
  }, [logs]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Stock Registry Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 14, 25);
    doc.text(`Filters:`, 14, 32);
    doc.text(`Item Name: ${itemName || 'All'}`, 14, 37);
    doc.text(`Brand: ${brand || 'All'}`, 14, 42);
    doc.text(`Category: ${category || 'All'}`, 14, 47);
    doc.text(`Invoice No: ${invoiceNo || 'All'}`, 14, 52);
    doc.text(`Change Type: ${changeType || 'All'}`, 14, 57);

    const tableColumn = [
      'Date',
      'Item Name',
      'Brand',
      'Category',
      'Change Type',
      'Invoice No',
      'Qty Change',
      'Final Stock',
    ];
    const tableRows = [];

    filteredLogs.forEach((log) => {
      const rowData = [
        new Date(log.date).toLocaleDateString(),
        log.name,
        log.brand,
        log.category,
        log.changeType,
        log.invoiceNo || '',
        log.quantityChange,
        log.finalStock,
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      styles: { fontSize: 8 },
    });

    doc.save('stock_registry_report.pdf');
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-3 rounded-lg mb-2 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-base font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Stock Registry</p>
        </div>
        <i className="fa fa-file-text text-gray-500 text-lg" />
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-lg shadow-md mb-2">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
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
            <label className="block text-xs font-bold mb-1">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              list="itemSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Item Name"
            />
            <datalist id="itemSuggestions">
              {itemSuggestions.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              list="brandSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Brand"
            />
            <datalist id="brandSuggestions">
              {brandSuggestions.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="categorySuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Category"
            />
            <datalist id="categorySuggestions">
              {categorySuggestions.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Invoice No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              list="invoiceSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Invoice No"
            />
            <datalist id="invoiceSuggestions">
              {invoiceSuggestions.map((no, index) => (
                <option key={index} value={no} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Change Type</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="">All</option>
              <option value="Purchase">Purchase</option>
              <option value="Sales (Billing)">Sales (Billing)</option>
              <option value="Return">Return</option>
              <option value="Damage">Damage</option>
              <option value="Opening Stock">Opening Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Sort Field</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="date">Date</option>
              <option value="name">Item Name</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
              <option value="quantityChange">Quantity Change</option>
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

      {loading ? (
        <div>
          <Skeleton count={5} />
        </div>
      ) : (
        <>
          {error && (
            <p className="text-red-500 text-center mb-2 text-xs">{error}</p>
          )}
          {filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No stock logs found for the selected criteria.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-xs text-white">
                    <tr className="divide-y">
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1">Item Name</th>
                      <th className="px-2 py-1">Brand</th>
                      <th className="px-2 py-1">Category</th>
                      <th className="px-2 py-1">Change Type</th>
                      <th className="px-2 py-1">Invoice No</th>
                      <th className="px-2 py-1">Qty Change</th>
                      <th className="px-2 py-1">Final Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateLogs().map((log, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-2 py-1 text-center">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1">{log.name}</td>
                        <td className="px-2 py-1">{log.brand}</td>
                        <td className="px-2 py-1">{log.category}</td>
                        <td className="px-2 py-1">{log.changeType}</td>
                        <td className="px-2 py-1">{log.invoiceNo || ''}</td>
                        <td className="px-2 py-1">{log.quantityChange}</td>
                        <td className="px-2 py-1">{log.finalStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginateLogs().map((log, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-2 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-red-600">
                        {log.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Brand: {log.brand}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Category: {log.category}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Change Type: {log.changeType}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Invoice No: {log.invoiceNo || 'N/A'}
                    </p>
                    <div className="flex justify-between mt-2">
                      <p className="text-gray-600 text-xs font-bold">
                        Qty Change: {log.quantityChange}
                      </p>
                      <p className="text-gray-600 text-xs font-bold">
                        Final Stock: {log.finalStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 text-xs font-bold py-1 rounded-lg ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-2 text-xs font-bold py-1 rounded-lg ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default StockRegistry;
