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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [itemName, setItemName] = useState('');
  const [amountThreshold, setAmountThreshold] = useState('');
  const [sortField, setSortField] = useState('billingAmount');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const itemsPerPage = 15;

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/billing/sort/sales-report/');
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

    // Filter by salesman name
    if (salesmanName) {
      filtered = filtered.filter((billing) =>
        billing.salesmanName.toLowerCase().includes(salesmanName.toLowerCase())
      );
    }

    // Filter by invoice number
    if (invoiceNo) {
      filtered = filtered.filter((billing) =>
        billing.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())
      );
    }

    // Filter by payment status
    if (paymentStatus) {
      filtered = filtered.filter(
        (billing) => billing.paymentStatus.toLowerCase() === paymentStatus.toLowerCase()
      );
    }

    // Filter by delivery status
    if (deliveryStatus) {
      filtered = filtered.filter(
        (billing) => billing.deliveryStatus.toLowerCase() === deliveryStatus.toLowerCase()
      );
    }

    // Filter by item name
    if (itemName) {
      filtered = filtered.filter((billing) =>
        billing.products.some((product) =>
          product.name.toLowerCase().includes(itemName.toLowerCase())
        )
      );
    }

    // Filter by amount threshold
    if (amountThreshold) {
      filtered = filtered.filter(
        (billing) => billing.billingAmount >= parseFloat(amountThreshold)
      );
    }

    // Sort by selected field
    if (sortField) {
      filtered.sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

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

    setFilteredBillings(filtered);
  };

  // Update filtered billings whenever filters change
  useEffect(() => {
    filterBillings();
  }, [
    fromDate,
    toDate,
    customerName,
    salesmanName,
    invoiceNo,
    paymentStatus,
    deliveryStatus,
    itemName,
    amountThreshold,
    sortField,
    sortDirection,
    billings,
  ]);

  // Compute total amount of filtered billings
  useEffect(() => {
    const total = filteredBillings.reduce(
      (sum, billing) => sum + (billing.billingAmount - billing.discount),
      0
    );
    setTotalAmount(total);
  }, [filteredBillings]);

  // Suggestions for autocomplete
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [salesmanSuggestions, setSalesmanSuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);
  const [itemSuggestions, setItemSuggestions] = useState([]);

  useEffect(() => {
    const customerNames = [...new Set(billings.map((b) => b.customerName))];
    setCustomerSuggestions(customerNames);

    const salesmanNames = [...new Set(billings.map((b) => b.salesmanName))];
    setSalesmanSuggestions(salesmanNames);

    const invoiceNumbers = [...new Set(billings.map((b) => b.invoiceNo))];
    setInvoiceSuggestions(invoiceNumbers);

    const items = [
      ...new Set(
        billings.flatMap((b) => b.products.map((p) => p.name))
      ),
    ];
    setItemSuggestions(items);
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

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 14, 25);
    doc.text(`Customer Name: ${customerName || 'All'}`, 14, 32);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, 39);

    const tableColumn = [
      'Invoice No',
      'Invoice Date',
      'Salesman Name',
      'Customer Name',
      'Billing Amount',
      'Discount',
      'Net Amount',
      'Payment Status',
      'Delivery Status',
    ];
    const tableRows = [];

    filteredBillings.forEach((billing) => {
      const billingData = [
        billing.invoiceNo,
        new Date(billing.invoiceDate).toLocaleDateString(),
        billing.salesmanName,
        billing.customerName,
        `Rs. ${billing.grandTotal.toFixed(2)}`,
        `Rs. ${billing.discount.toFixed(2)}`,
        `Rs. ${(billing.billingAmount).toFixed(2)}`,
        billing.paymentStatus,
        billing.deliveryStatus,
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
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-3 rounded-lg mb-2 relative">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-base font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Sales Report</p>
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
            <label className="block text-xs font-bold mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              list="customerSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Customer Name"
            />
            <datalist id="customerSuggestions">
              {customerSuggestions.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Salesman Name</label>
            <input
              type="text"
              value={salesmanName}
              onChange={(e) => setSalesmanName(e.target.value)}
              list="salesmanSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Salesman Name"
            />
            <datalist id="salesmanSuggestions">
              {salesmanSuggestions.map((name, index) => (
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
            <label className="block text-xs font-bold mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Delivery Status</label>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="">All</option>
              <option value="Delivered">Delivered</option>
              <option value="Partially Delivered">Partially Delivered</option>
              <option value="Pending">Pending</option>
            </select>
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
              <option value="billingAmount">Billing Amount</option>
              <option value="invoiceDate">Invoice Date</option>
              <option value="customerName">Customer Name</option>
              <option value="salesmanName">Salesman Name</option>
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
          {filteredBillings.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No billings found for the selected criteria.
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
                      <th className="px-2 py-1">Salesman Name</th>
                      <th className="px-2 py-1">Customer Name</th>
                      <th className="px-2 py-1">Billing Amount</th>
                      <th className="px-2 py-1">Discount</th>
                      <th className="px-2 py-1">Net Amount</th>
                      <th className="px-2 py-1">Payment Status</th>
                      <th className="px-2 py-1">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateBillings().map((billing) => (
                      <tr
                        key={billing.invoiceNo}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-2 py-1 text-center">{billing.invoiceNo}</td>
                        <td className="px-2 py-1">
                          {new Date(billing.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1">{billing.salesmanName}</td>
                        <td className="px-2 py-1">{billing.customerName}</td>
                        <td className="px-2 py-1">
                          Rs. {billing.grandTotal.toFixed(2)}
                        </td>
                        <td className="px-2 py-1">
                          Rs. {billing.discount.toFixed(2)}
                        </td>
                        <td className="px-2 py-1">
                          Rs. {(billing.billingAmount).toFixed(2)}
                        </td>
                        <td className="px-2 py-1">{billing.paymentStatus}</td>
                        <td className="px-2 py-1">{billing.deliveryStatus}</td>
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
                    className="bg-white rounded-lg shadow-md p-2 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-red-600">
                        Invoice No: {billing.invoiceNo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(billing.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Customer: {billing.customerName}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Salesman: {billing.salesmanName}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Payment Status: {billing.paymentStatus}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Delivery Status: {billing.deliveryStatus}
                    </p>
                    <div className="flex justify-between mt-2">
                      <p className="text-gray-600 text-xs font-bold">
                        Billing Amount: Rs. {billing.grandTotal.toFixed(2)}
                      </p>
                      <p className="text-gray-600 text-xs font-bold">
                        Net Amount: Rs.{' '}
                        {(billing.billingAmount).toFixed(2)}
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

export default SalesReport;
