import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SalesReport = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [customerName, setCustomerName] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/billing');
      setBillings(response.data);
    } catch (err) {
      setError('Failed to fetch billings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  // Function to handle filtering
  const filterBillings = () => {
    let filtered = billings;

    // Filter by date range
    if (fromDate) {
      filtered = filtered.filter(
        (billing) => new Date(billing.invoiceDate).toISOString().split('T')[0] >= fromDate
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        (billing) => new Date(billing.invoiceDate).toISOString().split('T')[0] <= toDate
      );
    }

    // Filter by customer name
    if (customerName) {
      filtered = filtered.filter((billing) =>
        billing.customerName.toLowerCase().includes(customerName.toLowerCase())
      );
    }

    // Sort by amount
    if (sortDirection === 'asc') {
      filtered.sort((a, b) => a.billingAmount - b.billingAmount);
    } else if (sortDirection === 'desc') {
      filtered.sort((a, b) => b.billingAmount - a.billingAmount);
    }

    setFilteredBillings(filtered);
  };

  // Update filtered billings whenever filters change
  useEffect(() => {
    filterBillings();
  }, [fromDate, toDate, customerName, sortDirection, billings]);

  // Compute total amount of filtered billings
  useEffect(() => {
    const total = filteredBillings.reduce(
      (sum, billing) => sum + (billing.billingAmount - billing.discount),
      0
    );
    setTotalAmount(total);
  }, [filteredBillings]);

  // For customer suggestions
  useEffect(() => {
    const customerNames = [...new Set(billings.map((b) => b.customerName))];
    setCustomerSuggestions(customerNames);
  }, [billings]);

  const paginateBillings = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBillings.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredBillings.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
            <th className="px-4 py-2 text-left">Invoice No</th>
            <th className="px-2 py-2">Invoice Date</th>
            <th className="px-2 py-2">Salesman Name</th>
            <th className="px-2 py-2">Customer Name</th>
            <th className="px-2 py-2">Billing Amount</th>
            <th className="px-2 py-2">Discount</th>
            <th className="px-2 py-2">Net Amount</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((row) => (
            <tr key={row} className="hover:bg-gray-100 divide-y divide-x">
              <td className="px-4 py-2 text-center">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCardSkeleton = () => {
    const skeletonCards = Array.from({ length: itemsPerPage }, (_, index) => index);
    return skeletonCards.map((card) => (
      <div
        key={card}
        className="bg-white rounded-lg shadow-md p-6 mb-4 animate-pulse"
      >
        <div className="flex justify-between items-center">
          <Skeleton height={20} width={`60%`} />
        </div>
        <p className="text-gray-600 text-xs mt-2">
          <Skeleton height={10} width={`80%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`70%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`50%`} />
        </p>
        <div className="flex justify-between mt-4">
          <p className="text-gray-600 text-xs font-bold">
            <Skeleton height={10} width={`40%`} />
          </p>
          <p className="text-gray-600 text-xs font-bold">
            <Skeleton height={10} width={`40%`} />
          </p>
        </div>
      </div>
    ));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate} to ${toDate}`, 14, 25);
    doc.text(`Customer Name: ${customerName || 'All'}`, 14, 32);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, 39);

    const tableColumn = ["Invoice No", "Invoice Date", "Salesman Name", "Customer Name", "Billing Amount", "Discount", "Net Amount"];
    const tableRows = [];

    filteredBillings.forEach(billing => {
      const billingData = [
        billing.invoiceNo,
        new Date(billing.invoiceDate).toLocaleDateString(),
        billing.salesmanName,
        billing.customerName,
        `Rs. ${billing.billingAmount.toFixed(2)}`,
        `Rs. ${billing.discount.toFixed(2)}`,
        `Rs. ${(billing.billingAmount - billing.discount).toFixed(2)}`,
      ];
      tableRows.push(billingData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
    });

    doc.save('sales_report.pdf');
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div
          onClick={() => navigate('/')}
          className="text-center cursor-pointer"
        >
          <h2 className="text-lg font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-sm font-bold">
            Sales Report
          </p>
        </div>
        <i className="fa fa-file-text text-gray-500 text-xl" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm"
              placeholder="Select From Date"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm"
              placeholder="Select To Date"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              list="customerSuggestions"
              className="w-full border border-gray-300 rounded p-2 text-sm"
              placeholder="Enter Customer Name"
            />
            <datalist id="customerSuggestions">
              {customerSuggestions.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Sort By Amount</label>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            >
              <option value="asc">Lowest to Highest</option>
              <option value="desc">Highest to Lowest</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generatePDF}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <p className="text-lg font-bold text-gray-700">
          Total Amount: Rs. {totalAmount.toFixed(2)}
        </p>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div>
          {/* Table Skeleton for Large Screens */}
          <div className="hidden md:block">
            {renderTableSkeleton()}
          </div>
          {/* Card Skeleton for Small Screens */}
          <div className="md:hidden">
            {renderCardSkeleton()}
          </div>
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-center mb-4 text-sm">{error}</p>
          )}
          {filteredBillings.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">
              No billings found for the selected criteria.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block">
                <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-sm text-white">
                    <tr className="divide-y">
                      <th className="px-4 py-2 text-left">Invoice No</th>
                      <th className="px-2 py-2">Invoice Date</th>
                      <th className="px-2 py-2">Salesman Name</th>
                      <th className="px-2 py-2">Customer Name</th>
                      <th className="px-2 py-2">Billing Amount</th>
                      <th className="px-2 py-2">Discount</th>
                      <th className="px-2 py-2">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateBillings().map((billing) => (
                      <tr
                        key={billing.invoiceNo}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-4 py-2 text-center">
                          {billing.invoiceNo}
                        </td>
                        <td className="px-2 text-sm py-2">
                          {new Date(billing.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 text-sm py-2">
                          {billing.salesmanName}
                        </td>
                        <td className="px-2 text-sm py-2">
                          {billing.customerName}
                        </td>
                        <td className="px-2 text-sm py-2">
                          Rs. {billing.billingAmount.toFixed(2)}
                        </td>
                        <td className="px-2 text-sm py-2">
                          Rs. {billing.discount.toFixed(2)}
                        </td>
                        <td className="px-2 text-sm py-2">
                          Rs. {(billing.billingAmount - billing.discount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginateBillings().map((billing) => (
                  <div
                    key={billing.invoiceNo}
                    className="bg-white rounded-lg shadow-md p-4 mb-4 transition-transform transform hover:scale-105 duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-md font-bold text-red-600">
                        Invoice No: {billing.invoiceNo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(billing.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">
                      Customer: {billing.customerName}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Salesman: {billing.salesmanName}
                    </p>
                    <div className="flex justify-between mt-4">
                      <p className="text-gray-600 text-sm font-bold">
                        Billing Amount: Rs. {billing.billingAmount.toFixed(2)}
                      </p>
                      <p className="text-gray-600 text-sm font-bold">
                        Net Amount: Rs. {(billing.billingAmount - billing.discount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 text-sm font-bold py-2 rounded-lg ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 text-sm font-bold py-2 rounded-lg ${
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

export default SalesReport;
