import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SuccessModal from '../components/successModal';
import SummaryModal from '../components/SummaryModal';
import OutOfStockModal from '../components/itemAddingModal';
import api from './api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function EditBillScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Billing Information States
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('Pending');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerContactNumber, setCustomerContactNumber] = useState('');
  const [marketedBy, setMarketedBy] = useState('');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [receivedDate, setReceivedDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Product Information States
  const [itemId, setItemId] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('NOS');
  const [sellingPrice, setSellingPrice] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [filterText, setFilterText] = useState('');
  const [fetchQuantity, setFetchQuantity] = useState(0);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outofStockProduct, setOutofstockProduct] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [salesmanPhoneNumber, setSalesmanPhoneNumber] = useState('');
  const [salesmen, setSalesmen] = useState([]);

  // Summary Modal States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [amountWithoutGST, setAmountWithoutGST] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  // Stepper Control
  const [step, setStep] = useState(1);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const outofStockRef = useRef();
  const sellingPriceRef = useRef();

  // Refs for Input Navigation
  const itemIdRef = useRef();
  const itemQuantityRef = useRef();
  const invoiceNoRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();
  const customerContactNumberRef = useRef();
  const marketedByRef = useRef();
  const discountRef = useRef();
  const receivedAmountRef = useRef();
  const receivedDateRef = useRef();
  const paymentMethodRef = useRef();
  const invoiceDateRef = useRef();
  const salesmanNameRef = useRef();
  const expectedDeliveryDateRef = useRef();


  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const { data } = await api.get('/api/users/salesmen/all'); // Adjust the API endpoint as needed
        setSalesmen(data);
      } catch (error) {
        console.error('Error fetching salesmen:', error);
      }
    };
    fetchSalesmen();
  }, []);


  const handleSalesmanChange = (e) => {
    const selectedName = e.target.value;
    setSalesmanName(selectedName);

    // Find the contact number for the selected salesman
    const selectedSalesman = salesmen.find(
      (salesman) => salesman.name === selectedName
    );
    if (selectedSalesman) {
      if(selectedSalesman.contactNumber){
        setSalesmanPhoneNumber(selectedSalesman.contactNumber);
      }else{
        setSalesmanPhoneNumber('');
      }
    }

  };


  useEffect(() => {
    if (selectedProduct) {
      if (unit === 'SQFT') {
        const quantity = selectedProduct.countInStock;
        const adjustedQuantity = (parseFloat(quantity) * parseFloat(selectedProduct.length * selectedProduct.breadth)).toFixed(2);
        setFetchQuantity(adjustedQuantity);
        setQuantity(0);
      } else if (unit === 'BOX') {
        const quantity = selectedProduct.countInStock;
        const adjustedQuantity = (parseFloat(quantity) / parseFloat(selectedProduct.psRatio)).toFixed(2);
        setFetchQuantity(adjustedQuantity);
        setQuantity(0);
      } else {
        const quantity = selectedProduct.countInStock;
        setFetchQuantity(quantity);
        setQuantity(0);
      }
    }
  }, [unit, selectedProduct]);


  const formatDateTimeLocal = (date) => {
    const pad = (num) => String(num).padStart(2, '0');
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1); // Months are zero-based
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch Billing Details
  useEffect(() => {
    const fetchBillingDetails = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/api/billing/${id}`);
        setInvoiceNo(data.invoiceNo);
        setInvoiceDate(new Date(data.invoiceDate).toISOString().split('T')[0]);

  // Format expectedDeliveryDate to 'YYYY-MM-DDTHH:MM' in local timezone
  const formattedExpectedDeliveryDate = formatDateTimeLocal(data.expectedDeliveryDate);
  setExpectedDeliveryDate(formattedExpectedDeliveryDate);

        setReceivedDate(new Date(data.paymentReceivedDate || new Date()).toISOString().split('T')[0]);
        setDeliveryStatus(data.deliveryStatus);
        setPaymentStatus(data.paymentStatus);
        setCustomerName(data.customerName);
        setCustomerAddress(data.customerAddress);
        setCustomerContactNumber(data.customerContactNumber);
        setMarketedBy(data.marketedBy);
        setDiscount(data.discount);
        setReceivedAmount(data.billingAmountReceived);
        setProducts(data.products);
        setSalesmanName(data.salesmanName);
        
        // Find the contact number for the selected salesman
        const selectedSalesman = salesmen.find(
          (salesman) => salesman.name === data.salesmanName
        );
        if (selectedSalesman && selectedSalesman.contactNumber) {
          setSalesmanPhoneNumber(selectedSalesman.contactNumber);
        } else {
          setSalesmanPhoneNumber('');
        }
      } catch (error) {
        console.error('Error fetching billing details:', error);
        setError('Failed to fetch billing information.');
      } finally {
        setIsLoading(false);
      }
    };
  
    if (id && salesmen.length > 0) {
      fetchBillingDetails();
    }
  }, [id, salesmen]);
  

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  }, [error]);

  // Fetch Suggestions for Item ID
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (itemId.length >= 2) {
        try {
          const { data } = await api.get(`/api/products/search/itemId?query=${itemId}`);
          setSuggestions(data);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setError('Error fetching product suggestions.');
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [itemId]);

  const addProductByItemId = async (product) => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);

      if (data.countInStock <= 0) {
        setOutofstockProduct(data);
        setQuantity(1);
        setItemId('');
        setSuggestions([]);
        setShowOutOfStockModal(true);
        outofStockRef.current?.focus();
        return;
      }

      setSelectedProduct(data);
      setQuantity(1);
      setSellingPrice(data.price);
      setFetchQuantity(data.countInStock);
      itemQuantityRef.current?.focus();
      setItemId('');
      setSuggestions([]);
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Product not found or server error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (index, field, value) => {
    const updatedProducts = [...products];
    const product = updatedProducts[index];
    const parsedValue = parseFloat(value) || 0;
  
    // Helper function to safely parse and multiply values
    const safeMultiply = (a, b) => (a && b ? parseFloat(a) * parseFloat(b) : 0);
  
    // Calculate area if length and breadth are present
    const area = safeMultiply(product.length, product.breadth)
  
    // Handle changes to enteredQty field
    if (field === 'enteredQty') {
      if (product.unit === 'SQFT' && area > 0) {
        // Calculate quantity based on area for 'SQFT'
        product.quantity = parsedValue / area;
      } else if (product.unit === 'BOX' && product.psRatio) {
        // Calculate quantity for 'BOX'
        product.quantity = parsedValue * parseFloat(product.psRatio);
      } else if (product.unit === 'TNOS') {
        // For 'TNOS', quantity is directly the enteredQty value
        product.quantity = parsedValue;
      } else {
        // For other units, use the enteredQty directly
        product.quantity = parsedValue;
      }
      product[field] = parsedValue;
  
    } else if (field === 'sellingPrice') {
      // Handle changes to sellingPrice
      product[field] = parsedValue;
  
      if (product.unit === 'BOX' && area > 0) {
        product.sellingPriceinQty = parsedValue * area;
      } else if (product.unit === 'TNOS' && area > 0) {
        product.sellingPriceinQty = parsedValue * area;
      } else if (product.unit === 'SQFT' && area > 0) {
        product.sellingPriceinQty = parsedValue * area;
      } else {
        product.sellingPriceinQty = parsedValue;
      }
  
    } else {
      // Handle changes to other fields
      product[field] = parsedValue;
    }
  
    // Update the products state
    setProducts(updatedProducts);
  };
  


  const handleAddProductWithQuantity = () => {
    // Check if a product is selected
    if (!selectedProduct) {
      setError('No product selected.');
      return;
    }

    // Validate quantity
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    // Validate selling price
    const parsedSellingPrice = parseFloat(sellingPrice);
    if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
      setError('Please enter a valid selling price.');
      return;
    }

    // Extract product details for calculations
    const productLength = parseFloat(selectedProduct.length || 0);
    const productBreadth = parseFloat(selectedProduct.breadth || 0);
    const productSize = parseFloat(selectedProduct.size || 0);
    const productPsRatio = parseFloat(selectedProduct.psRatio || 0);

    let adjustedQuantity = parsedQuantity;
    let adjustedSellingPrice = parsedSellingPrice;

    // Calculate Adjusted Quantity and Selling Price based on the Unit
    if (unit === 'SQFT' && productLength && productBreadth) {
      const area = productLength * productBreadth;
      if (area > 0) {
        adjustedQuantity = parsedQuantity / area;
        adjustedSellingPrice = parsedSellingPrice * area;
      }
    } else if (unit === 'BOX' && productSize && productPsRatio && productLength && productBreadth) {
      const areaPerBox = productLength * productBreadth;
      adjustedQuantity = parsedQuantity * productPsRatio;
      adjustedSellingPrice = parsedSellingPrice * areaPerBox;
    } else if (unit === 'TNOS' && productLength && productBreadth) {
      const areaPerTnos = productLength * productBreadth;
      adjustedSellingPrice = parsedSellingPrice * areaPerTnos;
    }

    // Check if the product is already added to avoid duplicates
    if (products.some((product) => product.item_id === selectedProduct.item_id)) {
      setError('This product is already added. Adjust the quantity instead.');
      return;
    }

    // Add product to the list with adjusted details
    const productWithDetails = {
      ...selectedProduct,
      quantity: adjustedQuantity,
      enteredQty: parsedQuantity,
      unit,
      sellingPrice: parsedSellingPrice,
      sellingPriceinQty: adjustedSellingPrice,
    };

    const updatedProducts = [productWithDetails, ...products];
    setProducts(updatedProducts); 

    // Save updated products to local storag

    // Focus on the next item input
    itemIdRef.current?.focus();

    // Reset Fields
    setSelectedProduct(null);
    setQuantity(1);
    setUnit('NOS');
    setSellingPrice('');
    setError('');
  };

  const deleteProduct = (indexToDelete) => {
    setProducts(products.filter((_, index) => index !== indexToDelete));
  };

  const handleBillingSubmit = () => {
    if (
      !customerName ||
      !customerAddress ||
      !invoiceNo ||
      !expectedDeliveryDate ||
      !salesmanName ||
      products.length === 0
    ) {
      setError('Please fill all required fields and add at least one product.');
      return;
    }

    const totalAmount = calculateTotalAmount();
    const amountWithoutGST = totalAmount / 1.18;
    const gstAmount = totalAmount - amountWithoutGST;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    setAmountWithoutGST(amountWithoutGST);
    setCgst(cgst);
    setSgst(sgst);
    setShowSummaryModal(true);

  };

  const submitBillingData = async () => {
    setIsSubmitting(true);
    setError('');
    console.log(products)

    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      billingAmount: totalAmount,
      cgst,
      sgst,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      discount,
      products: products.map((product) => ({
        item_id: product.item_id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        sellingPrice: product.sellingPrice,
        enteredQty: product.enteredQty,
        sellingPriceinQty: product.sellingPriceinQty,
        unit: product.unit,
        length: product.length,
        breadth: product.breadth,
        size: product.size,
        psRatio: product.psRatio,
      })),
    };

    try {
      const response = await api.post(`/api/billing/edit/${id}`, billingData);
      console.log('Billing Response:', response.data);
      alert('Billing data submitted successfully!');
      navigate('/bills');
    } catch (error) {
      console.error('Error submitting billing data:', error);
      setError('There was an error submitting the billing data. Please try again.');
      alert('There was an error submitting the billing data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalAmount = () => {
    return products.reduce(
      (acc, product) => acc + product.quantity * product.sellingPriceinQty,
      0
    );
  };

  const totalAmount = calculateTotalAmount();

  const handleproductUpdate = (updatedProduct) => {
    const updatedProductsList = products.map((product) =>
      product._id === updatedProduct._id ? updatedProduct : product
    );
    setProducts(updatedProductsList);
    setShowOutOfStockModal(false);
    setOutofstockProduct(null);
  };




  function changeRef(e, nextRef) {
    if (e.key === 'Enter') { 
      e.preventDefault();
        if(nextRef === salesmanNameRef || nextRef === invoiceDateRef || nextRef === itemIdRef) {
        setStep((prevStep) => prevStep + 1);
        nextRef?.current?.focus();
      } else {
        nextRef?.current?.focus();
      }
    } 
  }

  useEffect(() => {
    if (step === 2) {
      salesmanNameRef.current?.focus();
    } else if (step === 3) {
      invoiceDateRef.current?.focus();
    } else if (step === 4) {
      itemIdRef.current?.focus();
    }
  }, [step]);


  const handleStockproductUpdate = async (newQ,product)=> {
    if(newQ){
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);
      if(newQ && data.countInStock){
        setSelectedProduct(data);
        setQuantity(1);
        setSellingPrice(data.price); 
        setFetchQuantity(data.countInStock);
        itemQuantityRef.current?.focus();
        setItemId('');
        setSuggestions([]);
      }else{
        alert("Error Occured In Updating the Stock")
      }
    }
  }


  function printInvoice() {

    const formData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      salesmanPhoneNumber,
      paymentStatus,
      billingAmount: totalAmount - discount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      subTotal: totalAmount - (cgst + sgst),
      cgst,
      sgst,
      discount,
      products: products.map((product) => ({
        item_id: product.item_id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        sellingPrice: product.sellingPrice,
        enteredQty: product.enteredQty,
        sellingPriceinQty: product.sellingPriceinQty,
        unit: product.unit,
        size: product.size
      })),
    };

    api.post('https://kktrading-backend.vercel.app/generate-invoice-html', formData)
    .then(response => {
      const htmlContent = response.data; // Extract the HTML content
      const printWindow = window.open('', '', 'height=800,width=600');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
  }

  return (
    <div className="container mx-auto p-2">
      {/* Header */}
      <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4">
        <div onClick={() => navigate('/')} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Billing Edit and Update</p>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="max-w-sm mx-auto">
          <div className="font-bold bg-gray-300 px-4 py-2 rounded-lg text-gray-600 text-xs animate-pulse">Loading...</div>
        </div>
      )}

      {/* Main Form */}
      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-4">
        {/* Form Header */}
        <div className="flex justify-between mb-4">
          <p className="text-sm font-bold mb-5 text-gray-500">
            <i className="fa fa-list" /> Editing Billing
          </p>
          <div className="text-right">
          <button
              onClick={()=> printInvoice()}
              className="mb-2 mx-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600"
            >
              <i className='fa fa-print' />
            </button>
            <button
              onClick={handleBillingSubmit}
              className="mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600"
            >
              Submit
            </button>
            <p className="text-xs text-gray-400">
              Fill all fields before submission
            </p>
          </div>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">Customer Information</h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice No</label>
              <input
                type="text"
                ref={invoiceNoRef}
                value={invoiceNo}
                onKeyDown={(e)=> changeRef(e, customerNameRef)}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Invoice No"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Name</label>
              <input
                type="text"
                ref={customerNameRef}
                value={customerName}
                onKeyDown={(e)=> changeRef(e, customerContactNumberRef)}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Customer Name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Contact Number</label>
              <input
                type="number"
                ref={customerContactNumberRef}
                placeholder="Enter Customer Number"
                value={customerContactNumber}
                onKeyDown={(e)=> changeRef(e, customerAddressRef)}
                onChange={(e) => setCustomerContactNumber(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Address</label>
              <textarea
                value={customerAddress}
                ref={customerAddressRef}
                onKeyDown={(e)=> changeRef(e, salesmanNameRef)}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Enter Customer Address"
              />
            </div>
          </div>
        )}

        {/* Step 2: Salesman Information */}
        {step === 2 && (
  <div className="mb-4">
  <label className="block text-gray-700 text-xs">Salesman Name</label>
  <select
    value={salesmanName}
    ref={salesmanNameRef}
    onKeyDown={(e)=> changeRef(e, invoiceDateRef)}
    onChange={(e)=> { setSalesmanPhoneNumber('') ; handleSalesmanChange(e) }}
    className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
  >
    <option value="">Select Salesman</option>
    {salesmen.map((salesman) => (
      <option key={salesman._id} value={salesman.name}>
        {salesman.name}
      </option>
    ))}
  </select>

  {salesmanName && (
    <div className="mt-4">
      <label className="block text-gray-700 text-xs">Salesman Phone Number</label>
      <input
        type="text"
        value={salesmanPhoneNumber}
        onChange={(e) => setSalesmanPhoneNumber(e.target.value)}
        className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
        placeholder="Salesman Phone Number"
      />
    </div>
  )}
</div>
        )}

        {/* Step 3: Payment and Delivery Information */}
        {step === 3 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">Delivery Information</h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice Date</label>
              <input
                type="date"
                ref={invoiceDateRef}
                value={invoiceDate}
                onKeyDown={(e)=> changeRef(e, expectedDeliveryDateRef)}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Expected Delivery Date</label>
              <input
                type="datetime-local"
                ref={expectedDeliveryDateRef}
                value={expectedDeliveryDate}
                onKeyDown={(e)=> changeRef(e, marketedByRef)}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Marketed By</label>
              <input
                value={marketedBy}
                ref={marketedByRef}
                onKeyDown={(e)=> changeRef(e, itemIdRef)}
                onChange={(e) => setMarketedBy(e.target.value)}
                className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Marketed by"
              />
            </div>
          </div>
        )}

        {/* Step 4: Add Products */}
        {step === 4 && (
          <div className="mb-6">
            {/* Display Total Amount */}
            <div className="mb-4 bg-gray-100 flex justify-between items-center text-center rounded-lg p-5">
              <div className='text-gray-600'>
                <p className='text-sm font-bold'>Total</p>
                <p className='text-sm font-bold'>Bill Amount:</p>
                <p className='text-xs font-bold'></p>
              </div>
              <h2 className="text-md font-bold text-gray-700">
                INR. {(totalAmount - discount).toFixed(2)}
                <p className='font-bold' style={{ fontSize: '9px' }}>Discount: {parseFloat(discount || 0)?.toFixed(2)}</p>
              </h2>
            </div>

            <div>
              {/* Item ID Input */}
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-bold ml-1">
                  Item ID
                </label>
                <input
                  type="text"
                  ref={itemIdRef}
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) =>
                        prev > 0 ? prev - 1 : prev
                      );
                    } else if (e.key === 'Enter') {
                      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                        e.preventDefault();
                        addProductByItemId(suggestions[selectedSuggestionIndex]);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 mt-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                  placeholder="Enter Item ID or Name"
                />
                {error && <p className="text-red-500 mt-1 text-xs">{error}</p>}

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="mt-2 bg-white border rounded-md max-h-60 divide-y overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => addProductByItemId(suggestion)}
                        className={`p-4 text-xs cursor-pointer hover:bg-gray-100 ${
                          index === selectedSuggestionIndex ? 'bg-gray-200' : ''
                        }`}
                      >
                        {suggestion.name} - {suggestion.item_id}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Product Details */}
              {selectedProduct && (
                <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white mb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold truncate">
                      {selectedProduct.name.slice(0, 25)}... ID: {selectedProduct.item_id}
                    </p>
                    <p
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        fetchQuantity > 10
                          ? 'bg-green-300 text-green-700'
                          : fetchQuantity > 0
                          ? 'bg-yellow-300 text-yellow-700'
                          : 'bg-red-300 text-red-700'
                      }`}
                    >
                      {fetchQuantity > 10
                        ? 'In Stock'
                        : fetchQuantity > 0
                        ? 'Low Stock'
                        : 'Out of Stock'}
                    </p>
                  </div>
                  <p className="text-xs font-bold truncate mb-2">
                    Size: {selectedProduct.size}
                  </p>
                  <p
                    className={`text-xs font-bold text-gray-500 mb-2 ${
                      fetchQuantity > 10
                        ? 'text-green-700'
                        : fetchQuantity > 0
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`}
                  >
                    In stock: {fetchQuantity || 'error'} {unit}
                  </p>

                  {/* Quantity and Unit */}
                  <div className="mb-4">
                    <label className="block text-xs mb-1 text-gray-700">
                      Quantity
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        ref={itemQuantityRef}
                        max={fetchQuantity}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.min(parseFloat(e.target.value) || 0, fetchQuantity))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sellingPriceRef.current.focus();
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-500 focus:ring-red-500"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="ml-2 px-3 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                      >
                        <option value="SQFT">SQFT</option>
                        <option value="GSQFT">Granite SQFT</option>
                        <option value="BOX">BOX</option>
                        <option value="NOS">NOS</option>
                        <option value="TNOS">Tiles NOS</option>
                      </select>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div className="mb-4">
                    <label className="block text-xs mb-1 text-gray-700">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      ref={sellingPriceRef}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddProductWithQuantity();
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-500 focus:ring-red-500"
                      placeholder="Enter Selling Price"
                    />
                  </div>

                  {/* Add Item Button */}
                  <button
                    className="bg-red-500 text-xs w-full text-white font-bold py-2 px-4 rounded focus:outline-none hover:bg-red-600"
                    onClick={handleAddProductWithQuantity}
                  >
                    Add Item
                  </button>
                  <p
                    onClick={() => {
                      setOutofstockProduct(selectedProduct);
                      setQuantity(0);
                      setItemId('');
                      setSuggestions([]);
                      setShowOutOfStockModal(true);
                      outofStockRef.current?.focus();
                    }}
                    className='text-xs cursor-pointer text-center italic my-3'
                  >
                    Update Stock
                  </p>
                </div>
              )}

              {/* Mobile View: Added Products List */}
              {products.length > 0 && (
                <div className="mt-6 md:hidden">
                  <h2 className="text-sm border-t text-gray-600 pt-5 font-bold mb-4">Added Products: {products.length}</h2>
                  <div className="mb-4 flex items-center">
                    <input
                      type="text"
                      placeholder="Filter by product name or ID"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    />
                    <i className='fa fa-search bg-red-500 px-5 py-3 text-white rounded-lg ml-2 items-center' />
                  </div>
                  {products.filter(
                    (product) =>
                      product.name
                        .toLowerCase()
                        .includes(filterText.toLowerCase()) ||
                      product.item_id
                        .toLowerCase()
                        .includes(filterText.toLowerCase())
                  ).map((product, index) => (
                    <div
                      key={index}
                      className="mb-4 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col space-y-2"
                    >
                      <div className="flex justify-between rounded-t-lg bg-red-500 p-2 items-center">
                        <p className="text-xs text-white font-bold truncate">{product.name} - {product.item_id}</p>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${product.name} from the bill?`))
                              deleteProduct(index);
                          }}
                          className="text-white font-bold hover:text-white"
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                      <div className='flex justify-between p-4'>
                        <div className="text-xs font-bold text-gray-700">
                          <div className='flex justify-left'>
                            <p className='px-2 text-xs mt-auto'>Quantity ({product.unit}):</p>
                            <input
                              type="number"
                              value={product.enteredQty}
                              onChange={(e) => handleEditProduct(index, 'enteredQty', e.target.value)}
                              className="text-center w-20 border-0 border-red-400 border-b-2 focus:border-red-600 focus:outline-none focus:ring-0"
                            />
                          </div>
                          <div className='flex justify-left'>
                            <p className='px-2 mt-auto text-xs'>Selling Price {product.unit === 'NOS' ? '(NOS)' : '(SQFT)'}:</p>
                            <input
                              type="number"
                              value={product.sellingPrice}
                              onChange={(e) => handleEditProduct(index, 'sellingPrice', e.target.value)}
                              className="text-center w-20 border-0 border-b-2 border-red-400 focus:border-red-600 focus:outline-none focus:ring-0"
                            />
                          </div>
                          <p className="px-2 mt-5 text-xs">
                            Rate + Tax per (Nos): ₹{(product.sellingPriceinQty).toFixed(2)}
                          </p>
                          <p className='px-2 py-2 text-sm'>Total Price: ₹{(product.quantity * product.sellingPriceinQty).toFixed(2)}</p>
                        </div>

                        <div onClick={() => navigate(`${product.image.length > 8 ? product.image : '#'}`)} className='items-center cursor-pointer my-auto'>
                          <img
                            onError={() => setImageError(true)}
                            className={`object-cover rounded-md w-20 h-20 ${imageError ? 'hidden' : ''}`}
                            src={`${product.image}`}
                            alt={product.image}
                          />
                          {imageError && (
                            <div className="flex justify-center items-center w-20 h-20 bg-gray-200 rounded-md">
                              <p className="text-gray-500 text-sm">No image</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Desktop View: Added Products Table */}
              {products.length > 0 && (
                <div className="hidden md:block mt-6">
                  <h2 className="text-sm font-semibold mb-2">Added Products: {products.length}</h2>

                  {/* Filter Input */}
                  <div className="mb-4 flex items-center">
                    <input
                      type="text"
                      placeholder="search added products..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
                    />
                    <i className='fa fa-search bg-red-500 px-5 py-3 text-white rounded-lg ml-2 items-center' />
                  </div>

                  {/* Product Table */}
                  <div className="overflow-x-auto rounded-md">
                    <table className="table-auto w-full border-collapse rounded-xl shadow-md">
                      <thead>
                        <tr className="bg-red-500 text-white text-xs">
                          <th className="px-2 py-2 text-left">
                            <i className="fa fa-cube" aria-hidden="true"></i> Name
                          </th>
                          <th className="px-2 py-2 text-center">Quantity</th>
                          <th className="px-2 py-2 text-left">Unit</th>
                          <th className="px-2 py-2 text-center">Selling Price</th>
                          <th className="px-2 py-2 text-center">Quantity <br /> (per Nos)</th>
                          <th className="px-2 py-2 text-center">Rate+T <br /> (per Nos)</th>
                          <th className="px-2 py-2 text-left">Total</th>
                          <th className="px-2 py-2 text-center">
                            <i className="fa fa-trash" aria-hidden="true"></i>
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-x'>
                        {products
                          .filter(
                            (product) =>
                              product.name
                                .toLowerCase()
                                .includes(filterText.toLowerCase()) ||
                              product.item_id
                                .toLowerCase()
                                .includes(filterText.toLowerCase())
                          )
                          .sort((a, b) => b.originalIndex - a.originalIndex)
                          .map((product, index) => (
                            <tr
                              key={index}
                              className={`divide-x ${
                                index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                              } border-b hover:bg-red-50 transition duration-150`}
                            >
                              <td className="px-4 py-4 text-xs font-medium">
                                {product.name} - {product.item_id}
                              </td>
                              <td className="px-2 py-2 text-center text-xs">
                                <input
                                  type="number"
                                  min={1}
                                  value={product.enteredQty}
                                  onChange={(e) =>
                                    handleEditProduct(
                                      index,
                                      'enteredQty',
                                      e.target.value
                                    )
                                  }
                                  className="w-16 text-center px-2 py-1 border rounded-md"
                                />
                              </td>
                              <td className="px-2 py-2 text-xs">{product.unit}</td>
                              <td className="px-2 py-2 text-xs text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={product.sellingPrice}
                                  onChange={(e) =>
                                    handleEditProduct(
                                      index,
                                      'sellingPrice',
                                      e.target.value
                                    )
                                  }
                                  className="w-16 text-center px-2 py-1 border rounded-md"
                                />
                                <p className='text-center mt-2'>{product.unit === "NOS" ? '(NOS)' : '(SQFT)'}</p>
                              </td>
                              <td className="px-2 py-2 text-center text-xs">
                                {product.quantity}
                              </td>
                              <td className="px-2 py-2 text-xs">
                                ₹{(product.sellingPriceinQty).toFixed(2)}
                              </td>
                              <td className="px-2 py-2 text-xs">
                                ₹{(product.quantity * product.sellingPriceinQty).toFixed(2)}
                              </td>
                              <td className="px-2 py-2 text-xs text-center">
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete ${product.name} from the bill?`
                                      )
                                    )
                                      deleteProduct(index);
                                  }}
                                  className="text-red-500 font-bold hover:text-red-700"
                                >
                                  <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Navigation */}
        <div className="flex justify-between mb-8">
          <button
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className={`${
              step === 1
                ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
            }`}
          >
            Previous
          </button>
          <p className="font-bold text-center text-xs mt-2">
            Step {step} of 4
          </p>
          <button 
            disabled={step === 4}
            onClick={() => setStep(step + 1)}
            className={`${
              step === 4 
                ? 'bg-gray-300 text-xs text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
          customerName={customerName}
          invoiceNo={invoiceNo}
          totalAmount={totalAmount}
          amountWithoutGST={amountWithoutGST}
          salesmanName={salesmanName}
          cgst={cgst}
          sgst={sgst}
          discount={discount}
          setDiscount={setDiscount}
          receivedAmount={receivedAmount}
          setReceivedAmount={setReceivedAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          onClose={() => setShowSummaryModal(false)}
          onSubmit={submitBillingData}
          isSubmitting={isSubmitting}
          totalProducts={products.length}
        />
      )}

      {/* Out of Stock Modal */}
      {showOutOfStockModal && outofStockProduct && (
        <OutOfStockModal
          product={outofStockProduct}
          onUpdate={handleStockproductUpdate}
          onClose={() => {
            setOutofstockProduct(null);
            setShowOutOfStockModal(false);
          }}
          stockRef={outofStockRef}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-xs animate-pulse font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
