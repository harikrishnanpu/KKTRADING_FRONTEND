// src/screens/EditBillScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SuccessModal from '../components/SccessModal';
import SummaryModal from '../components/SummaryModal';
import OutOfStockModal from '../components/itemAddingModal';
import api from './api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { useSelector } from 'react-redux';

export default function EditBillScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;

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
  const [unloading, setUnloading] = useState(0);
  const [transportation, setTransportation] = useState(0);
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [remark, setRemark] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);

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
  const [outOfStockProduct, setOutOfStockProduct] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [salesmanPhoneNumber, setSalesmanPhoneNumber] = useState('');
  const [salesmen, setSalesmen] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Stepper Control
  const [step, setStep] = useState(1);

  // Modal Controls
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for Input Navigation
  const invoiceNoRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();
  const customerContactNumberRef = useRef();
  const salesmanNameRef = useRef();
  const invoiceDateRef = useRef();
  const expectedDeliveryDateRef = useRef();
  const deliveryStatusRef = useRef();
  const paymentStatusRef = useRef();
  const itemIdRef = useRef();
  const itemQuantityRef = useRef();
  const outOfStockRef = useRef();
  const sellingPriceRef = useRef();
  const marketedByRef = useRef();
  const unloadingRef = useRef();
  const transportationRef = useRef();
  const handlingChargeRef = useRef();
  const discountRef = useRef();
  const receivedAmountRef = useRef();
  const receivedDateRef = useRef();
  const paymentMethodRef = useRef();


  const [billingsuggestions,setBillingSuggestions] = useState([]);
  const [selectedBillingSuggestions,setSelectedBillingSuggestions] = useState();

  useEffect(()=>{
    if(!id){
      const fetchSuggestions = async () => {
        if (invoiceNo) {
          try {
            const response = await api.get(
              `/api/billing/billing/suggestions?search=${invoiceNo}`
            );
            setBillingSuggestions(response.data); 
          } catch (error) {
            console.error("Error fetching suggestions:", error);
          }
        } else {
          setBillingSuggestions([]);
        }
      };
  
      fetchSuggestions();

    }
  },[invoiceNo]);


  const handleSuggestionClick = (suggestion) => {
    navigate(`/bills/edit/${suggestion._id}`)
    navigate(0);
    setBillingSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedBillingSuggestions((prevIndex) =>
        prevIndex < billingsuggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      setSelectedBillingSuggestions((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : billingsuggestions.length - 1
      );
    } else if (e.key === "Enter" && selectedBillingSuggestions >= 0) {
      setSelectedBillingSuggestions(billingsuggestions[selectedBillingSuggestions]);
      handleSuggestionClick(billingsuggestions[selectedBillingSuggestions])
      setBillingSuggestions([]);
    }else if(e.key === "Enter" && id){
      changeRef(e, customerNameRef);
    }
  };

  // Effect to Clear Error Messages After 3 Seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch Salesmen and Accounts on Mount
  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const { data } = await api.get('/api/users/salesmen/all');
        setSalesmen(data);
      } catch (error) {
        console.error('Error fetching salesmen:', error);
      }
    };

    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/accounts/allaccounts');
        setAccounts(response.data);
        if (response.data.length > 0) {
          setPaymentMethod(response.data[0].accountId);
        } else {
          setPaymentMethod('');
        }
      } catch (err) {
        setError('Failed to fetch payment accounts.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesmen();
    fetchAccounts();
  }, []);

  // Fetch Billing Details
  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const { data } = await api.get('/api/users/salesmen/all');
        setSalesmen(data);
      } catch (error) {
        console.error('Error fetching salesmen:', error);
      }
    };

    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/accounts/allaccounts');
        setAccounts(response.data);
        if (response.data.length > 0) {
          setPaymentMethod(response.data[0].accountId);
        } else {
          setPaymentMethod('');
        }
      } catch (err) {
        setError('Failed to fetch payment accounts.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesmen();
    fetchAccounts();
  }, []);

 // Fetch Billing Details
useEffect(() => {
  const fetchBillingDetails = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/billing/${id}`);
      setInvoiceNo(data.invoiceNo);
      setInvoiceDate(new Date(data.invoiceDate).toISOString().split('T')[0]);

      const formattedExpectedDeliveryDate = new Date(data.expectedDeliveryDate).toISOString().slice(0, 16);
      setExpectedDeliveryDate(formattedExpectedDeliveryDate);

      setReceivedDate(new Date(data.paymentReceivedDate || new Date()).toISOString().split('T')[0]);
      setDeliveryStatus(data.deliveryStatus);
      setPaymentStatus(data.paymentStatus);
      setCustomerName(data.customerName);
      setCustomerAddress(data.customerAddress);
      setCustomerContactNumber(data.customerContactNumber);
      setMarketedBy(data.marketedBy);
      setDiscount(parseFloat(data.discount) || 0); // Ensure numeric
      setReceivedAmount(parseFloat(data.paymentAmount) || 0); // Ensure numeric
      setUnloading(parseFloat(data.unloading) || 0); // Ensure numeric
      setTransportation(parseFloat(data.transportation) || 0); // Ensure numeric
      setHandlingCharge(parseFloat(data.handlingCharge) || 0); // Ensure numeric
      setRemark(data.remark)
      // Ensure products have necessary numeric fields
      const fetchedProducts = data.products.map((product) => ({
        ...product,
        quantity: parseFloat(product.quantity) || 0,
        sellingPriceinQty: parseFloat(product.sellingPriceinQty) || 0,
      }));
      setProducts(fetchedProducts);

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

      // Calculate total quantity
      const totalQuantity = fetchedProducts.reduce((acc, product) => acc + product.quantity, 0);

      // Calculate per item discount
      const calculatedPerItemDiscount = totalQuantity > 0 ? parseFloat(data.discount) / totalQuantity : 0;
      setPerItemDiscount(calculatedPerItemDiscount.toFixed(2));

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

  // Handle Salesman Selection
  const handleSalesmanChange = (e) => {
    const selectedName = e.target.value;
    setSalesmanName(selectedName);

    // Find the contact number for the selected salesman
    const selectedSalesman = salesmen.find(
      (salesman) => salesman.name === selectedName
    );
    if (selectedSalesman) {
      setSalesmanPhoneNumber(selectedSalesman.contactNumber || '');
    } else {
      setSalesmanPhoneNumber('');
    }
  };

  // Add Product by Selecting from Suggestions
  const addProductByItemId = async (product) => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);

      if (data.countInStock <= 0) {
        setOutOfStockProduct(data);
        setQuantity(1);
        setItemId('');
        setSuggestions([]);
        setShowOutOfStockModal(true);
        outOfStockRef.current?.focus();
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

  // Calculate Totals and GST whenever relevant fields change
 // Calculate Totals and GST whenever relevant fields change
useEffect(() => {
  const parsedDiscount = parseFloat(discount) || 0;
  const parsedTransportation = parseFloat(transportation) || 0;
  const parsedUnloading = parseFloat(unloading) || 0;
  const parsedHandling = parseFloat(handlingCharge) || 0;

  const totalQtyProducts = products.reduce(
    (acc, product) => acc + parseFloat(product.quantity || 0),
    0
  );

  const calculatedPerItemDiscount =
  totalQtyProducts > 0 ? parsedDiscount / totalQtyProducts : 0;

setPerItemDiscount(calculatedPerItemDiscount.toFixed(2));

  // Calculate the total product amount without discount
  const totalProductAmount = products.reduce((acc, product) => {
    const parsedQty = parseFloat(product.quantity || 0);
    const parsedSellingPrice = parseFloat(product.sellingPriceinQty || 0);

    // Total for each product after applying discount
    const productTotal =
      parsedQty * (parsedSellingPrice - calculatedPerItemDiscount);

    return acc + (productTotal || 0);
  }, 0);

  // Apply the total discount directly
  const calculatedGrandTotal = totalProductAmount - parsedDiscount + parsedTransportation + parsedUnloading + parsedHandling;

  setTotalAmount(totalProductAmount.toFixed(2));

  // Calculate GST based on the grand total
  const amountExcludingGST = calculatedGrandTotal / 1.18;
  const calculatedGSTAmount = calculatedGrandTotal - amountExcludingGST;
  const calculatedCGST = calculatedGSTAmount / 2;
  const calculatedSGST = calculatedGSTAmount / 2;

  setAmountWithoutGST(amountExcludingGST.toFixed(2));
  setGSTAmount(calculatedGSTAmount.toFixed(2));
  setCGST(calculatedCGST.toFixed(2));
  setSGST(calculatedSGST.toFixed(2));
  setGrandTotal(calculatedGrandTotal.toFixed(2));

  // Reset totals if no products are present
  if (products.length <= 0) {
    setPerItemDiscount(0);
    setDiscount(0);
    setGrandTotal(0);
    setTotalAmount(0);
    setAmountWithoutGST(0);
    setGSTAmount(0);
    setCGST(0);
    setSGST(0);
  }
}, [discount, products, unloading, transportation, handlingCharge]);


  
  

  // Handle Billing Submission
  const submitBillingData = async () => {
    setIsSubmitting(true);
    setError('');
  
    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      userId: userInfo._id,
      billingAmount: totalAmount,
      grandTotal: grandTotal,
      cgst,
      sgst,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      salesmanPhoneNumber,
      marketedBy,
      unloading,
      transportation,
      handlingcharge: handlingCharge,
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
      const response = await api.post(`/api/billing/edit/${id}`, billingData);
      console.log('Billing Response:', response.data);
      setShowSummaryModal(false);
      setShowSuccessModal(true);
  
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/bills');
      }, 2000);
    } catch (error) {
      console.error('Error submitting billing data:', error.message);
      setError('There was an error submitting the billing data. Please try again.');
      alert('There was an error submitting the billing data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const openSummaryModal = () => {
    // Validate Required Fields
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
  
    setShowSummaryModal(true);
  };
  



  // Generate PDF Invoice
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
      cgst,
      sgst,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      unloading,
      transportation,
      handlingcharge: handlingCharge,
      remark,
      discount,
      subTotal: amountWithoutGST,
      grandTotal,
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
        size: product.size,
      })),
    };

    try {
      const response = await api.post(
        '/api/print/generate-pdf',
        formData,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice_${formData.invoiceNo}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate PDF invoice.');
    } finally {
      setIsLoading(false);
    }
  };

  // Print Invoice
  const printInvoice = () => {
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
      handling: handlingCharge,
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

    api
      .post('api/print/generate-invoice-html', formData)
      .then((response) => {
        const htmlContent = response.data;
        const printWindow = window.open('', '', 'height=800,width=600');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      })
      .catch((error) => {
        console.error('Error:', error);
        setError('Failed to print invoice.');
      });
  };

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
      nextRef?.current?.focus();
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

  // Handle Customer Name Change with Suggestions
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [customerSuggestionIndex, setCustomerSuggestionIndex] = useState(-1);

  const handleCustomerNameChange = async (e) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.trim() === "") {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const { data } = await api.get(
        `/api/billing/customer/suggestions?suggestions=true&search=${encodeURIComponent(value)}`
      );
      setCustomerSuggestions(data.suggestions);
    } catch (err) {
      console.error("Error fetching customer suggestions:", err);
      setError("Error fetching customer suggestions.");
    }
  };

  // Handle Customer Contact Number Change with Suggestions
  const handleCustomerContactNumberChange = async (e) => {
    const value = e.target.value;
    setCustomerContactNumber(value);

    if (value.trim() === "") {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const { data } = await api.get(
        `/api/billing/customer/suggestions?suggestions=true&search=${encodeURIComponent(value)}`
      );
      setCustomerSuggestions(data.suggestions);
    } catch (err) {
      console.error("Error fetching customer suggestions:", err);
      setError("Error fetching customer suggestions.");
    }
  };

  return (
    <div className="container mx-auto p-2">
      {/* Header */}
      <div
        className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Billing Edit and Update
          </p>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="font-bold bg-white px-4 py-2 rounded-lg text-gray-600 text-xs animate-pulse">
            Loading...
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-4">
        {/* Form Header */}
        <div className="flex justify-between mb-4">
          <p className="text-sm font-bold mb-5 text-gray-500">
            <i className="fa fa-list" /> Editing Billing
          </p>
          <div className="flex space-x-2">
          <button
            onClick={generatePDF}
            className={`bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${
              products.length === 0 || !userInfo.isAdmin
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:bg-red-600'
            }`}
            disabled={products.length === 0 || !userInfo.isAdmin}
          >
            <i className="fa fa-download" />
          </button>
          <button
            onClick={printInvoice}
            className={`bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${
              products.length === 0 || !userInfo.isAdmin
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:bg-red-600'
            }`}
            disabled={products.length === 0 || !userInfo.isAdmin}
          >
            <i className="fa fa-print" />
          </button>
          <button
  onClick={openSummaryModal} 
  className={`bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${
    products.length === 0
      ? 'opacity-70 cursor-not-allowed'
      : 'hover:bg-red-600'
  }`}
  disabled={products.length === 0}
>
  Submit
</button>

        </div>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Customer Information
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice No</label>
              <input
                type="text"
                ref={invoiceNoRef}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Invoice No"
              />

{billingsuggestions.length > 0 && (
                <ul className="bg-white divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300 max-h-48 overflow-y-auto">
                  {billingsuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion._id}
                      className={`p-4 cursor-pointer hover:bg-gray-100 flex justify-between ${
                        index === selectedBillingSuggestions ? "bg-gray-200" : ""
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="font-bold text-xs text-gray-500">
                        {suggestion.invoiceNo}
                      </span>
                      <i className="fa fa-arrow-right text-gray-300" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-4 relative">
              <label className="block text-xs text-gray-700">Customer Name</label>
              <input
                type="text"
                ref={customerNameRef}
                value={customerName}
                autoComplete="off"
                onChange={handleCustomerNameChange}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCustomerSuggestionIndex((prev) =>
                      prev < customerSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCustomerSuggestionIndex((prev) =>
                      prev > 0 ? prev - 1 : prev
                    );
                  } else if (e.key === 'Enter') {
                    if (
                      customerSuggestionIndex >= 0 &&
                      customerSuggestionIndex < customerSuggestions.length
                    ) {
                      e.preventDefault();
                      const selectedCustomer = customerSuggestions[customerSuggestionIndex];
                      setCustomerName(selectedCustomer.customerName);
                      setCustomerContactNumber(selectedCustomer.customerContactNumber);
                      setCustomerAddress(selectedCustomer.customerAddress);
                      customerAddressRef.current?.focus();
                      setCustomerSuggestionIndex(-1);
                      setCustomerSuggestions([]);
                    } else {
                      customerContactNumberRef.current?.focus();
                    }
                  }
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Customer Name"
              />
              {customerSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md max-h-60 overflow-y-auto">
                  {customerSuggestions.map((customer, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setCustomerName(customer.customerName);
                        setCustomerContactNumber(customer.customerContactNumber);
                        setCustomerAddress(customer.customerAddress);
                        customerAddressRef.current?.focus();
                        setCustomerSuggestionIndex(-1);
                        setCustomerSuggestions([]);
                      }}
                      className={`p-2 text-xs cursor-pointer hover:bg-gray-100 ${
                        index === customerSuggestionIndex ? 'bg-gray-200' : ''
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
                onChange={handleCustomerContactNumberChange}
                onKeyDown={(e) => changeRef(e, customerAddressRef)}
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
                onKeyDown={(e) =>{ if(e.key === "Enter") nextStep() }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Customer Address"
              />
            </div>
          </div>
        )}

        {/* Step 2: Salesman Information */}
        {step === 2 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Salesman Information
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Salesman Name</label>
              <select
                value={salesmanName}
                ref={salesmanNameRef}
                onChange={handleSalesmanChange}
                onKeyDown={(e) => {if(e.key === "Enter") nextStep()}}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              >
                <option value="">Select Salesman</option>
                {salesmen.map((salesman) => (
                  <option key={salesman._id} value={salesman.name}>
                    {salesman.name}
                  </option>
                ))}
              </select>
            </div>
            {salesmanName && (
              <div className="mb-4">
                <label className="block text-xs text-gray-700">
                  Salesman Phone Number
                </label>
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
              Payment and Delivery Information
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice Date</label>
              <input
                type="date"
                ref={invoiceDateRef}
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                onKeyDown={(e) => changeRef(e, expectedDeliveryDateRef)}
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
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                onKeyDown={(e) => changeRef(e, marketedByRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Marketed By</label>
              <input
                type="text"
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
                onChange={(e) => setDeliveryStatus(e.target.value)}
                onKeyDown={(e) => nextStep()}
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
      <div className="text-gray-600">
        <p className="text-sm font-bold">Total</p>
        <p className="text-sm font-bold">Bill Amount:</p>
      </div>
      <h2 className="text-md font-bold text-gray-700">
        INR. {parseFloat(grandTotal).toFixed(2)}
        <p className="font-bold" style={{ fontSize: '9px' }}>
          Discount: {parseFloat(discount || 0).toFixed(2)}
        </p>
      </h2>
    </div>

    <div>
      {/* Item ID Input */}
      <div className="mb-4 relative">
        <label className="block text-xs text-gray-700">Item ID</label>
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
              if (
                selectedSuggestionIndex >= 0 &&
                selectedSuggestionIndex < suggestions.length
              ) {
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
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => addProductByItemId(suggestion)}
                className={`p-2 text-xs cursor-pointer hover:bg-gray-100 ${
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
          <p
            onClick={() => {
              setOutOfStockProduct(selectedProduct);
              setQuantity(0);
              setItemId('');
              setSuggestions([]);
              setShowOutOfStockModal(true);
              outOfStockRef.current?.focus();
            }}
            className="text-xs cursor-pointer text-gray-500 text-center font-bold my-5"
          >
            Update Stock
          </p>
        </div>
      )}

      {/* Added Products Table - Mobile View */}
      {products.length > 0 && (
        <div className="mt-6 md:hidden">
          <h2 className="text-sm border-t text-gray-600 pt-5 font-bold mb-4">
            Added Products: {products.length}
          </h2>
          <div className="mb-4 flex items-center">
            <input
              type="text"
              placeholder="Filter by product name or ID"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            />
            <i className="fa fa-search bg-red-500 p-3 text-white rounded-lg ml-2 items-center" />
          </div>
          {products
            .filter(
              (product) =>
                product.name.toLowerCase().includes(filterText.toLowerCase()) ||
                product.item_id.toLowerCase().includes(filterText.toLowerCase())
            )
            .map((product, index) => (
              <div
                key={index}
                className="mb-4 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col space-y-2"
              >
                <div className="flex justify-between rounded-t-lg bg-red-500 p-2 items-center">
                  <p className="text-xs text-white font-bold truncate">
                    {product.name.slice(0, 20)}... - {product.item_id}
                  </p>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(`Are you sure you want to delete ${product.name} from the bill?`)
                      )
                        deleteProduct(index);
                    }}
                    className="text-white text-xs font-bold hover:text-white"
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
                <div className="flex flex-col px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Quantity:</span>
                    <input
                      type="number"
                      min={1}
                      value={product.enteredQty}
                      onChange={(e) =>
                        handleEditProduct(index, 'enteredQty', e.target.value)
                      }
                      className="w-20 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs text-center"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Unit:</span>
                    <select
                      value={product.unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-20 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    >
                      <option value="SQFT">SQFT</option>
                      <option value="GSQFT">Granite SQFT</option>
                      <option value="BOX">BOX</option>
                      <option value="NOS">NOS</option>
                      <option value="TNOS">Tiles NOS</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Selling Price:</span>
                    <input
                      type="number"
                      min={0}
                      value={product.sellingPrice}
                      onChange={(e) =>
                        handleEditProduct(index, 'sellingPrice', e.target.value)
                      }
                      className="w-20 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs text-center"
                      placeholder="Price"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Discount:</span>
                    <input
                      type="number"
                      min={0}
                      value={(product.quantity * product.sellingPriceinQty / totalAmount * discount).toFixed(2)}
                      readOnly
                      className="w-20 border border-gray-300 px-2 py-1 rounded-md text-xs text-center bg-gray-100"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">Net Total:</span>
                    <span className="text-xs font-bold">
                      ₹{((product.quantity * product.sellingPriceinQty) - (product.quantity * product.sellingPriceinQty / totalAmount * discount)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between px-4 py-2">
                  <div className="flex items-center">
                    <span className="text-xs font-semibold">Total:</span>
                    <span className="text-xs ml-2">
                      ₹{(product.quantity * product.sellingPriceinQty).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold">Discount:</span>
                    <span className="text-xs ml-2">
                      ₹{((product.quantity * product.sellingPriceinQty) / totalAmount * discount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold">Net Total:</span>
                    <span className="text-xs ml-2">
                      ₹{((product.quantity * product.sellingPriceinQty) - (product.quantity * product.sellingPriceinQty / totalAmount * discount)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-center">
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
                    <i className="fa fa-trash" aria-hidden="true"></i> Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Added Products Table - Desktop View */}
      {products.length > 0 && (
        <div className="hidden md:block mt-6">
          <h2 className="text-sm font-semibold mb-2">
            Added Products: {products.length}
          </h2>

          {/* Filter Input */}
          <div className="mb-4 flex items-center">
            <input
              type="text"
              placeholder="Search added products..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            />
            <i className="fa fa-search bg-red-500 p-2 text-white rounded-lg ml-2 items-center" />
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
                  <th className="px-2 py-2 text-center">
                    Selling Price
                    <br />
                    {/* Adjust unit display based on product */}
                  </th>
                  <th className="px-2 py-2 text-center">
                    Quantity <br /> (per Nos)
                  </th>
                  <th className="px-2 py-2 text-center">
                    Rate+T <br /> (per Nos)
                  </th>
                  <th className="px-2 py-2 text-left">Total</th>
                  <th className="px-2 py-2 text-center">Discount</th>
                  <th className="px-2 py-2 text-left">Net Total</th>
                  <th className="px-2 py-2 text-center">
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-x">
                {products
                  .filter(
                    (product) =>
                      product.name.toLowerCase().includes(filterText.toLowerCase()) ||
                      product.item_id.toLowerCase().includes(filterText.toLowerCase())
                  )
                  .map((product, index) => {
                    // Calculate product total and proportional discount
                    const productTotal = product.quantity * product.sellingPriceinQty;
                    const proportionalDiscount =
                      totalAmount > 0 ? (productTotal / totalAmount) * discount : 0;
                    const netTotal = productTotal - proportionalDiscount;

                    return (
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
                              handleEditProduct(index, 'enteredQty', e.target.value)
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
                              handleEditProduct(index, 'sellingPrice', e.target.value)
                            }
                            className="w-16 text-center px-2 py-1 border rounded-md"
                          />
                          <p className="text-center mt-2">
                            {product.unit === 'NOS' ? '(NOS)' : '(SQFT)'}
                          </p>
                        </td>
                        <td className="px-2 py-2 text-center text-xs">
                          {product.quantity}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          ₹{parseFloat(product.sellingPriceinQty).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          ₹{productTotal.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-xs text-center">
                          ₹{proportionalDiscount.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          ₹{netTotal.toFixed(2)}
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
                    );
                  })}
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
            disabled={step === 4}
            onClick={nextStep}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal message="Item added successfully!" />
      )}

      {/* Summary Modal */}
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
    handling={handlingCharge}
    setHandling={setHandlingCharge}
    remark={remark}
    setRemark={setRemark}
    receivedDate={receivedDate}
    setReceivedDate={setReceivedDate}
    grandTotal={grandTotal}
    onClose={() => setShowSummaryModal(false)}
    onSubmit={submitBillingData} 
    isSubmitting={isSubmitting}
    totalProducts={products.length}
  />
)}

      {/* Out of Stock Modal */}
      {showOutOfStockModal && outOfStockProduct && (
        <OutOfStockModal
          product={outOfStockProduct}
          onUpdate={async (newQ,product)=> {
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
          }
          onClose={() => {
            setOutOfStockProduct(null);
            setShowOutOfStockModal(false);
          }}
          stockRef={outOfStockRef}
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
