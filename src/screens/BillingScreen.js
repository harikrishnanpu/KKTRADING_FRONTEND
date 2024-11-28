// src/screens/BillingScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessModal from '../components/SccessModal';
import SummaryModal from '../components/SummaryModal';
import api from './api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import OutOfStockModal from '../components/itemAddingModal';
import axios from 'axios';
import { useSelector } from 'react-redux';
import BillingSuccess from '../components/billingsuccess';

export default function BillingScreen() {
  const navigate = useNavigate();

  // Billing Information States
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10));
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
  const [unloading, setUnloading] = useState(0);
  const [transportation, setTransportation] = useState(0);
  const [handlingcharge, setHandlingCharge] = useState(0);
  const [remark, setRemark] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [lastBillId, setLastBillId] = useState(null);

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
  const [sqPrice, setSqPrice] = useState(0);
  const [customerSq, setCustomerSQ] = useState(0);
  const [fetchQuantity, setFetchQuantity] = useState(0);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outofStockProduct,setOutofstockProduct] = useState(null);
  const [salesmanPhoneNumber, setSalesmanPhoneNumber] = useState('');
  const [salesmen, setSalesmen] = useState([]);
  const [imageError,setImageError] = useState(false);
  const [saveModal,setSaveModal] = useState(false);
  const [success,setSuccess] = useState(false);
  const [returnInvoice,setReturnInvoice] = useState('');
  const [customerSuggestions,setCustomerSuggestions] = useState([]);
  const [customerSuggesstionIndex,setCustomerSuggesstionIndex] = useState(-1);
  const [accounts,setAccounts] = useState([]);

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;



  // Stepper Control
  const [step, setStep] = useState(1);

  // Modal Controls
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for Input Navigation
  const invoiceNoRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();
  const salesmanNameRef = useRef();
  const invoiceDateRef = useRef();
  const expectedDeliveryDateRef = useRef();
  const deliveryStatusRef = useRef();
  const paymentStatusRef = useRef();
  const itemIdRef = useRef();
  const itemQuantityRef = useRef();
  const outofStockRef = useRef();
  const sellingPriceRef = useRef();
  const customerContactNumberRef = useRef();
  const marketedByRef = useRef();


  useEffect(()=>{
    if(error){
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  },[error]);


  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const { data } = await api.get('/api/users/salesmen/all'); // Adjust the API endpoint as needed
        setSalesmen(data);
      } catch (error) {
        console.error('Error fetching salesmen:', error);
      }
    };

    const fetchAccounts = async () => {
      setIsLoading(true); // Set loading state
      try {
        const response = await api.get('/api/accounts/allaccounts');
        const getPaymentMethod = response.data.map((acc) => acc.accountId);
    
        // Check if there are any accounts and set the first account as the default
        if (getPaymentMethod.length > 0) {
          const firstAccountId = getPaymentMethod[0];
          setPaymentMethod(firstAccountId); // Set the first account as default
        } else {
          setPaymentMethod(null); // Handle case where there are no accounts
        }
    
        setAccounts(response.data); // Set the accounts in state
      } catch (err) {
        setError('Failed to fetch payment accounts.'); // Set error message
        console.error(err);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    

    fetchAccounts();
    fetchSalesmen();
  }, []);

    // Handle Salesman Selection
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


  const handleLocalClear = () => {
    // Remove saved data from local storage
    localStorage.removeItem('savedBill');
    localStorage.removeItem('savedProducts');
  
    // Clear all relevant state variables
    setInvoiceNo('');
    setInvoiceDate('');
    setSalesmanName('');
    setExpectedDeliveryDate('');
    setDeliveryStatus('');
    setPaymentStatus('');
    setReceivedAmount(0);
    setPaymentMethod('');
    setReceivedDate('');
    setCustomerName('');
    setCustomerAddress('');
    setCustomerContactNumber('');
    setMarketedBy('');
    setDiscount(0);
    setProducts([]);
  
    // Provide feedback to the user
    setError('');
    alert('Billing data and products cleared successfully.');
    setSaveModal(false);
  };
  


  const handleLocalSave = () => {
    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      billingAmount: totalAmount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      discount,
      unloading,
      transportation,
      salesmanPhoneNumber,
      handlingcharge
    };
  
    // Save the data to local storage as a JSON string
    localStorage.setItem('savedBill', JSON.stringify(billingData));
    localStorage.setItem('savedProducts', JSON.stringify(products));
    alert('Billing data saved');
    setSaveModal(false);
    setShowSummaryModal(false);
  };
  
  useEffect(() => {
    const fetchLocalSavedBill = async () => {
      // Retrieve saved data from local storage
      const savedData = localStorage.getItem('savedBill');
      if (savedData) {
        // Parse the JSON string back into an object
        const parsedData = JSON.parse(savedData);
  
        // Set your state with the fetched data
        setInvoiceNo(parsedData.invoiceNo);
        setInvoiceDate(parsedData.invoiceDate);
        setSalesmanName(parsedData.salesmanName);
        setExpectedDeliveryDate(parsedData.expectedDeliveryDate);
        setDeliveryStatus(parsedData.deliveryStatus);
        setPaymentStatus(parsedData.paymentStatus);
        setReceivedAmount(parsedData.paymentAmount);
        setPaymentMethod(parsedData.paymentMethod);
        setReceivedDate(parsedData.paymentReceivedDate);
        setCustomerName(parsedData.customerName);
        setCustomerAddress(parsedData.customerAddress);
        setCustomerContactNumber(parsedData.customerContactNumber);
        setMarketedBy(parsedData.marketedBy);
        setDiscount(parsedData.discount);
        setTransportation(parsedData.transportation);
        setHandlingCharge(parsedData.handlingcharge);
        setSalesmanPhoneNumber(parsedData.salesmanPhoneNumber);
        setUnloading(parsedData.unloading);
      }
    };
  
    fetchLocalSavedBill();
  }, []);


  useEffect(() => {
    const loadSavedProducts = () => {
      const savedProducts = localStorage.getItem('savedProducts');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    };
  
    loadSavedProducts();
  }, []);
  

  // Fetch Last Bill ID on Mount
  useEffect(() => {
    const fetchLastBill = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/api/billing/lastOrder/id');
        const nextInvoiceNo =  "KK" + parseInt(parseInt(data.slice(2), 10) + 1);
        setLastBillId(data);
        setInvoiceNo(nextInvoiceNo)
      } catch (error) {
        console.error('Error fetching last bill:', error);
        setError('Failed to fetch last billing information.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLastBill();
  }, []);


  useEffect(()=>{
    if(selectedProduct){
      if(unit === "SQFT"){
        const quantity = selectedProduct.countInStock
        const adjustedquantity = (parseFloat(quantity) * parseFloat(selectedProduct.length * selectedProduct.breadth)).toFixed(2);
        setFetchQuantity(adjustedquantity);
        setQuantity(0);
      } else if(unit === "BOX"){
        const quantity = selectedProduct.countInStock
        const adjustedquantity = (parseFloat(quantity) / parseFloat(selectedProduct.psRatio)).toFixed(2);
        setFetchQuantity(adjustedquantity);
        setQuantity(0);
      } else {
        const quantity = selectedProduct.countInStock
        setFetchQuantity(quantity);
        setQuantity(0);
      }
    }
  },[unit]);

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



  const handleproductUpdate = async (newQ,product)=> {
    if(newQ){
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);
      if(newQ && data.countInStock){
        setSelectedProduct(data);
        setQuantity(1);
        setSellingPrice(data.price);
        setFetchQuantity(data.countInStock);
        setItemId('');
        setSuggestions([]);
      }else{
        alert("Error Occured In Updating the Stock")
      }
    }
  }

  // Add Product by Selecting from Suggestions
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
        // setError(`Item ${data.name} is out of stock.`);
        return;
      }

      setSelectedProduct(data);
      setQuantity(1);
      setSellingPrice(data.price);
      setFetchQuantity(data.countInStock);
      setItemId('');
      setSuggestions([]);
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Product not found or server error.');
    } finally {
      setIsLoading(false);
    }
  };


  // Handle Adding Product with Quantity and Selling Price
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
    if (products.some((product) => product._id === selectedProduct._id)) {
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
  
    const updatedProducts = [productWithDetails , ...products];
    setProducts(updatedProducts);
  
    // Save updated products to local storage
    localStorage.setItem('savedProducts', JSON.stringify(updatedProducts));
  
    // Show success modal and focus on the next item
    setShowSuccessModal(true);
    itemIdRef.current?.focus();
  
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  
    // Reset Fields
    setSelectedProduct(null);
    setQuantity(1);
    setUnit('NOS');
    setSellingPrice('');
    setError('');
  };
  


  // Delete a Product from the List
  const deleteProduct = (indexToDelete) => {
    setProducts(products.filter((_, index) => index !== indexToDelete));
  };

  // Edit Product Details
  const handleEditProduct = (index, field, value) => {
    const updatedProducts = [...products];
    const product = updatedProducts[index];
    const parsedValue = parseFloat(value) || 0;
  
    // Helper function to safely parse and multiply values
    const safeMultiply = (a, b) => (a && b ? parseFloat(a) * parseFloat(b) : 0);
  
    // Calculate area if length and breadth are present
    const area = safeMultiply(product.length, product.breadth);
  
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
  

  // Calculate Total Amount
  const calculateTotalAmount = () => {
    return products.reduce(
      (acc, product) => acc + product.quantity * product.sellingPriceinQty,
      0
    );
  };


const [totalAmount, setTotalAmount] = useState(0);
const [amountWithoutGST, setAmountWithoutGST] = useState(0);
const [gstAmount, setGSTAmount] = useState(0);
const [cgst, setCGST] = useState(0);
const [sgst, setSGST] = useState(0);
const [perItemDiscount, setPerItemDiscount] = useState(0);
const [grandTotal,setGrandTotal] = useState(0);

useEffect(() => {
  // Ensure all numeric inputs are properly parsed to avoid errors
  const parsedDiscount = parseFloat(discount || 0);
  const parsedTransportation = parseFloat(transportation || 0);
  const parsedUnloading = parseFloat(unloading || 0);
  const handling = parseFloat(handlingcharge || 0); 

  // Calculate total quantity of products
  const totalQtyProducts = products.reduce(
    (acc, product) => acc + parseFloat(product.quantity || 0),
    0
  );

  // Calculate per-item discount
  const calculatedPerItemDiscount =
    totalQtyProducts > 0 ? parsedDiscount / totalQtyProducts : 0;

  setPerItemDiscount(calculatedPerItemDiscount.toFixed(2));

  // Calculate total amount after applying per-item discount
  const totalProductAmount = products.reduce((acc, product) => {
    const parsedQty = parseFloat(product.quantity || 0);
    const parsedSellingPrice = parseFloat(product.sellingPriceinQty || 0);

    // Total for each product after applying discount
    const productTotal =
      parsedQty * (parsedSellingPrice - calculatedPerItemDiscount);

    return acc + (productTotal || 0);
  }, 0);

  // Add other charges (transportation and unloading)
  const total = parseFloat(totalProductAmount);
  const grandTotal = parseFloat(parseFloat(total) + parsedTransportation + parsedUnloading + handling).toFixed(2);

  // Update total amount state
  setTotalAmount(total.toFixed(2));

  // GST Calculations
  const amountExcludingGST = total / 1.18;
  const calculatedGSTAmount = total - amountExcludingGST;
  const calculatedCGST = calculatedGSTAmount / 2;
  const calculatedSGST = calculatedGSTAmount / 2;

  setAmountWithoutGST(amountExcludingGST.toFixed(2));
  setGSTAmount(calculatedGSTAmount.toFixed(2));
  setCGST(calculatedCGST.toFixed(2));
  setSGST(calculatedSGST.toFixed(2));
  setGrandTotal(parseFloat(grandTotal || 0).toFixed(2));

  if(products.length <= 0){
    setPerItemDiscount(0);
    setDiscount(0);
    setGrandTotal(0);
    setTotalAmount(0);
  }

}, [discount, products, unloading, transportation, handlingcharge]);


  


  // Handle Billing Submission
  const handleBillingSubmit = async () => {
    // Validate Required Fields
    if (
      !customerName ||
      !customerAddress ||
      !invoiceNo ||
      !expectedDeliveryDate ||
      !salesmanPhoneNumber ||
      !salesmanName ||
      products.length === 0
    ) {
      setError('Please fill all required fields and add at least one product.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      billingAmount: totalAmount,
      grandTotal: grandTotal,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      salesmanPhoneNumber,
      userId: userInfo._id,
      marketedBy,
      unloading,
      transportation,
      handlingcharge,
      remark,
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
        length: product.length || 0,
        breadth: product.breadth || 0,
        size: product.size || 0,
        psRatio: product.psRatio || 0,
      })),
    };

    try {
      const response = await api.post('/api/billing/create', billingData);
      console.log('Billing Response:', response.data);
      setReturnInvoice(response.data.billingData.invoiceNo)

      // Reset Form Fields
      setInvoiceNo('');
      setInvoiceDate('');
      setSalesmanName('');
      setSalesmanPhoneNumber('');
      setExpectedDeliveryDate('');
      setDeliveryStatus('Pending');
      setPaymentStatus('Unpaid');
      setCustomerName('');
      setCustomerAddress('');
      setCustomerContactNumber('');
      setMarketedBy('');
      setProducts([]);
      setDiscount(0);
      setReceivedAmount(0);
      setReceivedDate('');
      setPaymentMethod();
      setShowSummaryModal(false);
      handleLocalClear();

      // Optionally, navigate to another page or show a success message
      setSuccess(true);
      // navigate('/'); // Example navigation
    } catch (error) {
      console.error('Error submitting billing data:', error);
      setError(
        'There was an error submitting the billing data. Please try again.'
      );
      alert(
        'There was an error submitting the billing data. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    setIsLoading(true);

    const formData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      salesmanPhoneNumber,
      paymentStatus,
      billingAmount: totalAmount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      subTotal: amountWithoutGST,
      transportation,
      unloading,
      grandTotal: grandTotal,
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

    try {
      const response = await axios.post('https://kktrading-backend.vercel.app/generate-pdf', 
         formData, {
        responseType: 'blob'
      });
  
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice_${formData.invoiceNo}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating invoice:', error);
    }finally {
      setIsLoading(false);
    }
  };



  function printInvoice() {

    const formData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      salesmanPhoneNumber,
      paymentStatus,
      billingAmount: totalAmount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      perItemDiscount,
      subTotal: amountWithoutGST,
      grandTotal,
      transportation,
      unloading,
      handling: handlingcharge,
      remark,
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

    api.post('/api/print/generate-invoice-html', formData)
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
  
  

  // Handle Step Navigation
  const nextStep = () => {
    if (step === 4) {
      setShowSummaryModal(true);
    } else {
      setStep(step + 1);
    }
  };
  const prevStep = () => setStep(step - 1);

  // Handle Keyboard Navigation Between Fields

  function changeRef(e, nextRef) {
    if (e.key === 'Enter') { 
      e.preventDefault();
     if (nextRef === paymentStatusRef) {
        paymentStatusRef.current?.focus();
      } else if (nextRef === itemIdRef) {
        itemIdRef.current?.focus();
        setStep((prevStep) => prevStep + 1);
      } else if (nextRef === salesmanNameRef || nextRef === invoiceDateRef) {
        setStep((prevStep) => prevStep + 1);
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

  // Auto-focus the quantity input when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      itemQuantityRef.current.focus();
    }
  }, [selectedProduct]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    setCustomerSuggesstionIndex(-1);
  }, [customerSuggestions]);

  const handleCustomerNameChange = async (e) => {
    const value = e.target.value;
    setCustomerName(value);
    
    // If the input is empty, clear suggestions and exit
    if (value.trim() === "") {
      setCustomerSuggestions([]);
      return;
    }
    
    try {
      // Make sure the endpoint path matches the updated router
      const { data } = await api.get(
        `/api/billing/customer/suggestions?suggestions=true&search=${encodeURIComponent(value)}`
      );
      
      // Update the suggestions state with the received data
      setCustomerSuggestions(data.suggestions);
    } catch (err) {
      console.error("Error fetching customer suggestions:", err);
      setError("Error fetching customer suggestions");
    }
  };



  const handlecustomerContactNumberChange = async (e) => {
    const value = e.target.value;
    setCustomerContactNumber(value);
    
    // If the input is empty, clear suggestions and exit
    if (value.trim() === "") {
      setCustomerSuggestions([]);
      return;
    }
    
    try {
      // Make sure the endpoint path matches the updated router
      const { data } = await api.get(
        `/api/billing/customer/suggestions?suggestions=true&search=${encodeURIComponent(value)}`
      );
      
      // Update the suggestions state with the received data
      setCustomerSuggestions(data.suggestions);
    } catch (err) {
      console.error("Error fetching customer suggestions:", err);
      setError("Error fetching customer suggestions");
    }
  };
  


  
  
  return (
    <div className="mx-auto">

    {success && <BillingSuccess isAdmin={userInfo.isAdmin} estimationNo={returnInvoice} />}

      {/* Top Banner */}
      <div
        className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 cursor-pointer"
      >
        <div   onClick={() => navigate('/')} className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Billing and Customer Creation
          </p>
        </div>
        <p className='text-md bg-gray-100 px-2 py-1 rounded-md text-red-600 cursor-pointer font-bold ' onClick={()=> setSaveModal(true)}><i className='fa fa-save' /></p>
      </div>

      {saveModal && <div className='fixed transform font-bold fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50'>
        <div className='bg-white p-8 text-center rounded-md space-y-6'>
          <div className='flex justify-between'>
          <p className='text-md'>Save Bill</p>
          <p onClick={()=> setSaveModal(false)} className='text-md ml-10 cursor-pointer'>X</p>
            </div>
      <p className='text-sm text-red-600 border-b pb-5 cursor-pointer font-bold ' onClick={()=> handleLocalSave()}>Save</p>
      <p className='text-sm text-red-600 cursor-pointer font-bold ' onClick={()=> handleLocalClear()}>Clear</p>
        </div>
      </div> }

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="font-bold bg-white px-4 py-2 rounded-lg text-gray-600 text-xs animate-pulse">Loading...</div>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-4">
        {/* Header with Actions */}
        <div className="flex justify-between mb-8">
          <p className="text-sm font-bold text-gray-500 mt-2">
            <i className="fa fa-list" />  
          </p>
          <div className="text-right">
            <button
              onClick={generatePDF}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg mr-2 ${
                products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              disabled={products.length === 0 || !userInfo.isAdmin}
            >
              <i className='fa fa-download' />
            </button>

            <button
              onClick={printInvoice}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg mr-2 ${
                products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              disabled={products.length === 0 || !userInfo.isAdmin}
            >
              <i className='fa fa-print' />
            </button>


            <button
              onClick={() => setShowSummaryModal(true)}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${
                products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              disabled={products.length === 0}
            >
              Review & Submit
            </button>
            <p className="text-xs text-gray-400">
              Fill all fields before submission
            </p>
          </div>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="mb-6">
            <div className="flex justify-between">
              <h2 className="text-sm text-gray-500 font-bold mb-4">
                Customer Information
              </h2>
              <p className="italic text-xs text-gray-500">
                Last Billed: {lastBillId ? lastBillId : 'No Billings'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice No</label>
              <input
                type="text"
                ref={invoiceNoRef}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                onKeyDown={(e) => changeRef(e, customerNameRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Invoice No"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Customer Name
              </label>
              <input
  type="text"
  ref={customerNameRef}
  value={customerName}
  autoComplete="off" 
  onChange={handleCustomerNameChange}
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCustomerSuggesstionIndex((prevIndex) =>
        prevIndex < customerSuggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCustomerSuggesstionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex
      );
    } else if (e.key === 'Enter') {
      if (
        customerSuggesstionIndex >= 0 &&
        customerSuggesstionIndex < customerSuggestions.length
      ) {
        e.preventDefault();
        const selectedCustomer = customerSuggestions[customerSuggesstionIndex];
        setCustomerName(selectedCustomer.customerName);
        setCustomerContactNumber(selectedCustomer.customerContactNumber);
        setCustomerAddress(selectedCustomer.customerAddress);
        customerAddressRef.current?.focus();
        // Optionally, you can set other fields like customerContactNumber here
        setCustomerSuggesstionIndex(-1); // Reset the index after selection
        setCustomerSuggestions([]); // Clear suggestions after selection
      }else{
        customerContactNumberRef.current?.focus();
      }
    }
  }}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
  placeholder="Enter Customer Name"
/>

                {customerSuggestions.length > 0 && (
                  <div className="mt-2 bg-white border rounded-md max-h-60 divide-y overflow-y-auto">
                    {customerSuggestions.map((customer, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setCustomerName(customer.customerName);
                          setCustomerContactNumber(customer.customerContactNumber);
                          setCustomerAddress(customer.customerAddress);
        customerAddressRef.current?.focus();
        // Optionally, you can set other fields like customerContactNumber here
        setCustomerSuggesstionIndex(-1); // Reset the index after selection
        setCustomerSuggestions([]); // Clear suggestions after selection
                        }}
                        className={`p-4 text-xs cursor-pointer hover:bg-gray-100 ${
                          index === customerSuggesstionIndex ? 'bg-gray-200' : ''
                        }`}
                      >
                        {customer.customerName}
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Customer Contact Number
              </label>
              <input
                type="number"
                placeholder="Enter Customer Number"
                ref={customerContactNumberRef}
                value={customerContactNumber}
                onKeyDown={(e) => changeRef(e, customerAddressRef)}
                autoComplete="off" 
                onChange={(e)=> setCustomerContactNumber(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />

            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Customer Address
              </label>
              <textarea
                value={customerAddress}
                ref={customerAddressRef}
                onChange={(e) => setCustomerAddress(e.target.value)}
                onKeyDown={(e) => { changeRef(e, salesmanNameRef); }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
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
      onChange={handleSalesmanChange}
      onKeyDown={(e) => changeRef(e, invoiceDateRef)}
      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
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
          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
          placeholder="Salesman Phone Number"
        />
      </div>
    )}
  </div>

        )}

        {/* Step 3: Payment and Delivery Information */}
        {step === 3 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Delivery Information
            </h2>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice Date</label>
              <input
                type="date"
                ref={invoiceDateRef}
                value={invoiceDate}
                onKeyDown={(e) => changeRef(e, expectedDeliveryDateRef)}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Expected Delivery Date
              </label>
              <input
                type="datetime-local"
                ref={expectedDeliveryDateRef}
                value={expectedDeliveryDate}
                onKeyDown={(e) => changeRef(e, marketedByRef)}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Marketed By:
              </label>
              <input
                ref={marketedByRef}
                value={marketedBy}
                onChange={(e) => setMarketedBy(e.target.value)}
                onKeyDown={(e) => changeRef(e, deliveryStatusRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Marketed by"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Delivery Status
              </label>
              <select
                value={deliveryStatus}
                ref={deliveryStatusRef}
                onKeyDown={(e) => changeRef(e, itemIdRef)}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              >
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
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
                 INR. {(parseFloat(grandTotal)).toFixed(2)}
                <p className='font-bold' style={{fontSize: '9px'}}>Discount: {parseFloat(discount || 0)?.toFixed(2)}</p>
              </h2>
            </div>

            <div>
              {/* Item ID Input */}
              <div className="mb-4 border-t pt-5">
                <label className="block text-gray-700 text-xs mb-2">
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
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
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
                  <div className="flex justify-between items-center ">
                    <p className="text-xs font-bold truncate">
                      {selectedProduct.name.slice(0,25)}... ID: {selectedProduct.item_id}
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
                  <p className={`text-xs font-bold text-gray-500 mb-2 ${
                        fetchQuantity > 10
                          ? 'text-green-700'
                          : fetchQuantity > 0
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
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
                        onChange={ (e) =>
                          setQuantity(Math.min(parseFloat(e.target.value), fetchQuantity))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sellingPriceRef.current.focus();
                          }
                        }}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full ml-4 border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
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
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
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
                  <p onClick={()=> {
                            setOutofstockProduct(selectedProduct);
                            setQuantity(0);
                            setItemId('');
                            setSuggestions([]);
                            setShowOutOfStockModal(true);
                            outofStockRef.current?.focus();
                  } } className='text-xs cursor-pointer text-gray-500 text-center font-bold my-5'>Update Stock</p>
                </div>
              )}






{products.length > 0 && (
                <div className="mt-6 md:hidden">
                <h2 className="text-sm border-t text-gray-600 pt-5 font-bold mb-4">Added Products: {products.length}</h2>
                                    <div className="mb-4 flex items-center">
                    <input
                      type="text"
                      placeholder="Filter by product name or ID"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full ml-4 border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    />
                    <i className='fa fa-search bg-red-500 p-3 text-white rounded-lg ml-2 items-center' />
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
                      <div className="flex justify-between rounded-t-lg  bg-red-500 p-2 items-center">
                        <p className="text-xs text-white font-bold truncate">{product.name.slice(0,20)}... - {product.item_id}</p>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${product.name} from the bill?`))
                              deleteProduct(index);
                          }}
                          className="text-white text-xs font-bold hover:text-white"
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                      <div className='p-2 max-w-sm'>
                      <div className="text-xs grid w-60 grid-cols-2 gap-3 font-bold text-gray-700">
                        <div className='justify-center space-y-1 items-center'>
                        <p className='px-2 text-xs'>Qty: ({product.unit})</p>
                        <input
                          type="number"
                          value={product.enteredQty}
                          onChange={(e) => handleEditProduct(index, 'enteredQty', e.target.value)}
                          className="w-full ml-4 border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                        {/* <p className='mt-auto ml-2'>( {product.unit} )</p> */}
                        </div>
                        <div className='justify-center space-y-1 items-center'>
                        <p className='px-2 text-xs'>Rate: {product.unit == 'NOS' ? '(NOS)' : '(SQFT)'} </p>
                        <input
                          type="number"
                          value={product.sellingPrice}
                          onChange={(e) => handleEditProduct(index, 'sellingPrice', e.target.value)}
                          className="w-full ml-4 border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                        </div>
                      </div>


                          <div onClick={()=> navigate(`${product.image.length > 8 ? `/${product.image}` : '#'}`)} className='items-center cursor-pointer flex justify-between px-4 py-3'>
                          <div>
      <img
        // onError={() => setImageError(true)}
        className={`object-cover flex justify-center items-center w-40 h-20 bg-gray-200 rounded-md ${
          imageError ? 'hidden' : ''
        }`}
        src={product.image}
      />
      {imageError && (
        <div className="flex justify-center items-center w-40 h-20 bg-gray-200 rounded-md">
          <p className="text-gray-500 text-sm">No image</p>
        </div>
      )}
    </div>
        <div className='text-xs space-y-2 px-5 truncate'>
          <p>{product.item_id}</p>
          <p>{product.name}</p>
          <p className='font-bold text-gray-400'>In Stock: {product.countInStock} NOS</p>
          </div>

                            </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Added Products Table */}
              {products.length > 0 && (
                <div className="hidden md:block  mt-6">
                  <h2 className="text-sm font-semibold mb-2">Added Products: {products.length}</h2>

                  {/* Filter Input */}
                  <div className="mb-4 flex items-center">
                    <input
                      type="text"
                      placeholder="search added products..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    />
                                        <i className='fa fa-search bg-red-500 p-2 text-white rounded-lg ml-2 items-center' />

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
                          <th className="px-2 py-2 text-center">Quantity <br/> (per Nos)</th>
                          <th className="px-2 py-2 text-center">Rate+T <br/> (per Nos)</th>
                          <th className="px-2 py-2 text-left">Total</th>
                          <th className="px-2 py-2 text-center">Discount</th>
                          <th className="px-2 py-2 text-left">Net Total</th>
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
                          ).sort((a, b) => b.originalIndex - a.originalIndex)
                          .map((product, index) => (
                            <tr
                              key={index}
                              className={` divide-x ${
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
                                  <p className='text-center mt-2'>{product.unit == "NOS" ? '(NOS)' : '(SQFT)'}</p>
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
                                {(product.quantity * perItemDiscount).toFixed(2)}
                              </td>
                              <td className="px-2 py-2 text-xs">
                                ₹{((product.quantity * product.sellingPriceinQty) - (product.quantity * perItemDiscount)).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-xs text-center">
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
            onClick={prevStep}
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
            disabled={step === 4 && products.length === 0}
            onClick={nextStep}
            className={`${
              step === 4 && products.length === 0
                ? 'bg-gray-300 text-xs text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && <SuccessModal message="Item added successfully!" />}



      {/* Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
        accounts={accounts}
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
          unloading={unloading}
          setUnloading={setUnloading}
          transportation={transportation}
          setTransportation={setTransportation} 
          handling={handlingcharge}
          setHandling={setHandlingCharge}
          remark={remark}
          setRemark={setRemark}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          grandTotal={grandTotal}
          onClose={() => setShowSummaryModal(false)}
          onSubmit={handleBillingSubmit}
          isSubmitting={isSubmitting}
          totalProducts={products.length}
          handleLocalSave={handleLocalSave}
        />
      )}


        {showOutOfStockModal && outofStockProduct && (
          <OutOfStockModal
            product={outofStockProduct}
            onUpdate={handleproductUpdate}
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
