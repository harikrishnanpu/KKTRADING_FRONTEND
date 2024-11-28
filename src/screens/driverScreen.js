import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from "./api";

const DriverPage = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const limit = 8;
  const [isSingleBill, setIsSingleBill] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isfetchError, setFetchError] = useState(null);
  const [activeSection, setActiveSection] = useState("Billing Details");

  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchBillById(id);
    } else {
      fetchBillings();
    }
  }, [id, currentPage]);

  const fetchBillById = async (billId) => {
    try {
      const { data } = await api.get(`/api/billing/${billId}`);
      setBillings([data]);
      setIsSingleBill(true);
      setNewDeliveryStatus(data.deliveryStatus);
      setNewPaymentStatus(data.paymentStatus);
    } catch (error) {
      console.error("Error fetching bill by ID:", error);
      setError("Error fetching the specific bill.");
    }
  };

  const fetchBillings = async () => {
    try {
      const response = await api.get(
        `/api/billing/driver/?page=${currentPage}&limit=${limit}`
      );
      setBillings(response.data.billings);
      setTotalPages(response.data.totalPages);
      setCount(response.data.totalbilling);
    } catch (error) {
      console.error("Error fetching billings:", error);
      setError("Error fetching billings");
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      setFetchError(null);
      if (searchTerm) {
        try {
          const response = await api.get(
            `/api/billing/billing/suggestions?search=${searchTerm}`
          );
          setSuggestions(response.data);
          if (response.data.length === 0) {
            setFetchError("No Suggestions Found");
          }
        } catch (error) {
          setFetchError("Error Occured");
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  const getBillInfo = async (id) => {
    try {
      const { data } = await api.get(`/api/billing/${id}`);
      setBillings([data]);
      setSuggestions([]);
    } catch (error) {
      console.error("Error occurred while fetching bill info");
      setSuggestions([]);
    }
  };

  const handleDetailClick = (billing) => {
    setSelectedBilling(billing);
    setNewDeliveryStatus(billing.deliveryStatus);
    setNewPaymentStatus(billing.paymentStatus);
    setError("");
  };

  const handleClose = () => {
    setSelectedBilling(null);
  };

  const handleUpdateStatus = async () => {
    if (!newDeliveryStatus || !newPaymentStatus) {
      setError("Please select both statuses.");
      return;
    }

    try {
      await api.put(`/api/billing/driver/billings/${selectedBilling._id}`, {
        deliveryStatus: newDeliveryStatus,
        paymentStatus: newPaymentStatus,
      });

      setBillings((prevBillings) =>
        prevBillings.map((bill) =>
          bill._id === selectedBilling._id
            ? {
                ...bill,
                deliveryStatus: newDeliveryStatus,
                paymentStatus: newPaymentStatus,
              }
            : bill
        )
      );
      setSelectedBilling(null);
      setSuccess("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Error updating status");
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSeeAllBills = () => {
    setIsSingleBill(false);
    setSelectedBilling(null);
    fetchBillings();
    navigate('/driver');
  };

  useEffect(() => {
    if (success) {
      setIsSuccessVisible(true);
      const timer = setTimeout(() => {
        setSuccess("");
        setIsSuccessVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      navigate(`/driver/${suggestions[selectedSuggestionIndex]._id}`);
      setSearchTerm('');
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  const generatePDF = (billing) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.setFont("Helvetica", "bold");
    doc.text('Invoice', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal");

    // Convert invoiceDate to Date object if it's a string
    const invoiceDate = new Date(billing.invoiceDate);

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice No: ${billing.invoiceNo}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Salesman Name: ${billing.salesmanName}`, 14, 60);

    // Add Billing To Section
    doc.setFontSize(14);
    doc.text('Bill To:', 14, 75);

    doc.setFontSize(12);
    doc.text(`Customer Name: ${billing.customerName}`, 14, 85);
    doc.text(`Customer Address: ${billing.customerAddress}`, 14, 95);

    // Start table for products
    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price', 'Total']],
      body: billing.products.map(product => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        product.price ? product.price.toFixed(2) : '0.00',
        (product.price * product.quantity).toFixed(2)
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
        4: { cellWidth: 30 },
      },
    });

    // Calculate total
    const total = billing.products.reduce((sum, product) => {
      return sum + (product.price * product.quantity || 0);
    }, 0);

    // Add Total Section
    const finalY = doc.autoTable.previous.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 14, finalY);

    // Finalize the PDF and download
    doc.save('invoice.pdf');
  };


  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-4 rounded-lg mb-4">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Bill Informations For Drivers</p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

   {billings.length > 1 &&  <div className="mb-5 flex justify-center relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSuggestionKeyDown}
          placeholder="Search for a bill..."
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
                  navigate(`/driver/${suggestion._id}`);
                  setSearchTerm('');
                  setSuggestions([]);
                }}
                className={`p-3 flex text-sm justify-between cursor-pointer hover:bg-gray-100 ${index === selectedSuggestionIndex ? 'bg-gray-200' : ''}`}
              >
                <span><span className="font-bold text-gray-500">{suggestion.invoiceNo}</span> - {suggestion.customerName}</span>
                <i className="fa fa-arrow-right text-gray-300" />
              </li>
            ))}
          </ul>
        )}
      </div> }
      {isfetchError && <p className="text-xs text-red-500 text-center">{isfetchError}.</p>}

      <div className="p-3">
        <div className="flex justify-between">
          {!isSingleBill && <h1 className="text-sm font-bold mb-6 truncate text-left text-gray-500">Billing Informations</h1>}
          {isSingleBill && <h1 onClick={() => handleSeeAllBills()} className="text-sm cursor-pointer truncate font-bold mb-6 text-left text-gray-500"><i className="fa fa-angle-left" /> See All Bills</h1>}
          <p className="text-gray-400 truncate font-bold text-sm text-left mb-4">
            {!isSingleBill ? `Total Bills: ${count}` : `Showing Bill Id: ${billings[0]?.invoiceNo}`}
          </p>
        </div>


        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          {billings.length > 1 && (
            <table className="min-w-full text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Bill ID</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold md:block hidden">Customer</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Exp. Date</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">View</th>
                </tr>
              </thead>
              <tbody>
                {billings.map((bill) => (
                  <tr key={bill._id} className="bg-white border-b hover:bg-gray-100">
                    <td className="px-4 py-3 text-xs  text-gray-900 whitespace-nowrap">{bill.invoiceNo}</td>
                    <td className="px-4 py-3">
                      {/* Indicator Dot */}
                      {bill.deliveryStatus === 'Delivered' && bill.paymentStatus === 'Paid' && (
                        <div className="flex items-center justify-center">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        </div>
                      )}
                      {bill.deliveryStatus === 'Delivered' && bill.paymentStatus !== 'Paid' && (
                        <div className="flex items-center justify-center">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                        </div>
                      )}
                      {bill.deliveryStatus !== 'Delivered' && bill.paymentStatus === 'Paid' && (
                        <div className="flex items-center justify-center">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                        </div>
                      )}
                      {bill.deliveryStatus !== 'Delivered' && bill.paymentStatus !== 'Paid' && (
                        <div className="flex items-center justify-center">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:block text-xs text-gray-700">{bill.customerName}</td>
                    <td className={`px-4 py-3 text-xs ${bill.deliveryStatus !== 'Delivered' ? 'text-yellow-600' : 'text-green-600'}`}>{bill.deliveryStatus === 'Delivered' ? 'Delivered' : new Date(bill.expectedDeliveryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-left">
                      <button onClick={() => navigate(`/driver/${bill._id}`)} className=" text-red-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>


    <>

{ billings.length === 1 && 
  
  billings.map((bill)=>(
    
    <div className="max-w-2xl mx-auto  p-5 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">

<div className="flex justify-center gap-8">
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "Billing Details" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("Billing Details")}
        >
          Billing Details
          {activeSection === "Billing Details" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "allpayments" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("allpayments")}
        >
          All Payments 
          {activeSection === "allpayments" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>

        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "delivery" ? "text-red-600 border-b-2 border-red-600" : "text-gray-600"
          }`}
          onClick={() => setActiveSection("delivery")}
        >
           Delivery
          {activeSection === "delivery" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div>


      {activeSection === "Billing Details" && (
        <div className="pt-8">
 <div className="flex justify-between">

  <a href="#">
      <h5 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{bill.invoiceNo}</h5>
  </a>



          {/* Indicator Dot */}
          {bill.deliveryStatus === 'Delivered' && bill.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {bill.deliveryStatus === 'Delivered' && bill.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {bill.deliveryStatus !== 'Delivered' && bill.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{bill.deliveryStatus !== 'Delivered' && bill.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}

 </div>
  <div className="flex justify-between">
  <p className="mt-1 text-xs truncate font-bold text-gray-600 dark:text-gray-400">Customer: {bill.customerName}</p>
  <p className="mt-1 text-xs truncate font-normal text-gray-700 dark:text-gray-400">Exp. DeliveryDate: {new Date(bill.expectedDeliveryDate).toLocaleDateString()}</p>
  </div>
  <div className="flex justify-between">
  <p className={`mt-1 text-xs font-bold ${bill.deliveryStatus !== 'Delivered' ? 'text-red-400' : 'text-green-500'} `}>Delivery Sts: {bill.deliveryStatus}</p>
  <p className={`mt-1 text-xs font-bold ${bill.paymentStatus !== 'Paid' ? 'text-red-400' : 'text-green-500'} `}>Payment Sts: {bill.paymentStatus}</p>
  </div>

  <p className="mt-1 text-xs  text-gray-600 dark:text-gray-400">Customer Address: {bill.customerAddress}, Kerala,India</p>
  <div className="flex justify-between">
  <p className="mt-1 text-xs  text-gray-600 dark:text-gray-400">Products Qty: {bill.products.length}</p>
  </div>
<div>
  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Discount: <span className="font-bold text-gray-500">Rs. {bill.discount} </span></p>
  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Bill Amount: <span className="font-bold text-gray-500">Rs. {bill.billingAmount} </span></p>

  <p className="mt-1 text-sm font-bold text-gray-600 dark:text-gray-400">Grand Total Amount: <span className="font-bold text-gray-500">Rs. {bill.grandTotal} </span></p>
  </div>

  <div className="flex justify-between mt-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">
                   Total Amount:
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    ₹{(bill.grandTotal)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">
                    Received:
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ₹
                    {bill.billingAmountReceived}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">
                    Remaining:
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    ₹{parseFloat(bill.grandTotal) -  parseFloat((bill.payments
                      .reduce((sum, payment) => sum + payment.amount, 0)
                      .toFixed(2))).toFixed(2)}
                  </span>
                </div>
              </div>
  <div className="mx-auto my-8">


<div className="relative overflow-hidden">
  <p className="font-bold mb-4 text-sm">Total Products: {bill.products?.length}</p>
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs rounded-lg text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-4 text-xs py-3">
                    Product
                </th>
                <th scope="col" className="px-2 text-center text-xs py-3">
                  ID
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                  Qty.
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                  Deliv. Qty
                </th>
                <th scope="col" className="px-2 text-xs py-3">
                Sts
                </th>
            </tr>
        </thead>
        <tbody>
          {bill?.products.map((product,index)=>(
            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-2 py-4 text-xs  text-gray-900 whitespace-nowrap dark:text-white">
                    {product.name.slice(0,14)}...
               </th>
                <td className="px-6 text-center text-xs py-4">
                    {product.item_id}
                </td>
                <td className="px-2 text-xs py-4">
                    {product.quantity}
                </td>
                <td className="px-2 text-xs py-4">
                    {product.deliveredQuantity}
                </td>
                <td className="px-2 text-xs py-4">
                            <input
                              type="checkbox"
                              className="text-green-500 focus:ring-0 focus:outline-0 focus:border-0"
                              checked={product.deliveryStatus === "Delivered"}
                            />
                </td>
            </tr> 
          ))
}

        </tbody>
    </table>
</div>

  </div>

<div className="flex justify-between">

  <p onClick={()=> handleDetailClick(bill)} className="inline-flex font-bold mt-5 items-center cursor-pointer px-3 py-2 text-sm text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">
      Edit Details
      <svg className="rtl:rotate-180 w-3.5 h-3.5 mt-1 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
      </svg>
  </p>

  <p onClick={()=> generatePDF(bill)} className="inline-flex font-bold mt-5 items-center cursor-pointer px-3 py-2 text-sm text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">
      View Pdf
  </p>
</div>
</div>
      )}


{activeSection === "allpayments" && (
<div>

<div className="mt-6">
    <h3 className="text-md font-bold text-gray-600 mb-2">All Payment Transactions</h3>


    <div className="mt-4 border-t border-gray-200 pt-4">
      <p className="text-xs text-gray-500 font-semibold">
        Total Fuel Expenses: Rs. {bill.fuelCharge.toFixed(2)}
      </p>
      <p className="text-xs mt-1 text-gray-500 font-semibold">
        Total Other Expenses: Rs. {bill.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
      </p>
      <p className="text-xs mt-1 text-gray-500 font-semibold">
        Grand Total (Fuel + Other Expenses): Rs.
        {(
          bill.fuelCharge +
          (bill.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)
        ).toFixed(2)}
      </p>
    </div>

    {/* Payment Summary Section */}
    <div className="mt-4 border-t border-b pb-8 border-gray-200 pt-4">
      <h4 className="text-md font-bold text-gray-700">Payment Summary</h4>

      {/* Total Payments In */}
      <p className="text-xs mt-2 text-gray-500 font-semibold">
        Total Payments In: Rs.
        {bill.payments?.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
      </p>

      {/* Net Balance (Total In - Total Out) */}
      <p className="text-xs mt-1 text-gray-500 font-semibold">
        Net Balance (In - Expenses): Rs.
        {(
          bill.payments?.reduce((sum, payment) => sum + payment.amount, 0) -
          (bill.fuelCharge +
            (bill.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0))
        ).toFixed(2)}
      </p>
    </div>
    
    <p className="text-sm font-bold text-gray-600 mt-4 mb-2">Transactions</p>
    {/* List of payments */}
    <ul className="divide-y divide-gray-200 mb-4">
      {bill.payments?.map((payment, index) => (
        <li key={index} className="py-2">
          <p className="text-sm text-gray-700 font-semibold">
            {payment.method}: Rs. {payment.amount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(payment.date).toLocaleDateString()}
          </p>
        </li>
      ))}
    </ul>

    {/* Fuel Charge */}
    <div className="py-2 border-t border-gray-200">
      <p className="text-sm text-gray-700 font-semibold">
        Fuel Charge: Rs. {bill.fuelCharge.toFixed(2)}
      </p>
    </div>

    {/* Other Expenses */}
    <div className="mt-4">
      <h4 className="text-sm font-bold text-gray-600 mb-2">Other Expenses</h4>
      <ul className="divide-y divide-gray-200">
        {bill?.otherExpenses?.map((expense, index) => (
          <li key={index} className="py-2">
            <p className="text-sm text-gray-700 font-semibold">
              Rs. {expense.amount.toFixed(2)} - {expense.remark}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(expense.date).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>

    {/* Total for Fuel and Other Expenses */}
    <div className="mt-4 border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-800 font-semibold">
        Total Other Expenses: Rs.
        {bill?.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
      </p>
      <p className="text-sm text-gray-800 font-semibold">
        Grand Total (Fuel + Other Expenses): Rs.
        {(
          bill?.fuelCharge +
          (bill.otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)
        ).toFixed(2)}
      </p>
    </div>
  </div>

  </div> )}

{activeSection === "delivery" && (
  <div className="rounded-lg">
{bill?.deliveries?.map((delivery) => (
  <div className="my-5 bg-gray-50 p-3 rounded-lg">
      <div key={delivery.deliveryId} className="mt-2 space-y-3">
      <p className="text-sm  text-gray-700">
        <strong>Driver Name:</strong> {delivery.driverName}
      </p>
      <p className="text-xs truncate  text-gray-700">
        <strong>Delivery Id: </strong> {delivery.deliveryId}
      </p>
    
      <div className='flex justify-between'>
      <p className="text-xs  text-gray-700">
        <strong>Fuel Charge:</strong> ₹{delivery.fuelCharge || 0}
      </p>
      <p className="text-xs  text-gray-700">
        <strong>Starting Km: </strong> {delivery.startingKm || 0}
      </p>
      </div>
      <div className='flex justify-between'>
      <p className="text-xs  text-gray-700">
        <strong>Ending Km:</strong> {delivery.endKm || 0}
      </p>
      <p className="text-xs font-bold text-gray-700">
        <strong>Total Distance Km:</strong> {delivery.kmTravelled || 0}
      </p>
      </div>
      {delivery.otherExpenses?.length > 0 && (
        <p className="text-xs  text-gray-700 mt-2">
          <strong>Other Expenses:</strong>{" "}
          {delivery.otherExpenses.map((expense, index) => (
            <span key={index}>
              ₹{expense.amount} ({expense.remark})
              {index < delivery.otherExpenses.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>

      )}
    </div>


<div>
  </div>
  {delivery.productsDelivered?.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-bold text-red-600 mb-2">Products Delivered:</h5>
            <table className="w-full text-xs text-left text-red-500">
              <thead className="text-xs text-gray-700 uppercase bg-red-100">
                <tr>
                  <th className="px-2 py-1">Product ID</th>
                  <th className="px-2 py-1">Delivered Qty</th>
                </tr>
              </thead>
              <tbody>
                {delivery.productsDelivered.map((prod, idx) => (
                  <tr key={idx} className="bg-white border-b hover:bg-red-50">
                    <td className="px-2 py-1">{prod.item_id}</td>
                    <td className="px-2 py-1">{prod.deliveredQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
  </div>


                ))}

  </div>
)}




</div>

))

}

</>

        {selectedBilling && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 md:w-1/3">
             <div className="flex justify-between mb-5">
              <h2 className="text-sm font-semibold mb-2 text-gray-300">Edit Sales Bill</h2>
              <p className="text-sm font-bold text-gray-500">Bill No: {selectedBilling.invoiceNo}</p>
              </div>
              <div className="mb-4">
                <label htmlFor="deliveryStatus" className="block text-sm font-bold mb-1">Delivery Status</label>
                <select value={newDeliveryStatus} onChange={(e) => setNewDeliveryStatus(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500">
                  <option value="">Select Delivery Status</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="paymentStatus" className="block text-sm font-bold mb-1">Payment Status</label>
                <select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500">
                  <option value="">Select Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              <div className="flex items-center mt-4 space-x-2">
                <button onClick={handleUpdateStatus} className="bg-red-600 text-white py-2 px-4 rounded-md font-bold hover:bg-red-600">Update</button>
                <button onClick={handleClose} className="bg-gray-400 text-white py-2 px-4 rounded-md font-bold hover:bg-gray-500">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isSuccessVisible && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-md z-50 text-sm">
            {success}
          </div>
        )}
      </div>

      {billings.length > 1 && <div className="flex justify-center items-center mt-4">
        <button onClick={handlePreviousPage} disabled={currentPage === 1} className="bg-gray-500 text-xs text-white px-2 py-1 rounded-md font-bold disabled:opacity-50">Previous</button>
        <span className="text-sm font-bold text-gray-600 mx-5">Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages} className="bg-red-500 text-xs text-white px-2 py-1 rounded-md font-bold disabled:opacity-50">Next</button>
      </div>
      }
    </div>
  );
};

export default DriverPage;
