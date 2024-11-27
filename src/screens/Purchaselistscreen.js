// src/screens/PurchaseList.jsx
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sellerNameFilter, setSellerNameFilter] = useState('');

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

  // Fetch all purchases
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products/purchases/all');
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

  // Apply filters
  const filteredPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.billingDate || purchase.invoiceDate);
    if (startDate && purchaseDate < new Date(startDate)) {
      return false;
    }
    if (endDate && purchaseDate > new Date(endDate)) {
      return false;
    }
    if (
      sellerNameFilter &&
      !purchase.sellerName.toLowerCase().includes(sellerNameFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const paginatePurchases = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(start, start + itemsPerPage);
  };

  // PDF Generation for filtered purchases
  const handleGeneratePDF = () => {
    setPdfLoading(true);

    const purchasesToPrint = filteredPurchases;

    // Prepare data for PDF
    const doc = new jsPDF();

    doc.text('Purchase Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = [
      'Invoice No',
      'Invoice Date',
      'Supplier Name',
      'Seller ID',
      'Purchase ID',
      'Seller GST',
      'Total Items',
      'Total Amount',
      'Grand Total',
      'Transportation Charges',
    ];
    const tableRows = [];

    purchasesToPrint.forEach((purchase) => {
      const purchaseData = [
        purchase.invoiceNo,
        new Date(purchase.billingDate || purchase.invoiceDate).toLocaleDateString(),
        purchase.sellerName,
        purchase.sellerId,
        purchase.purchaseId,
        purchase.sellerGst || 'N/A',
        purchase.items.length,
        '₹' + purchase.totals.totalPurchaseAmount?.toFixed(2),
        '₹' + purchase.totals.grandTotalPurchaseAmount?.toFixed(2),
        '₹' + (purchase.totals.transportationCharges || 0)?.toFixed(2),
      ];
      tableRows.push(purchaseData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 30, styles: { fontSize: 8 }, headStyles: { fillColor: [220, 53, 69] } });
    doc.save('Purchase_Report.pdf');

    setPdfLoading(false);
  };


  // Handle Generate Single Print (Purchase Invoice)
  const handleGenerateSinglePrint = (purchase) => {
    const formData = {
      sellerId: purchase.sellerId || '',
      sellerName: purchase.sellerName || '',
      sellerAddress: purchase.sellerAddress || '',
      sellerGst: purchase.sellerGst || '',
      invoiceNo: purchase.invoiceNo || '',
      purchaseId: purchase.purchaseId || '',
      billingDate: purchase.billingDate || '',
      invoiceDate: purchase.invoiceDate || '',
      items: purchase.items.map((item) => ({
        itemId: item.itemId || '',
        name: item.name || '',
        brand: item.brand || '',
        category: item.category || '',
        quantity: item.quantity || 0,
        quantityInNumbers: item.quantityInNumbers || 0,
        pUnit: item.pUnit || '',
        sUnit: item.sUnit || '',
        psRatio: item.psRatio || 0,
        length: item.length || 0,
        breadth: item.breadth || 0,
        size: item.size || 0,
        billPartPrice: parseFloat(item.billPartPrice) || 0,
        cashPartPrice: parseFloat(item.cashPartPrice) || 0,
        billPartPriceInNumbers: parseFloat(item.billPartPriceInNumbers) || 0,
        cashPartPriceInNumbers: parseFloat(item.cashPartPriceInNumbers) || 0,
        allocatedOtherExpense: parseFloat(item.allocatedOtherExpense) || 0,
      })),
      totals: {
        billPartTotal: parseFloat(purchase.totals.billPartTotal) || 0,
        cashPartTotal: parseFloat(purchase.totals.cashPartTotal) || 0,
        amountWithoutGSTItems: parseFloat(purchase.totals.amountWithoutGSTItems) || 0,
        gstAmountItems: parseFloat(purchase.totals.gstAmountItems) || 0,
        cgstItems: parseFloat(purchase.totals.cgstItems) || 0,
        sgstItems: parseFloat(purchase.totals.sgstItems) || 0,
        amountWithoutGSTTransport: parseFloat(purchase.totals.amountWithoutGSTTransport) || 0,
        gstAmountTransport: parseFloat(purchase.totals.gstAmountTransport) || 0,
        cgstTransport: parseFloat(purchase.totals.cgstTransport) || 0,
        sgstTransport: parseFloat(purchase.totals.sgstTransport) || 0,
        unloadingCharge: parseFloat(purchase.totals.unloadingCharge) || 0,
        insurance: parseFloat(purchase.totals.insurance) || 0,
        damagePrice: parseFloat(purchase.totals.damagePrice) || 0,
        totalPurchaseAmount: parseFloat(purchase.totals.totalPurchaseAmount) || 0,
        totalOtherExpenses: parseFloat(purchase.totals.totalOtherExpenses) || 0,
        grandTotalPurchaseAmount: parseFloat(purchase.totals.grandTotalPurchaseAmount) || 0,
        transportationCharges: parseFloat(purchase.totals.transportationCharges) || 0,
      },
      transportationDetails: {
        logistic: {
          purchaseId: purchase.transportationDetails?.logistic?.purchaseId || '',
          invoiceNo: purchase.transportationDetails?.logistic?.invoiceNo || '',
          billId: purchase.transportationDetails?.logistic?.billId || '',
          companyGst: purchase.transportationDetails?.logistic?.companyGst || '',
          transportCompanyName:
            purchase.transportationDetails?.logistic?.transportCompanyName || '',
          transportationCharges:
            parseFloat(purchase.transportationDetails?.logistic?.transportationCharges) || 0,
          remark: purchase.transportationDetails?.logistic?.remark || '',
        },
        local: {
          purchaseId: purchase.transportationDetails?.local?.purchaseId || '',
          invoiceNo: purchase.transportationDetails?.local?.invoiceNo || '',
          billId: purchase.transportationDetails?.local?.billId || '',
          companyGst: purchase.transportationDetails?.local?.companyGst || '',
          transportCompanyName:
            purchase.transportationDetails?.local?.transportCompanyName || '',
          transportationCharges:
            parseFloat(purchase.transportationDetails?.local?.transportationCharges) || 0,
          remark: purchase.transportationDetails?.local?.remark || '',
        },
      },
    };

    api
      .post('/api/print/generate-purchase-invoice-html', formData)
      .then((response) => {
        const htmlContent = response.data; // Extract the HTML content
        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to generate purchase invoice. Please try again.');
      });
  };


  // Handle Remove Purchase
  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this purchase?')) {
      try {
        await api.delete(`/api/products/purchases/delete/${id}`);
        setPurchases(purchases.filter((purchase) => purchase._id !== id));
      } catch (error) {
        setError('Error occurred while deleting the purchase.');
        console.error(error);
      }
    }
  };

  // Handle View Purchase Details
  const handleView = (purchase) => {
    setSelectedPurchase(purchase);
  };

  // Close Modal
  const closeModal = () => {
    setSelectedPurchase(null);
  };

  // Handle Page Change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render Purchase Card for Mobile
  const renderCard = (purchase) => (
    <div
      key={purchase.invoiceNo}
      className="bg-white rounded-lg shadow-md p-6 mb-4 transition-transform transform hover:scale-105 duration-200"
    >
      <div className="flex justify-between items-center">
        <p
          onClick={() => navigate(`/purchases/${purchase._id}`)}
          className={`text-md flex cursor-pointer font-bold text-red-600`}
        >
          {purchase.invoiceNo}
        </p>
        <p className="text-gray-600 text-xs">Purchase ID: {purchase.purchaseId}</p>
      </div>
      <p className="text-gray-600 text-xs mt-2">Supplier: {purchase.sellerName}</p>
      <p className="text-gray-600 text-xs mt-1">Seller ID: {purchase.sellerId}</p>
      <p className="text-gray-600 text-xs mt-1">Seller GST: {purchase.sellerGst || 'N/A'}</p>
      <p className="text-gray-600 text-xs mt-1">
        Invoice Date: {new Date(purchase.billingDate || purchase.invoiceDate).toLocaleDateString()}
      </p>
      <p className="text-gray-600 text-xs mt-1">Total Items: {purchase.items.length}</p>
      <div className="flex justify-between">
        <p className="text-gray-600 text-xs font-bold mt-1">
          Total Amount: ₹{purchase.totals.totalPurchaseAmount?.toFixed(2)}
        </p>
        <p className="text-gray-400 italic text-xs mt-1">
          Grand Total: ₹{purchase.totals.grandTotalPurchaseAmount?.toFixed(2)}
        </p>
      </div>
      <div className="flex justify-between">
        <p className="text-gray-600 text-xs font-bold mt-1">
          Transportation Charges: ₹{purchase.totals.transportationCharges || 0}
        </p>
        <p className="text-gray-400 italic text-xs mt-1">
          Last Edited: {new Date(purchase.updatedAt ? purchase.updatedAt : purchase.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex mt-4 text-xs space-x-2">
        {userInfo.isAdmin && (
          <button
            onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
            className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
          >
            <i className="fa fa-pen mr-2"></i> Edit
          </button>
        )}
        {userInfo.isAdmin && (
          <button
            onClick={() => handleGenerateSinglePrint(purchase)}
            className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
          >
            <i className="fa fa-print mr-2"></i> 
          </button>
        )}
        <button
          onClick={() => handleView(purchase)}
          className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
        >
          <i className="fa fa-eye mr-2"></i> View
        </button>
        {userInfo.isAdmin && (
          <button
            onClick={() => handleRemove(purchase._id)}
            className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
          >
            <i className="fa fa-trash mr-2"></i> Delete
          </button>
        )}
      </div>
    </div>
  );

  // Render Skeleton for Table
  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
            <th className="px-2 py-2">Invoice No</th>
            <th className="px-2 py-2">Purchase ID</th>
            <th className="px-2 py-2">Invoice Date</th>
            <th className="px-2 py-2">Supplier Name</th>
            <th className="px-2 py-2">Seller ID</th>
            <th className="px-2 py-2">Seller GST</th>
            <th className="px-2 py-2">Total Items</th>
            <th className="px-2 py-2">Total Amount</th>
            <th className="px-2 py-2">Grand Total</th>
            <th className="px-2 py-2">Transportation Charges</th>
            <th className="px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((row) => (
            <tr key={row} className="hover:bg-gray-100 divide-y divide-x">
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

  // Render Skeleton for Cards
  const renderCardSkeleton = () => {
    const skeletonCards = Array.from({ length: itemsPerPage }, (_, index) => index);
    return skeletonCards.map((card) => (
      <div
        key={card}
        className="bg-white rounded-lg shadow-md p-6 mb-4 animate-pulse"
      >
        <div className="flex justify-between items-center">
          <Skeleton height={20} width={`60%`} />
          <Skeleton height={15} width={`30%`} />
        </div>
        <p className="text-gray-600 text-xs mt-2">
          <Skeleton height={10} width={`80%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`60%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`50%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`70%`} />
        </p>
        <div className="flex justify-between">
          <p className="text-gray-600 text-xs font-bold mt-1">
            <Skeleton height={10} width={`40%`} />
          </p>
          <p className="text-gray-400 italic text-xs mt-1">
            <Skeleton height={10} width={`30%`} />
          </p>
        </div>
        <div className="flex justify-between">
          <p className="text-gray-600 text-xs font-bold mt-1">
            <Skeleton height={10} width={`50%`} />
          </p>
          <p className="text-gray-400 italic text-xs mt-1">
            <Skeleton height={10} width={`30%`} />
          </p>
        </div>
        <div className="flex mt-4 text-xs space-x-2">
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div
          onClick={() => navigate('/')}
          className="text-center cursor-pointer"
        >
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            All Purchases Information and Updation
          </p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center mb-4">
        <div className="mr-4 mb-2">
          <label className="text-xs font-bold text-gray-700 mr-2">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>
        <div className="mr-4 mb-2">
          <label className="text-xs font-bold text-gray-700 mr-2">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>
        <div className="mr-4 mb-2">
          <label className="text-xs font-bold text-gray-700 mr-2">Seller Name:</label>
          <input
            type="text"
            value={sellerNameFilter}
            onChange={(e) => setSellerNameFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
            placeholder="Enter seller name"
          />
        </div>
        <div className="mb-2">
          <button
            onClick={handleGeneratePDF}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs flex items-center"
          >
            <i className="fa fa-file-pdf-o mr-1"></i> Generate PDF Report
          </button>
        </div>
      </div>

      {/* PDF Loading Spinner */}
      {pdfLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-xs">Generating...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-center mb-4 text-xs">{error}</p>
      )}

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
          {/* Purchases List */}
          {filteredPurchases.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No purchases available.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-xs text-white">
                    <tr className="divide-y">
                      <th className="px-2 py-2">Invoice No</th>
                      <th className="px-2 py-2">Purchase ID</th>
                      <th className="px-2 py-2">Invoice Date</th>
                      <th className="px-2 py-2">Supplier Name</th>
                      <th className="px-2 py-2">Seller ID</th>
                      <th className="px-2 py-2">Seller GST</th>
                      <th className="px-2 py-2">Total Items</th>
                      <th className="px-2 py-2">Total Amount</th>
                      <th className="px-2 py-2">Grand Total</th>
                      <th className="px-2 py-2">Transportation Charges</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatePurchases().map((purchase) => (
                      <tr
                        key={purchase.invoiceNo}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td
                          onClick={() => navigate(`/purchases/${purchase._id}`)}
                          className={`px-2 cursor-pointer flex text-xs font-bold py-2 text-red-600`}
                        >
                          {purchase.invoiceNo}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.purchaseId}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {new Date(purchase.billingDate || purchase.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.sellerName}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.sellerId}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.sellerGst || 'N/A'}
                        </td>
                        <td className="px-2 text-xs py-2">
                          {purchase.items.length}
                        </td>
                        <td className="px-2 text-xs py-2">
                          ₹{purchase.totals.totalPurchaseAmount?.toFixed(2)}
                        </td>
                        <td className="px-2 text-xs py-2">
                          ₹{purchase.totals.grandTotalPurchaseAmount?.toFixed(2)}
                        </td>
                        <td className="px-2 text-xs py-2">
                          ₹{purchase.totals.transportationCharges || 0}
                        </td>
                        <td className="px-2 text-xs py-2">
                          <div className="flex mt-2 text-xs space-x-1">
                            {userInfo.isAdmin && (
                              <button
                                onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                              >
                                <i className="fa fa-pen mr-1"></i> Edit
                              </button>
                            )}
                            {userInfo.isAdmin && (
                              <button
                                onClick={() => handleGenerateSinglePrint(purchase)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                              >
                                <i className="fa fa-print mr-1"></i>
                              </button>
                            )}
                            <button
                              onClick={() => handleView(purchase)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-eye mr-1"></i> View
                            </button>
                            {userInfo.isAdmin && (
                              <button
                                onClick={() => handleRemove(purchase._id)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                              >
                                <i className="fa fa-trash mr-1"></i> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginatePurchases().map(renderCard)}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 text-xs font-bold py-2 rounded-lg ${
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
                  className={`px-4 text-xs font-bold py-2 rounded-lg ${
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

      {/* Modal for Viewing Purchase Details */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto">
          <div className="bg-white top-1/2  rounded-lg p-6  max-w-4xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>
            <div className="mt-2 p-2">
              <p className="text-sm text-gray-600 font-bold mb-2 text-red-600">
                Details for Invoice No. {selectedPurchase.invoiceNo}
              </p>

              <div className="flex flex-wrap justify-between">
                <p className="text-xs mb-1">
                  Supplier Name:{' '}
                  <span className="text-gray-700">{selectedPurchase.sellerName}</span>
                </p>
                <p className="text-xs mb-1">
                  Seller ID:{' '}
                  <span className="text-gray-700">{selectedPurchase.sellerId}</span>
                </p>
                <p className="text-xs mb-1">
                  Seller GST:{' '}
                  <span className="text-gray-700">{selectedPurchase.sellerGst || 'N/A'}</span>
                </p>
                <p className="text-xs mb-1">
                  Invoice Date:{' '}
                  <span className="text-gray-700">
                    {new Date(selectedPurchase.billingDate || selectedPurchase.invoiceDate).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Purchase ID:{' '}
                  <span onClick={()=> navigate(`/purchases/${selectedPurchase._id}`)} className="text-gray-700">{selectedPurchase.purchaseId}</span>
                </p>
                <p className="text-xs mb-1">
                  Seller Address:{' '}
                  <span className="text-gray-700">{selectedPurchase.sellerAddress || 'N/A'}</span>
                </p>
              </div>

              <div className="flex flex-wrap justify-between mt-2">
                <p className="text-xs mb-1">
                  Total Purchase Amount:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.totalPurchaseAmount?.toFixed(2)}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Grand Total Purchase Amount:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.grandTotalPurchaseAmount?.toFixed(2)}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Transportation Charges:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.transportationCharges || 0}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Unloading Charge:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.unloadingCharge || 0}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Insurance:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.insurance || 0}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Damage Price:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.damagePrice || 0}
                  </span>
                </p>
                <p className="text-xs mb-1">
                  Total Other Expenses:{' '}
                  <span className="text-gray-700">
                    ₹{selectedPurchase.totals.totalOtherExpenses || 0}
                  </span>
                </p>
              </div>

              <h3 className="text-sm font-bold text-red-600 mt-5">
                Items: {selectedPurchase.items?.length}
              </h3>
              <div className="mx-auto my-8">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Sl
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Product
                        </th>
                        <th scope="col" className="px-2 py-3 text-center">
                          ID
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Qty
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Unit
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Bill Price
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Cash Price
                        </th>
                        <th scope="col" className="px-2 py-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase?.items.map((item, index) => (
                        <tr
                          key={index}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <th
                            scope="row"
                            className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap"
                          >
                            {index + 1}
                          </th>
                          <td className="px-2 py-4 text-xs text-gray-900">
                            {item.name.length > 15
                              ? `${item.name.slice(0, 15)}...`
                              : item.name}
                          </td>
                          <td className="px-2 py-4 text-xs text-center">
                            {item.itemId || 'N/A'}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            {item.pUnit || 'N/A'}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            ₹{item.billPartPrice?.toFixed(2)}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            ₹{item.cashPartPrice?.toFixed(2)}
                          </td>
                          <td className="px-2 py-4 text-xs">
                            ₹{(item.quantity * (item.billPartPrice + item.cashPartPrice))?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-10 text-right mr-2">
                    <p className="text-xs mb-1">
                      Bill Part Total:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.billPartTotal?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Cash Part Total:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.cashPartTotal?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Amount Without GST (Items):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.amountWithoutGSTItems?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      GST Amount (Items):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.gstAmountItems?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      CGST (Items):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.cgstItems?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      SGST (Items):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.sgstItems?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Amount Without GST (Transport):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.amountWithoutGSTTransport?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      GST Amount (Transport):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.gstAmountTransport?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      CGST (Transport):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.cgstTransport?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      SGST (Transport):{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.sgstTransport?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Unloading Charge:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.unloadingCharge?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Insurance:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.insurance?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Damage Price:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.damagePrice?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Total Other Expenses:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.totalOtherExpenses?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-xs mb-1">
                      Grand Total Purchase Amount:{' '}
                      <span className="text-gray-600">
                        ₹{selectedPurchase.totals.grandTotalPurchaseAmount?.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseList;
