// src/screens/EditPurchaseScreen.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";
import ErrorModal from "../components/ErrorModal";

export default function EditPurchaseScreen() {
  const { id } = useParams(); // Purchase ID from URL
  const navigate = useNavigate();

  // State Variables

  // Seller Information
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerGst, setSellerGst] = useState("");
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Purchase Information
  const [purchaseId, setPurchaseId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [lastItemId, setLastItemId] = useState("");
  const [itemstock,setItemStock] = useState('0');

  // Item Information
  const [items, setItems] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemBillPrice, setItemBillPrice] = useState("");
  const [itemCashPrice, setItemCashPrice] = useState("");
  const [categories, setCategories] = useState([]);

  // Item Additional Information
  const [sUnit, setSUnit] = useState("NOS");
  const [psRatio, setPsRatio] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [size, setSize] = useState("");

  // Transportation Information
  const [logisticCompany, setLogisticCompany] = useState("");
  const [logisticBillId, setLogisticBillId] = useState("");
  const [logisticCompanyGst, setLogisticCompanyGst] = useState("");
  const [logisticAmount, setLogisticAmount] = useState("");
  const [logisticRemark, setLogisticRemark] = useState("");
  const [localCompany, setLocalCompany] = useState("");
  const [localBillId, setLocalBillId] = useState("");
  const [localCompanyGst, setLocalCompanyGst] = useState("");
  const [localAmount, setLocalAmount] = useState("");
  const [localRemark, setLocalRemark] = useState("");
  const [unloadingCharge, setUnloadCharge] = useState("");
  const [insurance, setInsurance] = useState("");
  const [damagePrice, setDamagePrice] = useState("");
  const [transportCompanies, setTransportCompanies] = useState([]);
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [actLength, setActLength] = useState('');
  const [actBreadth, setActBreadth] = useState('');

  // Other States
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Refs for input fields to enable Enter navigation
  const sellerIdRef = useRef();
  const sellerNameRef = useRef();
  const sellerAddressRef = useRef();
  const sellerGstRef = useRef();
  const purchaseIdRef = useRef();
  const invoiceNoRef = useRef();
  const billingDateRef = useRef();
  const invoiceDateRef = useRef();
  const itemIdRef = useRef();
  const itemNameRef = useRef();
  const itemBrandRef = useRef();
  const itemCategoryRef = useRef();
  const itemBillPriceRef = useRef();
  const itemCashPriceRef = useRef();
  const itemUnitRef = useRef();
  const itemQuantityRef = useRef();
  const logisticCompanyRef = useRef();
  const logisticAmountRef = useRef();
  const localCompanyRef = useRef();
  const localAmountRef = useRef();
  const itemSunitRef = useRef();
  const itemlengthRef = useRef();
  const itemBreadthRef = useRef();
  const itemSizeRef = useRef();
  const itemPsRatioRef = useRef();
  const actLengthRef = useRef();
  const actBreadthRef = useRef();

  // Effect to auto-hide messages after 3 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Effect to focus on the first input of each step
  useEffect(() => {
    if (currentStep === 1) {
      purchaseIdRef.current?.focus();
    } else if (currentStep === 2) {
      sellerAddressRef.current?.focus();
    } else if (currentStep === 3) {
      itemIdRef.current?.focus();
    } else if (currentStep === 4) {
      logisticCompanyRef.current?.focus();
    }
  }, [currentStep]);

  // Fetch categories, transport companies, and purchase details on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/api/billing/purchases/categories");
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    const fetchTransportCompanies = async () => {
      try {
        const { data } = await api.get("/api/purchases/get-all/transportCompany");
        setTransportCompanies(data);
      } catch (error) {
        console.error("Error fetching transport companies:", error);
      }
    };
    const fetchPurchaseDetails = async () => {
      if (!id) {
        setError("No purchase ID provided.");
        setShowErrorModal(true);
        return;
      }
      try {
        setLoading(true);
        const { data } = await api.get(`/api/orders/purchase/${id}`);
        const response = await api.get('/api/products/lastadded/id');
        // Populate state with fetched data
        setSellerId(data.sellerId);
        setSellerName(data.sellerName);
        setSellerAddress(data.sellerAddress);
        setSellerGst(data.sellerGst);
        setInvoiceNo(data.invoiceNo);
        setPurchaseId(data.purchaseId);
        setBillingDate(data.billingDate ? data.billingDate.substring(0, 10) : "");
        setInvoiceDate(data.invoiceDate ? data.invoiceDate.substring(0, 10) : "");
        setLastItemId(response?.data)

        // Map items to include calculated fields
        const mappedItems = data.items.map((item) => {
          const parsedQuantity = parseFloat(item.quantity);
          const parsedBillPrice = parseFloat(item.billPartPrice);
          const parsedCashPrice = parseFloat(item.cashPartPrice);
          const psRatio = parseFloat(item.psRatio);
          let quantityInNumbers = parsedQuantity;
          let billPriceInNumbers = parsedBillPrice;
          let cashPriceInNumbers = parsedCashPrice;

          if (item.pUnit === "BOX") {
            quantityInNumbers = parsedQuantity * psRatio;
            billPriceInNumbers = parsedBillPrice / psRatio;
            cashPriceInNumbers = parsedCashPrice / psRatio;
          }

          return {
            ...item,
            quantity: parsedQuantity,
            billPrice: parsedBillPrice,
            cashPrice: parsedCashPrice,
            quantityInNumbers,
            billPriceInNumbers,
            cashPriceInNumbers,
          };
        });

        setItems(mappedItems);

        if (data.purchaseId) {
          try {
            const response = await api.get(`/api/orders/transport/${data.purchaseId}`);
            const transportData = response.data;

            // Initialize variables for logistic and local transport
            let logisticCompany = "";
            let logisticAmount = 0;
            let logisticRemark = "";
            let logisticCompanyGst = "";
            let logisticBillId = "";
            let localCompany = "";
            let localAmount = 0;
            let localRemark = "";
            let localCompanyGst = "";
            let localBillId = "";
            let unloadingCharge = "";
            let insurance = "";
            let damagePrice = "";

            // Process the transport data
            transportData.forEach((item) => {
              if (item.transportType === "logistic") {
                logisticCompany = item.transportCompanyName || "";
                logisticAmount = item.transportationCharges || 0;
                logisticRemark = item.remarks || "";
                logisticCompanyGst = item.companyGst || "";
                logisticBillId = item.billId || "";
              } else if (item.transportType === "local") {
                localCompany = item.transportCompanyName || "";
                localAmount = item.transportationCharges || 0;
                localRemark = item.remarks || "";
                localCompanyGst = item.companyGst || "";
                localBillId = item.billId || "";
              } else if (item.transportType === "other") {
                unloadingCharge = item.unloadingCharge || "";
                insurance = item.insurance || "";
                damagePrice = item.damagePrice || "";
              }
            });

            setLogisticCompany(logisticCompany);
            setLogisticAmount(logisticAmount);
            setLogisticRemark(logisticRemark);
            setLogisticCompanyGst(logisticCompanyGst);
            setLogisticBillId(logisticBillId);

            setLocalCompany(localCompany);
            setLocalAmount(localAmount);
            setLocalRemark(localRemark);
            setLocalCompanyGst(localCompanyGst);
            setLocalBillId(localBillId);


            console.log("--------------------------------");
            console.log(data.totals);

            setUnloadCharge(data.totals.unloadingCharge);
            setInsurance(data.totals.insurance);
            setDamagePrice(data.totals.damagePrice);
          } catch (err) {
            console.error("Error fetching transport details:", err);
          }
        }
      } catch (err) {
        setError("Error fetching purchase details.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchTransportCompanies();
    fetchPurchaseDetails();
  }, [id]);

  // Handle Seller Name change with suggestions
  const handleSellerNameChange = async (e) => {
    const value = e.target.value;
    setSellerName(value);
    if (value.trim() === "") {
      setSellerSuggestions([]);
      setSellerId("");
      setSellerAddress("");
      setSellerGst("");
      return;
    }
    try {
      const { data } = await api.get(
        `/api/billing/purchases/suggestions?q=${value}`
      );
      setSellerSuggestions(data.suggestions);
    } catch (err) {
      setError("Error fetching seller suggestions");
      setShowErrorModal(true);
    }
  };

  // Function to handle selecting a seller from suggestions
  const handleSelectSeller = (seller) => {
    setSellerName(seller.sellerName);
    setSellerId(seller.sellerId);
    setSellerAddress(seller.sellerAddress || "");
    setSellerGst(seller.sellerGst || "");
    setSellerSuggestions([]);
    invoiceNoRef.current?.focus();
  };

  // Function to generate a new seller ID
  const generateSellerId = async () => {
    try {
      const lastId = 'KKSELLER' + Date.now().toString();
      setSellerId(lastId);
    } catch (err) {
      setError("Error generating seller ID");
      setShowErrorModal(true);
    }
  };

  // Function to handle adding items with consistent calculations
  const addItem = () => {
    // Validate all required fields
    if (
      !itemId ||
      !itemName ||
      !itemBrand ||
      !itemCategory ||
      itemBillPrice === "" ||
      itemCashPrice === "" ||
      !itemUnit ||
      itemQuantity === "" ||
      sUnit === "" ||
      psRatio === "" ||
      length === "" ||
      breadth === "" ||
      actLength === "" ||
      actBreadth === "" ||
      size === ""
    ) {
      setError("Please fill in all required fields before adding an item.");
      setShowErrorModal(true);
      return;
    }

    // Parse numerical inputs
    const parsedQuantity = parseFloat(itemQuantity);
    const parsedBillPrice = parseFloat(itemBillPrice);
    const parsedCashPrice = parseFloat(itemCashPrice);
    const productLength = parseFloat(length);
    const productBreadth = parseFloat(breadth);
    const productSize = parseFloat(size);
    const productPsRatio = parseFloat(psRatio);

    // Validate numerical inputs
    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      isNaN(parsedBillPrice) ||
      parsedBillPrice < 0 ||
      isNaN(parsedCashPrice) ||
      parsedCashPrice < 0 ||
      isNaN(productLength) ||
      productLength <= 0 ||
      isNaN(productBreadth) ||
      productBreadth <= 0 ||
      isNaN(productSize) ||
      productSize <= 0 ||
      isNaN(productPsRatio) ||
      productPsRatio <= 0
    ) {
      setError(
        "Please enter valid numerical values for quantity, price, and dimensions."
      );
      setShowErrorModal(true);
      return;
    }

    // Prevent duplicate items
    if (items.some((item) => item.itemId === itemId)) {
      setError("This item is already added. Please adjust the quantity instead.");
      setShowErrorModal(true);
      return;
    }

    // Calculate quantities and prices in numbers
    let quantityInNumbers = parsedQuantity;
    let billPriceInNumbers = parsedBillPrice;
    let cashPriceInNumbers = parsedCashPrice;

    if (itemUnit === "BOX") {
      quantityInNumbers = parsedQuantity * productPsRatio;
      billPriceInNumbers = parsedBillPrice / productPsRatio;
      cashPriceInNumbers = parsedCashPrice / productPsRatio;
    }

    const newItem = {
      itemId,
      name: itemName,
      brand: itemBrand,
      category: itemCategory,
      quantity: parsedQuantity,
      pUnit: itemUnit,
      billPrice: parsedBillPrice,
      cashPrice: parsedCashPrice,
      sUnit,
      psRatio: productPsRatio,
      length: productLength,
      breadth: productBreadth,
      size: productSize,
      quantityInNumbers,
      billPriceInNumbers,
      cashPriceInNumbers,
    };

    setItems([newItem, ...items]);
    clearItemFields();
    setMessage("Item added successfully!");
  };

  // Function to clear item input fields after adding
  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemBrand("");
    setItemCategory("");
    setItemBillPrice("");
    setItemCashPrice("");
    setItemUnit("");
    setItemQuantity("");
    setSUnit("NOS");
    setPsRatio("");
    setLength("");
    setBreadth("");
    setSize("");
    setActLength("");
    setActBreadth("");
    setItemStock("0");
  };

  // Function to handle searching for an item by ID
  const handleSearchItem = async () => {
    if (itemId.trim() === "") {
      setError("Please enter an Item ID to search.");
      setShowErrorModal(true);
      return;
    }
    try {
      setItemLoading(true);
      const { data } = await api.get(`/api/products/itemId/${itemId}`);
      if (data) {
        setItemId(data.item_id);
        setItemName(data.name);
        setItemBrand(data.brand);
        setItemCategory(data.category);
        setItemBillPrice(data.billPrice);
        setItemCashPrice(data.cashPrice);
        setBreadth(data.breadth);
        setLength(data.length);
        setPsRatio(data.psRatio);
        setSize(data.size);
        setSUnit(data.sUnit);
        setItemUnit(data.pUnit);
        setItemStock(data.countInStock);
        setActLength(data.actLength);
        setActBreadth(data.actBreadth);
        itemNameRef.current?.focus();
      } else {
        setError("Item not found.");
        setShowErrorModal(true);
        clearItemFields();
      }
    } catch (err) {
      setError("Error fetching item details.");
      setShowErrorModal(true);
      clearItemFields();
    } finally {
      setItemLoading(false);
    }
  };

  // Function to add a new category
  const addCategory = () => {
    const newCategory = prompt("Enter new category:");
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setMessage(`Category "${newCategory}" added successfully!`);
    }
  };

  // Function to remove an item from the list
  const removeItem = (index) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setMessage("Item removed successfully!");
    }
  };

  // Function to handle editing item fields
  const handleItemFieldChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    // Recalculate quantities and prices in numbers if necessary
    if (["quantity", "billPrice", "cashPrice"].includes(field)) {
      const parsedQuantity = parseFloat(updatedItems[index].quantity);
      const parsedBillPrice = parseFloat(updatedItems[index].billPrice);
      const parsedCashPrice = parseFloat(updatedItems[index].cashPrice);
      const psRatio = parseFloat(updatedItems[index].psRatio);

      let quantityInNumbers = parsedQuantity;
      let billPriceInNumbers = parsedBillPrice;
      let cashPriceInNumbers = parsedCashPrice;

      if (updatedItems[index].pUnit === "BOX") {
        quantityInNumbers = parsedQuantity * psRatio;
        billPriceInNumbers = parsedBillPrice / psRatio;
        cashPriceInNumbers = parsedCashPrice / psRatio;
      }

      updatedItems[index].quantityInNumbers = quantityInNumbers;
      updatedItems[index].billPriceInNumbers = billPriceInNumbers;
      updatedItems[index].cashPriceInNumbers = cashPriceInNumbers;
    }

    setItems(updatedItems);
  };

  // Calculate Total Amounts
  const calculateTotals = () => {
    let billPartTotal = 0;
    let cashPartTotal = 0;


    items.forEach((item) => {
      billPartTotal += item.quantityInNumbers * parseFloat(item.billPriceInNumbers).toFixed(2);
      cashPartTotal += item.quantityInNumbers * parseFloat(item.cashPriceInNumbers).toFixed(2);
    });

    // GST rate for items is 18%
    const gstRateItems = 1.18;

    const amountWithoutGSTItems = billPartTotal / (gstRateItems);
    const gstAmountItems = billPartTotal - amountWithoutGSTItems;
    const cgstItems = gstAmountItems / 2;
    const sgstItems = gstAmountItems / 2;

    // Transportation charges
    const logisticAmountValue = parseFloat(logisticAmount || 0);
    const localAmountValue = parseFloat(localAmount || 0);
    const totalTransportationCharges = logisticAmountValue + localAmountValue;

    // GST rate for transportation is 5%
    const gstRateTransport = 1.18;

    const amountWithoutGSTTransport =
      totalTransportationCharges / (gstRateTransport);
    const gstAmountTransport =
      totalTransportationCharges - amountWithoutGSTTransport;
    const cgstTransport = gstAmountTransport / 2;
    const sgstTransport = gstAmountTransport / 2;

    // Parse other expenses
    const unloadingChargeValue = parseFloat(unloadingCharge || 0);
    const insuranceValue = parseFloat(insurance || 0);
    const damagePriceValue = parseFloat(damagePrice || 0);

    const totalOtherExpenses =
      totalTransportationCharges +
      unloadingChargeValue +
      insuranceValue +
      damagePriceValue;

    const totalItems = items.reduce(
      (acc, item) => acc + parseFloat(item.quantityInNumbers),
      0
    );

    const perItemOtherExpense = totalOtherExpenses / totalItems;

    const totalPurchaseAmount = billPartTotal + cashPartTotal;

    const grandTotalPurchaseAmount = totalPurchaseAmount + totalOtherExpenses;

    return {
      billPartTotal,
      cashPartTotal,
      amountWithoutGSTItems,
      gstAmountItems,
      cgstItems,
      sgstItems,
      totalTransportationCharges,
      amountWithoutGSTTransport,
      gstAmountTransport,
      cgstTransport,
      sgstTransport,
      totalOtherExpenses,
      perItemOtherExpense,
      totalPurchaseAmount,
      grandTotalPurchaseAmount,
    };
  };

  const {
    billPartTotal,
    cashPartTotal,
    amountWithoutGSTItems,
    gstAmountItems,
    cgstItems,
    sgstItems,
    totalTransportationCharges,
    amountWithoutGSTTransport,
    gstAmountTransport,
    cgstTransport,
    sgstTransport,
    totalOtherExpenses,
    perItemOtherExpense,
    totalPurchaseAmount,
    grandTotalPurchaseAmount,
  } = calculateTotals();

  // Handle Form Submission
  const submitHandler = async () => {
    setError("");

    if (!sellerName || !invoiceNo || items.length === 0) {
      setError("All fields are required before submission.");
      setShowErrorModal(true);
      return;
    }

    // Prepare purchase data
    const purchaseData = {
      sellerId,
      sellerName,
      sellerAddress,
      sellerGst,
      invoiceNo,
      purchaseId,
      billingDate,
      invoiceDate,
      items: items.map((item) => ({
        itemId: item.itemId || itemId,
        name: item.name,
        brand: item.brand,
        category: item.category,
        quantity: item.quantity,
        quantityInNumbers: item.quantityInNumbers,
        pUnit: item.pUnit,
        sUnit: item.sUnit,
        psRatio: item.psRatio,
        length: item.length,
        breadth: item.breadth,
        size: item.size,
        billPartPrice: item.billPrice,
        cashPartPrice: item.cashPrice,
        billPartPriceInNumbers: item.billPriceInNumbers,
        cashPartPriceInNumbers: item.cashPriceInNumbers,
        allocatedOtherExpense: perItemOtherExpense * item.quantityInNumbers,
        totalPriceInNumbers:  item.billPriceInNumbers + item.cashPriceInNumbers + perItemOtherExpense
      })),
      totals: {
        billPartTotal,
        cashPartTotal,
        amountWithoutGSTItems,
        gstAmountItems,
        cgstItems,
        sgstItems,
        amountWithoutGSTTransport,
        gstAmountTransport,
        cgstTransport,
        sgstTransport,
        unloadingCharge,
        insurance,
        damagePrice,
        totalPurchaseAmount,
        totalOtherExpenses,
        grandTotalPurchaseAmount,
        transportationCharges: totalTransportationCharges,
      },
      transportationDetails: {
        logistic: {
          purchaseId: purchaseId,
          invoiceNo: invoiceNo,
          billId: logisticBillId,
          companyGst: logisticCompanyGst,
          transportCompanyName: logisticCompany,
          transportationCharges: logisticAmount,
          remark: logisticRemark,
        },
        local: {
          purchaseId: purchaseId,
          invoiceNo: invoiceNo,
          billId: localBillId,
          companyGst: localCompanyGst,
          transportCompanyName: localCompany,
          transportationCharges: localAmount,
          remark: localRemark,
        }
      },
    };

    try {
      setLoading(true);
      // Direct API call to update purchase
      const response = await api.put(`/api/products/purchase/${purchaseId}`, purchaseData);
      if (response.status === 200) {
        alert("Purchase updated successfully!");
        navigate("/allpurchases"); // Navigate to purchase listing page
      } else {
        setError("Error updating purchase. Please try again.");
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Error updating purchase. Please try again.");
      setShowErrorModal(true);
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key navigation between fields
  const changeRef = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  return (
    <div>
      {/* Loading Indicator */}
      {(loading || itemLoading) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md shadow-md">
            <p className="text-sm font-bold">Loading...</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}

      {/* Top Banner */}
      <div
        className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Edit Purchase
          </p>
        </div>
        <i className="fa fa-edit text-gray-500 text-xl"></i>
      </div>

      {/* Main Content */}
      <div className={`${currentStep !== 3 && 'max-w-3xl'} mx-auto mt-8 p-6 bg-white shadow-md rounded-md`}>
        {/* Step Indicator */}
        <div className="flex justify-between mb-5">
          <div className="text-left">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="mt-2 py-2 px-4 text-xs font-bold rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Back
              </button>
            )}
          </div>
          <div className="text-right">
            {currentStep === 4 ? (
              <button
                onClick={submitHandler}
                className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
              >
                Update
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
              >
                Next
              </button>
            )}
            <p className="text-xs mt-1 text-gray-400">
              Please fill all fields before proceeding
            </p>
          </div>
        </div>

        {/* Total Amount Display */}
        {(currentStep === 4) && (
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-4">
            <div className="flex justify-between">
              <p className="text-xs font-bold">Bill Part Total:</p>
              <p className="text-xs">₹{billPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">Amount without GST:</p>
              <p className="text-xs">₹{amountWithoutGSTItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">CGST (9%):</p>
              <p className="text-xs">₹{cgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">SGST (9%):</p>
              <p className="text-xs">₹{sgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Cash Part Total:</p>
              <p className="text-xs">₹{cashPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Total Purchase Amount:</p>
              <p className="text-xs font-bold">
                ₹{totalPurchaseAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Total Other Expenses:</p>
              <p className="text-xs">₹{totalOtherExpenses.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Grand Total:</p>
              <p className="text-xs font-bold">
                ₹{grandTotalPurchaseAmount.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div>
          <div className="space-y-8">
            {/* Step 1: Supplier Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Supplier Information
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Purchase ID
                    </label>
                    <input
                      type="text"
                      placeholder="Purchase ID"
                      value={purchaseId}
                      ref={purchaseIdRef}
                      onChange={(e) => setPurchaseId(e.target.value)}
                      onKeyDown={(e) => changeRef(e, sellerNameRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md bg-gray-100 focus:outline-none text-xs"
                      required
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      ref={sellerNameRef}
                      value={sellerName}
                      placeholder="Enter Supplier Name"
                      onChange={handleSellerNameChange}
                      onKeyDown={(e) =>{ changeRef(e, invoiceNoRef); if(!sellerId && e.key === "Enter"){ generateSellerId()  } }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                    {/* Suggestions Dropdown */}
                    {sellerSuggestions.length > 0 && (
                      <ul className="border border-gray-300 mt-1 rounded-md shadow-md max-h-40 overflow-y-auto">
                        {sellerSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className={`p-3 text-xs border-t cursor-pointer hover:bg-gray-100 ${
                              selectedSuggestionIndex === index
                                ? "bg-gray-200"
                                : ""
                            }`}
                            onClick={() => handleSelectSeller(suggestion)}
                          >
                            {suggestion.sellerName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Seller ID */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Supplier ID
                    </label>
                    <input
                      type="text"
                      ref={sellerIdRef}
                      value={sellerId}
                      placeholder="Supplier ID"
                      onChange={(e) => setSellerId(e.target.value)}
                      onKeyDown={(e) =>{ changeRef(e, invoiceNoRef); }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md bg-gray-100 focus:outline-none text-xs"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Invoice No.
                    </label>
                    <input
                      type="text"
                      ref={invoiceNoRef}
                      value={invoiceNo}
                      placeholder="Enter invoice number"
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setCurrentStep(2);
                      }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Supplier Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Supplier Address
                  </label>
                  <input
                    type="text"
                    ref={sellerAddressRef}
                    placeholder="Supplier Address"
                    value={sellerAddress}
                    onKeyDown={(e) => changeRef(e, sellerGstRef)}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Supplier GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="Supplier GST"
                    ref={sellerGstRef}
                    value={sellerGst}
                    onKeyDown={(e) => changeRef(e, billingDateRef)}
                    onChange={(e) => setSellerGst(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    ref={billingDateRef}
                    onKeyDown={(e) => changeRef(e, invoiceDateRef)}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    ref={invoiceDateRef}
                    value={invoiceDate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setCurrentStep(3);
                    }}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Add/Edit Items */}
            {currentStep === 3 && (
  <div className="flex flex-col min-h-screen">
    <h2 className="text-sm font-bold text-gray-900 p-4">Add/Edit Items</h2>
    {/* Items Table */}
    {items.length > 0 && (
      <div className="flex-1 overflow-auto p-4">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="min-w-full table-auto bg-white shadow-md rounded-md">
            <thead>
              <tr className="bg-red-500 text-white text-xs">
                <th className="px-2 py-2 text-left">Item ID</th>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Brand</th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-left">Quantity</th>
                <th className="px-2 py-2 text-left">Unit</th>
                <th className="px-2 py-2 text-left">Bill Price (₹)</th>
                <th className="px-2 py-2 text-left">Cash Price (₹)</th>
                <th className="px-2 py-2 text-left">Quantity (NOS)</th>
                <th className="px-2 py-2 text-left">Bill Price per NOS (₹)</th>
                <th className="px-2 py-2 text-left">Cash Price per NOS (₹)</th>
                <th className="px-2 py-2 text-left">Total (₹)</th>
                <th className="px-2 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs">
              {items.map((item, index) => {
                function preciseAdd(...numbers) {
                  return (
                    numbers.reduce((acc, num) => acc + Math.round(num * 100), 0) /
                    100
                  );
                }

                const parsedbillprice =
                  parseFloat(item.billPriceInNumbers) || 0;
                const parsedcashprice =
                  parseFloat(item.cashPriceInNumbers) || 0;
                const quantity = parseFloat(item.quantityInNumbers) || 0;

                const totalUnitPrice = preciseAdd(
                  parsedbillprice,
                  parsedcashprice
                );

                const totalamount = parseFloat(
                  (quantity * totalUnitPrice).toFixed(2)
                );

                return (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-100 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-2 py-2">{item.itemId}</td>
                    <td className="px-2 py-2">{item.name}</td>
                    <td className="px-2 py-2">{item.brand}</td>
                    <td className="px-2 py-2">{item.category}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        step="0.01"
                        onChange={(e) =>
                          handleItemFieldChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">{item.pUnit}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.billPrice}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleItemFieldChange(
                            index,
                            "billPrice",
                            e.target.value
                          )
                        }
                        className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.cashPrice}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleItemFieldChange(
                            index,
                            "cashPrice",
                            e.target.value
                          )
                        }
                        className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      {item.quantityInNumbers.toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      {item.billPriceInNumbers.toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      {item.cashPriceInNumbers.toFixed(2)}
                    </td>
                    <td className="px-2 py-2">{totalamount.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-xs"
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

        {/* Mobile Cards */}
        <div className="block md:hidden">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white shadow-lg rounded-lg p-4 border"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold">
                    {item.name} - {item.itemId}
                  </p>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
                <p className="text-xs">Brand: {item.brand}</p>
                <p className="text-xs">Category: {item.category}</p>
                <p className="text-xs">
                  Quantity:{" "}
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    step="0.01"
                    onChange={(e) =>
                      handleItemFieldChange(index, "quantity", e.target.value)
                    }
                    className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />{" "}
                  {item.pUnit}
                </p>
                <p className="text-xs">
                  Bill Price:{" "}
                  <input
                    type="number"
                    value={item.billPrice}
                    min="0"
                    step="0.01"
                    onChange={(e) =>
                      handleItemFieldChange(
                        index,
                        "billPrice",
                        e.target.value
                      )
                    }
                    className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </p>
                <p className="text-xs">
                  Cash Price:{" "}
                  <input
                    type="number"
                    value={item.cashPrice}
                    min="0"
                    step="0.01"
                    onChange={(e) =>
                      handleItemFieldChange(
                        index,
                        "cashPrice",
                        e.target.value
                      )
                    }
                    className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </p>
                <p className="text-xs">
                  Quantity (NOS): {item.quantityInNumbers.toFixed(2)}
                </p>
                <p className="text-xs">
                  Bill Price per NOS: ₹{item.billPriceInNumbers.toFixed(2)}
                </p>
                <p className="text-xs">
                  Cash Price per NOS: ₹{item.cashPriceInNumbers.toFixed(2)}
                </p>
                <p className="text-xs">
                  Total: ₹
                  {(
                    item.quantityInNumbers *
                    (item.billPriceInNumbers + item.cashPriceInNumbers)
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Input Section */}
    <div className="p-4 md:fixed bottom-0 left-0 right-0 bg-white shadow-inner">
      <div className="md:flex justify-between space-x-2">
        {/* Left Section: Input Fields */}
        <div className="flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 flex items-center text-xs text-gray-700">
                  <span>Item ID</span>
                  <span className="italic ml-auto text-gray-300">
                    Last Item: {lastItemId || "Not found"}
                  </span>
                </label>
                <input
                  type="text"
                  ref={itemIdRef}
                  value={itemId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchItem();
                    }
                  }}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="Enter Item Name"
                  ref={itemNameRef}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={(e) => changeRef(e, itemBrandRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">Item Brand</label>
                <input
                  type="text"
                  placeholder="Enter Item Brand"
                  ref={itemBrandRef}
                  value={itemBrand}
                  onChange={(e) => setItemBrand(e.target.value)}
                  onKeyDown={(e) => changeRef(e, itemCategoryRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">
                  Item Category
                </label>
                <select
                  value={itemCategory}
                  ref={itemCategoryRef}
                  onChange={(e) => setItemCategory(e.target.value)}
                  onKeyDown={(e) => changeRef(e, itemSunitRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  required
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">S Unit</label>
                <select
                  value={sUnit}
                  onChange={(e) => setSUnit(e.target.value)}
                  ref={itemSunitRef}
                  onKeyDown={(e) => changeRef(e, itemPsRatioRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  required
                >
                  <option value="NOS">NOS</option>
                  <option value="SQFT">SQFT</option>
                  <option value="BOX">BOX</option>
                  <option value="GSQFT">GSQFT</option>
                </select>
              </div>
            </div>

            {/* Dimensions and Ratios */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">P/S Ratio</label>
                <input
                  type="number"
                  placeholder="Enter P/S Ratio"
                  value={psRatio}
                  ref={itemPsRatioRef}
                  onKeyDown={(e) => changeRef(e, itemlengthRef)}
                  onChange={(e) => setPsRatio(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">Length</label>
                <input
                  type="number"
                  placeholder="Enter Length"
                  value={length}
                  ref={itemlengthRef}
                  onKeyDown={(e) => changeRef(e, itemBreadthRef)}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">Breadth</label>
                <input
                  type="number"
                  ref={itemBreadthRef}
                  placeholder="Enter Breadth"
                  value={breadth}
                  onKeyDown={(e) => changeRef(e, actLengthRef)}
                  onChange={(e) => setBreadth(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col">
            <label className="text-xs text-gray-700 mb-1">Act Length</label>
            <input
              type="number"
              ref={actLengthRef}
              placeholder="Enter Act Length"
              value={actLength}
              onKeyDown={(e) => changeRef(e, actBreadthRef)}
              onChange={(e) => setActLength(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-700 mb-1">Act Breadth</label>
            <input
              type="number"
              ref={actBreadthRef}
              placeholder="Enter Act Breadth"
              value={actBreadth}
              onKeyDown={(e) => changeRef(e, itemSizeRef)}
              onChange={(e) => setActBreadth(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              min="0"
              step="0.01"
            />
          </div>

          
            </div>

            {/* Quantity and Prices */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

            <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">Size</label>
                <input
                  type="text"
                  placeholder="Enter Size"
                  value={size}
                  ref={itemSizeRef}
                  onKeyDown={(e) => changeRef(e, itemUnitRef)}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">P Unit</label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  ref={itemUnitRef}
                  onKeyDown={(e) => changeRef(e, itemQuantityRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  required
                >
                  <option value="" disabled>
                    Select Unit
                  </option>
                  <option value="SQFT">SQFT</option>
                  <option value="BOX">BOX</option>
                  <option value="NOS">NOS</option>
                  <option value="GSQFT">GSQFT</option>
                </select>
              </div>


              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="Enter Quantity"
                  value={itemQuantity}
                  ref={itemQuantityRef}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  onKeyDown={(e) => changeRef(e, itemBillPriceRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">
                  Bill Part Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter Bill Part Price"
                  value={itemBillPrice}
                  ref={itemBillPriceRef}
                  onChange={(e) => setItemBillPrice(e.target.value)}
                  onKeyDown={(e) => changeRef(e, itemCashPriceRef)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-700 mb-1">
                  Cash Part Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter Cash Part Price"
                  value={itemCashPrice}
                  ref={itemCashPriceRef}
                  onChange={(e) => setItemCashPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addItem();
                    }
                  }}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

            </div>
          </div>
        </div>

        {/* Middle Section: Stock and GST Info */}
       <div className="hidden lg:block w-44">
          <div className="bg-gray-100 p-6 h-full rounded-lg shadow-inner">
            <div className="">
            <div className="flex justify-between">
              <p className="text-sm font-bold">GST:</p>
              <p className="text-sm">18%</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs font-bold">Added Products:</p>
              <p className="text-xs">{items?.length}</p>
            </div>
            </div>
            <div className="flex my-2 mx-auto text-center">
            <button
              type="button"
              onClick={addItem}
              className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 text-xs w-full md:w-auto"
            >
              Add Item
            </button>
          </div>
            <div className="bg-gray-300 p-5 mt-4 rounded-lg">
            <div className="flex justify-between">
              <p className="text-xs font-bold">Current Item</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs font-bold">Stock:</p>
              <p className="text-xs">{itemstock.toString().slice(0,8)} {sUnit}</p>
            </div>
              </div>
          </div>
        </div>

        {/* Right Section: Summary */}
        <div className="w-full md:w-60 mt-4 md:mt-0">
          <div className="bg-gray-100 w-full p-4 space-y-2 rounded-lg shadow-inner">
            <div className="flex justify-between">
              <p className="text-xs font-bold">Bill Part Total:</p>
              <p className="text-xs">{billPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">Amount without GST:</p>
              <p className="text-xs">{amountWithoutGSTItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">CGST (9%):</p>
              <p className="text-xs">{cgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">SGST (9%):</p>
              <p className="text-xs">{sgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-bold">Cash Part Total:</p>
              <p className="text-xs">{cashPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-bold">Purchase Amount:</p>
              <p className="text-xs font-bold">
                {totalPurchaseAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-bold">Total Other Expenses:</p>
              <p className="text-xs">{totalOtherExpenses.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Grand Total:</p>
              <p className="text-sm font-bold">
                {grandTotalPurchaseAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}


            {/* Step 4: Transportation Details */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Other Expenses
                </h2>

                <div className="flex justify-between mt-2 space-x-2 mb-5">
                  <div className="w-full">
                    <label className="text-xs text-gray-700 mb-1">
                      Unloading Charge
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Unloading Charge"
                      value={unloadingCharge}
                      onChange={(e) => setUnloadCharge(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="w-full">
                    <label className="text-xs text-gray-700 mb-1">
                      Insurance
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Insurance Amount"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="w-full">
                    <label className="text-xs text-gray-700 mb-1">
                      Damage Price
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Damage Price"
                      value={damagePrice}
                      onChange={(e) => setDamagePrice(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <h2 className="text-sm font-bold text-gray-900">
                  Transportation Details
                </h2>
                <div className="mt-4 space-y-6">
                  {/* Logistic Transportation */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">
                      Logistic Transportation (National)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Company
                        </label>
                        <select
                          value={logisticCompany}
                          ref={logisticCompanyRef}
                          onChange={(e) => {
                            if (e.target.value === "add-custom") {
                              const customCompany = prompt(
                                "Enter custom company name:"
                              );
                              if (customCompany) {
                                setTransportCompanies((prev) => [
                                  ...prev,
                                  customCompany,
                                ]); // Add to the list
                                setLogisticCompany(customCompany); // Set as selected value
                              }
                            } else {
                              setLogisticCompany(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => changeRef(e, logisticAmountRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="" disabled>
                            Select Company
                          </option>
                          {transportCompanies.map((company, index) => (
                            <option key={index} value={company}>
                              {company}
                            </option>
                          ))}
                          <option value="add-custom" className="text-red-500">
                            Add Custom Company
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Amount (with GST)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={logisticAmount}
                          ref={logisticAmountRef}
                          onChange={(e) => setLogisticAmount(e.target.value)}
                          onKeyDown={(e) => changeRef(e, localCompanyRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 space-x-2">
                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          placeholder="Enter GSTIN"
                          value={logisticCompanyGst}
                          onChange={(e) => setLogisticCompanyGst(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Bill Id
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Bill Id"
                          value={logisticBillId}
                          onChange={(e) => setLogisticBillId(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Remark
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Remark"
                          value={logisticRemark}
                          onChange={(e) => setLogisticRemark(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Local Transportation */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">
                      Local Transportation (In-State)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Company
                        </label>
                        <select
                          value={localCompany}
                          ref={localCompanyRef}
                          onChange={(e) => {
                            if (e.target.value === "add-custom") {
                              const customCompany = prompt(
                                "Enter custom company name:"
                              );
                              if (customCompany) {
                                setTransportCompanies((prev) => [
                                  ...prev,
                                  customCompany,
                                ]); // Add to the list
                                setLocalCompany(customCompany); // Set as selected value
                              }
                            } else {
                              setLocalCompany(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => changeRef(e, localAmountRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="" disabled>
                            Select Company
                          </option>
                          {transportCompanies.map((company, index) => (
                            <option key={index} value={company}>
                              {company}
                            </option>
                          ))}
                          <option value="add-custom" className="text-red-500">
                            Add Custom Company
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Amount (with GST)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={localAmount}
                          ref={localAmountRef}
                          onChange={(e) => setLocalAmount(e.target.value)}
                          onKeyDown={(e) => {}}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 space-x-2">
                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          placeholder="Enter GSTIN"
                          value={localCompanyGst}
                          onChange={(e) => setLocalCompanyGst(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Bill Id
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Bill Id"
                          value={localBillId}
                          onChange={(e) => setLocalBillId(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Remark
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Remark"
                          value={localRemark}
                          onChange={(e) => setLocalRemark(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Details */}
                <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-inner">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">
                    Overall Details
                  </h3>
                  <div className="flex justify-between">
                    <p className="text-xs font-bold">Bill Part Total:</p>
                    <p className="text-xs">₹{billPartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs">Subtotal (without GST):</p>
                    <p className="text-xs">
                      ₹{amountWithoutGSTItems.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs">CGST (9%):</p>
                    <p className="text-xs">₹{cgstItems.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs">SGST (9%):</p>
                    <p className="text-xs">₹{sgstItems.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Cash Part Total:</p>
                    <p className="text-xs">₹{cashPartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Transportation Charges:</p>
                    <p className="text-xs">
                      ₹{totalTransportationCharges.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Other Expenses Total:</p>
                    <p className="text-xs">₹{totalOtherExpenses.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Purchase Amount:</p>
                    <p className="text-xs font-bold">
                      ₹{totalPurchaseAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm font-bold">Grand Total:</p>
                    <p className="text-xs font-bold">
                      ₹{grandTotalPurchaseAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
