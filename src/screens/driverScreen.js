import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const limit = 6;
  const [oneItem, setOneItem] = useState(false);
  const [isSingleBill, setIsSingleBill] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isfetchError, setFetchError]= useState(null);


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
      const { data } = await axios.get(`/api/billing/${billId}`);
      setBillings([data]);
      setIsSingleBill(true);
      setNewDeliveryStatus(data.billings.product.deliveryStatus)
      setNewPaymentStatus(data.billings.product.paymentStatus)
    } catch (error) {
      console.error("Error fetching bill by ID:", error);
      setError("Error fetching the specific bill.");
    }
  };

  const fetchBillings = async () => {
    try {
      const response = await axios.get(
        `/api/billing/driver/?page=${currentPage || 0}&limit=${limit || 3}`
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
      setFetchError(null)
      if (searchTerm) {
        try {
          const response = await axios.get(
            `/api/billing/billing/suggestions?search=${searchTerm}`
          );
          setSuggestions(response.data);
          if(response.data.length === 0){
          setFetchError("No Suggestions Found")
          }
        } catch (error) {
          setFetchError("Error Occured")
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  const getBillInfo = async (id) => {
    try {
      const { data } = await axios.get(`/api/billing/${id}`);
      setBillings(data);
      setSuggestions([]);
      setOneItem(true);
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
      await axios.put(`/api/billing/driver/billings/${selectedBilling._id}`, {
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
    setOneItem(false);
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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);


  const generatePDF = (billing) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Set color to a shade of red
    doc.setFont("Helvetica", "bold"); // Set font to bold
    doc.text('Invoice', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal"); // Reset to normal

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
        (product.price * product.quantity).toFixed(2) // Total price
      ]),
      startY: 105, // Position the table after invoice details
      theme: 'striped', // Optional: adds a striped theme to the table
      styles: {
        overflow: 'linebreak', // Allow line breaks
        cellWidth: 'auto', // Automatically adjust cell width
        fontSize: 10, // Adjust font size as needed
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Set specific widths for columns if needed
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
    const finalY = doc.autoTable.previous.finalY + 10; // Positioning based on previous table
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 14, finalY); // Add total amount

    // Finalize the PDF and download
    doc.save('invoice.pdf'); // Download the PDF
  };


  return (
    <div>

     <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Bill Informations For Drivers</p>
  </div>
  <i className="fa fa-list text-gray-500" />
</div> 





<div className="mb-5 flex justify-center">
        {/* Search Bar with Suggestions */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e)=> setSearchTerm(e.target.value)}
          placeholder="Search for a bill..."
          className="p-3 border-gray-200 text-sm focus:ring-red-500 focus:border-red-500 rounded-md shadow-sm w-full max-w-md"
        />
                <button onClick={(e)=>{ if(e.target.value.length === 0) setSearchTerm(' '); else setSearchTerm(e.target.value)}} class="text-white ml-2  end-2.5 bottom-2.5 bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"><i className="fa fa-search" /></button>

        {suggestions.length > 0 && (
          <ul className="bg-white mt-16 absolute divide-y w-full max-w-md mx-auto left-0 right-0 bg-white border border-gray-300 rounded-md  z-10 overflow-y-auto">
            {suggestions.map(suggestion => (
              <li key={suggestion._id} onClick={() =>{ navigate(`/driver/${suggestion._id}`); setSearchTerm('') }} className="p-3 flex text-sm justify-between cursor-pointer hover:bg-gray-100">
                <span><span className="font-bold text-gray-500">{suggestion.invoiceNo}</span> - {suggestion.customerName}</span>
                <i className="fa fa-arrow-right text-gray-300" />
              </li>
            ))}
          </ul>
        )}
        </div>
        {isfetchError && <p className="text-xs text-red-500 text-center">{isfetchError}.</p>}


      <div className="p-3">
        <div className="flex justify-between">
          {!isSingleBill && <h1 className="text-sm font-bold mb-6 truncate text-left text-gray-500">Billing Informations</h1>}
          {isSingleBill && <h1 onClick={() => handleSeeAllBills()} className="text-sm cursor-pointer truncate font-bold mb-6 text-left text-gray-500"><i className="fa fa-angle-left" /> See All Bills</h1>}
          <p className="text-gray-400 truncate font-bold text-sm text-left mb-4">
            {!oneItem && !isSingleBill ? `Total Bills: ${count}` : oneItem ? `Showing Bill Id: ${billings?.invoiceNo}` : `Showing Bill Id: ${isSingleBill ? billings[0]?.invoiceNo : ''}`}
          </p>
        </div>

       

<div className="relative overflow-x-auto shadow-md sm:rounded-lg">
   {billings.length > 1 && <table className="w-full text-sm divide-y text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-2 py-3 w-2">
                    Bill Id
                </th>
                <th scope="col" className="px-2 py-3 w-2">
                    Sts
                </th>
                <th scope="col" className="px-2 md:block hidden py-3 max-w-xs w-2">
                    Customer
                </th>
                <th scope="col" className="px-2 py-3 w-2">
                    Exp.Date
                </th>
                <th scope="col" className="px-2 py-3 w-2">
                  View                </th>
            </tr>
        </thead>
        <tbody>
          {billings.length > 1 ? (
            billings.map((bill)=>(
            <tr className="bg-white divide-x border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <th scope="row" className="px-2 py-2 text-xs font-bold text-gray-900 whitespace-nowrap dark:text-white">
                    {bill.invoiceNo}
                    </th>
                {/* <div className="absolute"> */}
                 <td className="px-2 py-2 text-red-500 cursor-pointer"> 
                     {/* Indicator Dot */}
  {bill.deliveryStatus === 'Delivered' && bill.paymentStatus === 'Paid' && (
    <div className="">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    </div>
  )}

  {bill.deliveryStatus === 'Delivered' && bill.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

  {bill.deliveryStatus !== 'Delivered' && bill.paymentStatus === 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
      </span>
    </div>
  )}

{bill.deliveryStatus !== 'Delivered' && bill.paymentStatus !== 'Paid' && (
    <div className="top-2 right-2">
      <span className="relative flex h-3 w-3 mx-auto">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    </div>
  )}
                </td>
                <td className="px-2 py-4 hidden md:block text-xs">
                    {bill.customerName}
                </td>
                <td className={`px-2 py-4 text-xs ${bill.deliveryStatus !== 'Delivered' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {bill.deliveryStatus === 'Delivered' ? 'Delivered'  : new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                </td>
                
                <td className="px-2 py-4 text-left">
                    <p onClick={()=> navigate(`/driver/${bill._id}`)} className="font-medium cursor-pointer text-red-600 dark:text-red-500 hover:underline">View</p>
                </td>
            </tr>
            ))
          )  :( " " )}
        </tbody>
    </table> }
    </div>

    <>

{ billings.length === 1 && 
  
  billings.map((bill)=>(
    
    <div className="md:w-3/6 mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
 <div className="flex justify-between">

  <a href="#">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{bill.invoiceNo}</h5>
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
  <p className={`mt-1 text-xs font-medium ${bill.deliveryStatus !== 'Delivered' ? 'text-red-400' : 'text-green-500'} `}>Delivery Sts: {bill.deliveryStatus}</p>
  <p className={`mt-1 text-xs font-medium ${bill.paymentStatus !== 'Paid' ? 'text-red-400' : 'text-green-500'} `}>Payment Sts: {bill.paymentStatus}</p>
  </div>

  <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Customer Addrs: {bill.customerAddress} , Kerala,India</p>
  <div className="flex justify-between">
  <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Products Qty: {bill.products.length}</p>
  <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Bill Amount: <span className="font-bold text-gray-500"> {bill.billingAmount} </span></p>
  </div>

  <div className="mx-auto my-8">


<div className="relative overflow-hidden">
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
            </tr>
        </thead>
        <tbody>
          {bill?.products.map((product,index)=>(
            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-2 py-4 text-xs font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {product.name}
               </th>
                <td className="px-6 text-center text-xs py-4">
                    {product.item_id}
                </td>
                <td className="px-6 text-xs py-4">
                    {product.quantity}
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
