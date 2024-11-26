import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from "./api";

const PurchaseInfo = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const limit = 8;
  const [isSinglePurchase, setIsSinglePurchase] = useState(false);
  const [isFetchError, setFetchError] = useState(null);
  const [activeSection, setActiveSection] = useState("Purchase Details");

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchPurchaseById(id);
    } else {
      fetchPurchases();
    }
  }, [id, currentPage]);

  const fetchPurchaseById = async (purchaseId) => {
    try {
      const { data } = await api.get(`/api/purchases/get/${purchaseId}`);
      setPurchases([data]);
      setIsSinglePurchase(true);
    } catch (error) {
      console.error("Error fetching purchase by ID:", error);
      setError("Error fetching the specific purchase.");
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await api.get(
        `/api/purchases/purchaseinfo/?page=${currentPage}&limit=${limit}`
      );
      setPurchases(response.data.purchases);
      setTotalPages(response.data.totalPages);
      setCount(response.data.totalPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setError("Error fetching purchases");
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      setFetchError(null);
      if (searchTerm) {
        try {
          const response = await api.get(
            `/api/purchases/suggestions?search=${searchTerm}`
          );
          setSuggestions(response.data);
          if (response.data.length === 0) {
            setFetchError("No Suggestions Found");
          }
        } catch (error) {
          setFetchError("Error Occurred");
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      navigate(`/purchases/${suggestions[selectedSuggestionIndex]._id}`);
      setSearchTerm('');
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  const generatePDF = (purchase) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.setFont("Helvetica", "bold");
    doc.text('Purchase Invoice', 14, 22);

    doc.setFont("Helvetica", "normal");

    const invoiceDate = new Date(purchase.invoiceDate);

    doc.setFontSize(12);
    doc.text(`Purchase ID: ${purchase.purchaseId}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Seller Name: ${purchase.sellerName}`, 14, 60);

    doc.setFontSize(14);
    doc.text('Seller Details:', 14, 75);

    doc.setFontSize(12);
    doc.text(`Seller Address: ${purchase.sellerAddress}`, 14, 85);
    doc.text(`Seller GST: ${purchase.sellerGst}`, 14, 95);

    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price']],
      body: purchase.items.map(item => [
        item.itemId || 'N/A',
        item.name || 'N/A',
        item.quantity ? item.quantity.toString() : '0',
        item.billPartPrice ? item.billPartPrice.toFixed(2) : '0.00',
      ]),
      startY: 105,
      theme: 'striped',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
      },
    });

    doc.setFontSize(12);
    doc.text(`Total Purchase Amount: ₹${purchase.totals.grandTotalPurchaseAmount.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 10);

    doc.save('purchase_invoice.pdf');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      navigate(`/purchases?page=${currentPage + 1}`);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      navigate(`/purchases?page=${currentPage - 1}`);
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSeeAllPurchases = () => {
    setIsSinglePurchase(false);
    setSelectedPurchase(null);
    fetchPurchases();
    navigate('/purchases');
  };

  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-4 rounded-lg mb-4">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Purchase Bills for Employees</p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      {purchases.length > 1 && (
        <div className="mb-5 flex justify-center relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSuggestionKeyDown}
            placeholder="Search for a purchase..."
            className="p-3 border-gray-200 text-sm focus:ring-red-500 focus:border-red-500 rounded-md shadow-sm w-full max-w-md"
          />
          <button
            onClick={() => {
              if (searchTerm.length === 0) setSearchTerm(' ');
            }}
            className="text-white ml-2 bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300  rounded-lg text-sm px-4 py-2"
          >
            <i className="fa fa-search" />
          </button>

          {suggestions.length > 0 && (
            <ul className="bg-white mt-16 absolute divide-y w-full max-w-md mx-auto left-0 right-0 bg-white border border-gray-300 rounded-md z-10 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion._id}
                  onClick={() => {
                    navigate(`/purchases/${suggestion._id}`);
                    setSearchTerm('');
                    setSuggestions([]);
                  }}
                  className={`p-3 flex text-sm justify-between cursor-pointer hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
                >
                  <span><span className="font-bold text-gray-500">{suggestion.purchaseId}</span> - {suggestion.sellerName}</span>
                  <i className="fa fa-arrow-right text-gray-300" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {isFetchError && <p className="text-xs text-red-500 text-center">{isFetchError}.</p>}

      <div className="p-3">
        <div className="flex justify-between">
          {!isSinglePurchase && <h1 className="text-sm font-bold mb-6 truncate text-left text-gray-500">Purchase Bills</h1>}
          {isSinglePurchase && <h1 onClick={() => handleSeeAllPurchases()} className="text-sm cursor-pointer truncate font-bold mb-6 text-left text-gray-500"><i className="fa fa-angle-left" /> See All Purchases</h1>}
          <p className="text-gray-400 truncate font-bold text-sm text-left mb-4">
            {!isSinglePurchase ? `Total Purchases: ${count}` : `Showing Purchase ID: ${purchases[0]?.purchaseId}`}
          </p>
        </div>

        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          {purchases.length > 1 && (
            <table className="min-w-full text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Purchase ID</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Seller</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold md:block hidden">Invoice Date</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Total Amount</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">View</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="bg-white border-b hover:bg-gray-100">
                    <td className="px-4 py-3 text-xs text-gray-900 whitespace-nowrap">{purchase.purchaseId}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{purchase.sellerName}</td>
                    <td className="px-4 py-3 hidden md:block text-xs text-gray-700">{new Date(purchase.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">₹{purchase.totals.grandTotalPurchaseAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-left">
                      <button onClick={() => navigate(`/purchases/${purchase._id}`)} className=" text-red-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <>
          {purchases.length === 1 && purchases.map((purchase) => (
            <div key={purchase._id} className="max-w-2xl mx-auto p-5 bg-white border border-gray-200 rounded-lg shadow">
              <div className="flex justify-center gap-8">
                <button
                  className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                    activeSection === "Purchase Details" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
                  }`}
                  onClick={() => setActiveSection("Purchase Details")}
                >
                  Purchase Details
                  {activeSection === "Purchase Details" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                  )}
                </button>
                <button
                  className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                    activeSection === "Transport Info" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
                  }`}
                  onClick={() => setActiveSection("Transport Info")}
                >
                  Transport Info
                  {activeSection === "Transport Info" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                  )}
                </button>
              </div>

              {activeSection === "Purchase Details" && (
                <div className="pt-8">
                  <div className="flex justify-between">
                    <h5 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">{purchase.purchaseId}</h5>
                  </div>
                  <div className="flex justify-between">
                    <p className="mt-1 text-xs truncate font-bold text-gray-600">Seller: {purchase.sellerName}</p>
                    <p className="mt-1 text-xs truncate font-normal text-gray-700">Invoice Date: {new Date(purchase.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">Seller Address: {purchase.sellerAddress}</p>
                  <p className="mt-1 text-xs text-gray-600">Seller GST: {purchase.sellerGst}</p>

                  <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Total Amount:
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          ₹{purchase.totals.grandTotalPurchaseAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          GST Amount:
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          ₹{purchase.totals.gstAmountItems.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          CGST:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          ₹{purchase.totals.cgstItems.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          SGST:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          ₹{purchase.totals.sgstItems.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto my-8">
                    <div className="relative overflow-hidden">
                      <p className="font-bold mb-4 text-sm">Total Items: {purchase.items?.length}</p>
                      <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3">Item</th>
                            <th scope="col" className="px-2 py-3">ID</th>
                            <th scope="col" className="px-2 py-3">Qty.</th>
                            <th scope="col" className="px-2 py-3">Unit Price</th>
                            <th scope="col" className="px-2 py-3">Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchase?.items.map((item, index) => (
                            <tr key={index} className="bg-white border-b">
                              <th scope="row" className="px-2 py-4 text-xs text-gray-900 whitespace-nowrap">
                                {item.name}
                              </th>
                              <td className="px-2 py-4 text-xs">
                                {item.itemId}
                              </td>
                              <td className="px-2 py-4 text-xs">
                                {item.quantity}
                              </td>
                              <td className="px-2 py-4 text-xs">
                                ₹{item.billPartPrice.toFixed(2)}
                              </td>
                              <td className="px-2 py-4 text-xs">
                                ₹{(item.billPartPrice * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => generatePDF(purchase)} className="inline-flex font-bold mt-5 items-center px-3 py-2 text-sm text-white bg-red-700 rounded-lg hover:bg-red-800">
                      View PDF
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "Transport Info" && (
                <div className="mt-6">
                  <h3 className="text-md font-bold text-gray-600 mb-2">Transport Information</h3>
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 font-semibold">
                      Transportation Charges: ₹{purchase.totals.transportationCharges.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1 text-gray-500 font-semibold">
                      Unloading Charge: ₹{purchase.totals.unloadingCharge.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1 text-gray-500 font-semibold">
                      Insurance: ₹{purchase.totals.insurance.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1 text-gray-500 font-semibold">
                      Damage Price: ₹{purchase.totals.damagePrice.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-800 font-semibold">
                      Total Other Expenses: ₹{purchase.totals.totalOtherExpenses.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-800 font-semibold">
                      Grand Total Purchase Amount: ₹{purchase.totals.grandTotalPurchaseAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>

        {purchases.length > 1 && (
          <div className="flex justify-center items-center mt-4">
            <button onClick={handlePreviousPage} disabled={currentPage === 1} className="bg-gray-500 text-xs text-white px-2 py-1 rounded-md font-bold disabled:opacity-50">Previous</button>
            <span className="text-sm font-bold text-gray-600 mx-5">Page {currentPage} of {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="bg-red-500 text-xs text-white px-2 py-1 rounded-md font-bold disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseInfo;
