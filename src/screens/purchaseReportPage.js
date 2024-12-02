// PurchaseReport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PurchaseReport = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [amountThreshold, setAmountThreshold] = useState('');
  const [sortField, setSortField] = useState('totals.totalPurchaseAmount');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/purchases/sort/purchase-report/');
      setPurchases(response.data);
    } catch (err) {
      setError('Failed to fetch purchases.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Function to handle filtering
  const filterPurchases = () => {
    let filtered = purchases;

    // Filter by date range
    if (fromDate) {
      filtered = filtered.filter(
        (purchase) =>
          new Date(purchase.invoiceDate).toISOString().split('T')[0] >= fromDate
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        (purchase) =>
          new Date(purchase.invoiceDate).toISOString().split('T')[0] <= toDate
      );
    }

    // Filter by seller name
    if (sellerName) {
      filtered = filtered.filter((purchase) =>
        purchase.sellerName.toLowerCase().includes(sellerName.toLowerCase())
      );
    }

    // Filter by invoice number
    if (invoiceNo) {
      filtered = filtered.filter((purchase) =>
        purchase.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())
      );
    }

    // Filter by item name
    if (itemName) {
      filtered = filtered.filter((purchase) =>
        purchase.items.some((item) =>
          item.name.toLowerCase().includes(itemName.toLowerCase())
        )
      );
    }

    // Filter by amount threshold
    if (amountThreshold) {
      filtered = filtered.filter(
        (purchase) => purchase.totals.totalPurchaseAmount >= parseFloat(amountThreshold)
      );
    }

    // Sort by selected field
    if (sortField) {
      filtered.sort((a, b) => {
        const fieldA = getFieldValue(a, sortField);
        const fieldB = getFieldValue(b, sortField);

        if (sortDirection === 'asc') {
          if (fieldA < fieldB) return -1;
          if (fieldA > fieldB) return 1;
          return 0;
        } else {
          if (fieldA > fieldB) return -1;
          if (fieldA < fieldB) return 1;
          return 0;
        }
      });
    }

    setFilteredPurchases(filtered);
  };

  // Helper function to get nested field value
  const getFieldValue = (obj, field) => {
    return field.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  };

  // Update filtered purchases whenever filters change
  useEffect(() => {
    filterPurchases();
  }, [
    fromDate,
    toDate,
    sellerName,
    invoiceNo,
    itemName,
    amountThreshold,
    sortField,
    sortDirection,
    purchases,
  ]);

  // Compute total amount of filtered purchases
  useEffect(() => {
    const total = filteredPurchases.reduce(
      (sum, purchase) => sum + (purchase.totals.totalPurchaseAmount || 0),
      0
    );
    setTotalAmount(total);
  }, [filteredPurchases]);

  // Suggestions for autocomplete
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);
  const [itemSuggestions, setItemSuggestions] = useState([]);

  useEffect(() => {
    const sellerNames = [...new Set(purchases.map((p) => p.sellerName))];
    setSellerSuggestions(sellerNames);

    const invoiceNumbers = [...new Set(purchases.map((p) => p.invoiceNo))];
    setInvoiceSuggestions(invoiceNumbers);

    const items = [
      ...new Set(
        purchases.flatMap((p) => p.items.map((i) => i.name))
      ),
    ];
    setItemSuggestions(items);
  }, [purchases]);

  const paginatePurchases = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Purchase Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 14, 25);
    doc.text(`Seller Name: ${sellerName || 'All'}`, 14, 32);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, 39);

    const tableColumn = [
      'Invoice No',
      'Invoice Date',
      'Seller Name',
      'Total Purchase Amount',
    ];
    const tableRows = [];

    filteredPurchases.forEach((purchase) => {
      const purchaseData = [
        purchase.invoiceNo,
        new Date(purchase.invoiceDate).toLocaleDateString(),
        purchase.sellerName,
        `Rs. ${purchase.totals.totalPurchaseAmount.toFixed(2)}`,
      ];
      tableRows.push(purchaseData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
    });

    doc.save('purchase_report.pdf');
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-3 rounded-lg mb-2 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-base font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Purchase Report</p>
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
            <label className="block text-xs font-bold mb-1">Seller Name</label>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              list="sellerSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Seller Name"
            />
            <datalist id="sellerSuggestions">
              {sellerSuggestions.map((name, index) => (
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
            <label className="block text-xs font-bold mb-1">Amount ≥</label>
            <input
              type="number"
              value={amountThreshold}
              onChange={(e) => setAmountThreshold(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Amount"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Sort Field</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="totals.totalPurchaseAmount">
                Total Purchase Amount
              </option>
              <option value="invoiceDate">Invoice Date</option>
              <option value="sellerName">Seller Name</option>
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

      {/* Total Amount */}
      <div className="bg-white p-2 rounded-lg shadow-md mb-2">
        <p className="text-sm font-bold text-gray-700">
          Total Amount: Rs. {totalAmount.toFixed(2)}
        </p>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div>
          {/* Loading skeleton can be added here if needed */}
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-center mb-2 text-xs">{error}</p>
          )}
          {filteredPurchases.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No purchases found for the selected criteria.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-xs text-white">
                    <tr className="divide-y">
                      <th className="px-2 py-1 text-left">Invoice No</th>
                      <th className="px-2 py-1">Invoice Date</th>
                      <th className="px-2 py-1">Seller Name</th>
                      <th className="px-2 py-1">Total Purchase Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatePurchases().map((purchase) => (
                      <tr
                        key={purchase.purchaseId}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-2 py-1 text-center">{purchase.invoiceNo}</td>
                        <td className="px-2 py-1">
                          {new Date(purchase.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1">{purchase.sellerName}</td>
                        <td className="px-2 py-1">
                          Rs. {purchase.totals.totalPurchaseAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginatePurchases().map((purchase) => (
                  <div
                    key={purchase.purchaseId}
                    className="bg-white rounded-lg shadow-md p-2 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-red-600">
                        Invoice No: {purchase.invoiceNo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Seller: {purchase.sellerName}
                    </p>
                    <div className="flex justify-between mt-2">
                      <p className="text-gray-600 text-xs font-bold">
                        Total Amount: Rs.{' '}
                        {purchase.totals.totalPurchaseAmount.toFixed(2)}
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

export default PurchaseReport;
