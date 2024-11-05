import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";

export default function EditPurchasePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sellerName, setSellerName] = useState("");
  const [purchaseId, setPurchaseId] = useState('');
  const [sellerId, setSellerId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [modal, setModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedPurchase, setselectedPurchase] = useState('');


      // Fetch billing suggestions based on input
      const fetchPurchaseSujjettion = async (query) => {
        try {
          const { data } = await api.get(`/api/orders/suggestions/purchase/suggestions?search=${query}`);
          setSuggestions(data);
        } catch (err) {
          setError('Error fetching billing suggestions');
        }
      };
    
      useEffect(() => {
        if (selectedPurchase) {
          fetchPurchaseSujjettion(selectedPurchase);
        }
      }, [selectedPurchase]);


  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setModal(false);
      fetchBillingDetails(id);
    }else{
        setModal(true);
    }
  }, [id]);

  const fetchBillingDetails = async (id) => {
    try {
      const { data } = await api.get(`/api/orders/purchase/${id}`);
      setInvoiceNo(data.invoiceNo);
      setSellerName(data.sellerName);
      setSellerId(data.sellerId);
      setItems(data.items);
      setPurchaseId(data._id);
      setModal(false);
    } catch (err) {
      setError('Error fetching billing details');
    }
  };


  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [message, error]);

  const addItem = () => {
  if (!itemId || !itemQuantity || !itemBrand || !itemCategory || !itemPrice) {
    setError("Please fill in all fields");
    return;
  }

  // Check if an item with the same itemId already exists
  const isDuplicate = items.some((item) => item.itemId === itemId);
  if (isDuplicate) {
    setError("Item with the same ID already exists");
    return;
  }

  const newItem = {
    itemId,
    name: itemName,
    quantity: itemQuantity,
    brand: itemBrand,
    category: itemCategory,
    price: itemPrice,
  };

  setItems([...items, newItem]);
  setItemQuantity(0);
  clearItemFields();
  setError("");
  setMessage("Item added successfully!");

};


  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemQuantity(0);
    setItemBrand("");
    setItemCategory("");
    setItemPrice("");
  };

  const handleSearchItem = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/products/itemId/${itemId}`);
      if (data) {
        setItemName(data.name);
        setItemBrand(data.brand);
        setItemCategory(data.category);
        setItemPrice(data.price);
        setLoading(false);
      } else {
        setError("Item not found");
        setItemQuantity(0);
        clearItemFields();
        setItemId(itemId);
        setLoading(false);
      }
    } catch (err) {
      setError("Error fetching item");
      setItemQuantity(0);
      clearItemFields();
      setItemId(itemId);
      setLoading(false);
    }
  };

  const updateQuantity = (index, value) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = value;
    setItems(updatedItems);
  };

  const removeItem = (indexToDelete) => {
    // Set quantity of the product at indexToDelete to 0
    const updatedProducts = items.map((p, index) =>
      index === indexToDelete ? { ...p, quantity: 0 } : p
    );
  
    setItems(updatedProducts);
  };


  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (!sellerName || !sellerId || !invoiceNo || items.length === 0) {
      setError("All Fields Are Required");
      return;
    }
  
    const purchaseData = {
      sellerName,
      sellerId,
      invoiceNo,
      items,
    };
  
    try {
      const response = await api.put(`/api/orders/purchase/${purchaseId}`, purchaseData);
      if (response.status === 200) {
        alert("Purchase successfully Updated");
        setMessage("Purchase Submitted Successfully");
        navigate("/allpurchases");
      } else {
        alert("Error updating purchase");
        setError("Error submitting purchase");
      }
    } catch (error) {
      setError("Error submitting purchase");
      console.error("Submission error:", error);
    }
  };


  const handleSelectSuggestion = (suggestedId) => {
    setPurchaseId(suggestedId);
    setModal(false);
  };
  

  return (
    <div>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-md shadow-md">
            <p>Loading...</p>
          </div>
        </div>
      )}


    {/* Modal for Purchase Suggestions */}
{modal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"> 
    {/* Background overlay with a semi-transparent black color */}
    <div className="bg-white rounded-md p-6 shadow-lg w-full max-w-md">
    <p className="text-xs italic mb-2 text-gray-500">Enter The Purchase Bill No. And Select A Bill</p>
      <input
        type="text"
        value={selectedPurchase}
        onChange={(e) => setselectedPurchase(e.target.value)} // Fixed typo from setselectedPurchase to setSelectedPurchase
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        placeholder="Enter or select Billing Invoice No"
      />

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="mt-2 bg-white shadow-md rounded-md max-h-40 overflow-y-auto border border-gray-200">
          {suggestions.map((billing) => (
            <div
              key={billing.invoiceNo}
              onClick={() => {
                setselectedPurchase(billing.invoiceNo); // Fixed typo from setselectedPurchase to setSelectedPurchase
                fetchBillingDetails(billing._id);
                setSuggestions([]); // Clear suggestions after selecting one
              }}
              className="cursor-pointer flex justify-between p-3 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium">{billing.invoiceNo}</span>
              <i className="fas fa-arrow-right text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}




{(error || message) && (
        <div className={`fixed top-0 left-0 w-full z-50 p-4 ${error ? "bg-red-500" : "bg-green-500"} text-white`}>
          <div className="flex justify-between items-center">
            <span>{error || message}</span>
            <button
              className="text-xl font-bold"
              onClick={() => {
                setError("");
                setMessage("");
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Purchase Updation And Submission</p>
  </div>
  <i className="fa fa-list text-gray-500" />
</div>

    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
      {/* {loading && <LoadingBox />} */}
      {/* {error && <MessageBox variant="danger">{error}</MessageBox>} */}

      {/* <h1 className="text-lg font-semibold">Purchase Bill Form</h1> */}

<div className="flex justify-between mb-5">

       <div className="text-left">
        <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`mt-2 w-full py-2 px-4  text-sm font-bold rounded-md ${currentStep === 2 ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed text-gray-700'}`}
              >
              Back
            </button> 
       </div>

        <div className="text-right">
          <button
            onClick={submitHandler}
            className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
            Submit
          </button>
          <p className="text-xs mt-1 text-gray-400">
            Please click submit only all fields are filled
          </p>
        </div>

            </div>

      <div className="space-y-8">
        {currentStep === 1 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Seller Information
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">
                  Seller Name
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">Seller ID</label>
                <input
                  type="text"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-gray-600">
                  Invoice No.
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="mt-6 w-1/3 py-2 px-4 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700"
            >
              Next
            </button>
          </div>
        )}

        {currentStep === 2 && (
           <div className="mt-4 space-y-4">
           <div className="flex flex-col">
             <label className="mb-1 text-sm text-gray-600">Item ID</label>
             <div className="flex">
               <input
                 type="text"
                 value={itemId}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     handleSearchItem();
                   }
                 }}
                 onChange={(e) => setItemId(e.target.value)}
                 className="w-1/2 border px-3 py-2 rounded-md"
                 required
               />
               <button
                 type="button"
                 onClick={handleSearchItem}
                 className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
               >
                 Search
               </button>
             </div>
           </div>
   
           <div className="flex">
             <input
               type="text"
               placeholder="Item Name"
               value={itemName}
               onChange={(e) => setItemName(e.target.value)}
               className="w-1/2 border mr-2 px-3 py-2 rounded-md"
               required
             />
             <input
               type="text"
               placeholder="Item Brand"
               value={itemBrand}
               onChange={(e) => setItemBrand(e.target.value)}
               className="w-1/2 border px-3 py-2 rounded-md"
               required
             />
           </div>
   
           <div className="flex">
             <input
               type="text"
               placeholder="Category"
               value={itemCategory}
               onChange={(e) => setItemCategory(e.target.value)}
               className="w-full mr-2 border px-3 py-2 rounded-md"
               required
             />
             <input
               type="text"
               placeholder="Price"
               value={itemPrice}
               onChange={(e) => setItemPrice(e.target.value)}
               className="w-full border px-3 py-2 rounded-md"
               required
             />
           </div>
   
           <div className="flex flex-col">
             <input
               type="number"
               placeholder="Quantity"
               value={itemQuantity}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') addItem();
               }}
               onChange={(e) => setItemQuantity(e.target.value)}
               className="w-full border px-3 py-2 rounded-md"
               min="1"
               required
             />
           </div>
   
           <button
             type="button"
             onClick={addItem}
             className="mt-6 w-full py-2 px-4 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700"
           >
             Add Item
           </button>
  
   
         {/* Editable Table */}
         <div className="mt-6">
           <h2 className="text-sm font-bold text-gray-500">Items in Purchase Order</h2>
           <div className="overflow-x-auto">
             <table className="min-w-full table-auto bg-white shadow-md rounded-md mt-4">
               <thead>
                 <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                   <th className="py-3 px-6 text-left">Item ID</th>
                   <th className="py-3 px-6 text-left">Name</th>
                   <th className="py-3 px-6 text-left">Quantity</th>
                   <th className="py-3 px-6 text-left">Price</th>
                   <th className="py-3 px-6 text-left">Brand</th>
                   <th className="py-3 px-6 text-left">Category</th>
                   <th className="py-3 px-6 text-left">Actions</th>
                 </tr>
               </thead>
               <tbody className="text-gray-600 text-sm font-light">
                 {items.map((item, index) => (
                   <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                     <td className="py-3 px-6">{item.itemId}</td>
                     <td className="py-3 px-6">{item.name}</td>
                     <td className="py-3 px-6">
                       <input
                         type="number"
                         value={item.quantity}
                         min="1"
                         onChange={(e) => updateQuantity(index, e.target.value)}
                         className="border px-2 py-1 rounded w-16"
                       />
                     </td>
                     <td className="py-3 px-6">{item.price}</td>
                     <td className="py-3 px-6">{item.brand}</td>
                     <td className="py-3 px-6">{item.category}</td>
                     <td className="py-3 px-6">
                       <button
                         onClick={() => removeItem(index)}
                         className="text-red-600 hover:text-red-800"
                       >
                         Remove
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>

         </div>

        )}
      </div>
    </div>
    </div>
  );
}
