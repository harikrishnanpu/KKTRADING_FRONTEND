import React, { useEffect, useRef, useState } from 'react';
import api from '../screens/api';

export default function OutOfStockModal({
  product,
  onClose,
  onStockChange,
  onUpdate,
  stockRef
}) {
  const [newQuantity, setNewQuantity] = useState('');
  const [sqqty, setSqty] = useState(0);


  useEffect(()=>{
    if(newQuantity == 0 || undefined){
        setSqty(0);
        return;
    }else if(newQuantity && product.length && product.breadth){
        let adjqty =    parseFloat(newQuantity) / 
        (parseFloat(product.length) *
         parseFloat(product.breadth) )
         setSqty(adjqty.toFixed(2))
    }
  },[newQuantity])

  const handleUpdate = async () => {
    // Check if newQuantity is a valid number before making the API request
    if (isNaN(newQuantity) || newQuantity === '') {
      alert('Please enter a valid number');
      return;
    }
  
    try {
      // Convert newQuantity to a number to ensure it's passed as the correct type
      const quantityToUpdate = parseFloat(newQuantity);
  
      const response = await api.put(`/api/products/update-stock/${product._id}`, {
        countInStock: quantityToUpdate
      });
  
      if (response.status === 200) {
        // Call onUpdate with the new quantity and the product
        onUpdate(quantityToUpdate, product);
        
        // Reset the input and close the modal
        setNewQuantity('');
        mainRef.current.classList.remove('animate-slide-up');
        mainRef.current.classList.add('animate-slide-down');
        setTimeout(() => {
          onClose();
        }, 200);
      }
    } catch (error) {
      alert(`Error updating stock: ${error.response?.data?.message || error.message}`);
    }
  };

  const mainRef = useRef();
  

  return (
    <div className="fixed inset-0 flex justify-center z-50 bg-gray-800 bg-opacity-50 ">
      <div ref={mainRef} className="bg-white h-80 mt-auto max-w-lg w-full rounded-lg shadow-lg p-6 animate-slide-up">
        <div className='flex justify-between items-center'>
        <p className="text-sm font-bold text-left text-gray-800 mb-3">
          Update Product Quantity
        </p>
        <button
            className="bg-gray-300 text-xs text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-400"
            onClick={()=>{
              mainRef.current.classList.remove('animate-slide-up');
              mainRef.current.classList.add('animate-slide-down');
              setTimeout(() => {
                onClose();
              }, 200);
            }}
          >
            X
          </button>
        </div>
        {product.countInStock == 0 && <p className='text-xs italic mb-4 text-center text-gray-400'>The Item you entered is currently out of stock update the stock to add product to bill</p>}

        <div className="mb-4 space-y-2">
          <p className="text-xs truncate text-gray-800">
            Product: {product.name}
          </p>
          <div className='flex justify-between items-center'>

          <p className="text-xs truncate  text-gray-800">
            Product ID: {product.item_id}
          </p>
          <p className={`text-xs  ${
            product.countInStock > 10
            ? 'text-green-700'
            : product.countInStock > 0
            ? 'text-yellow-700'
                          : 'text-red-700'
                        } mt-1`}>
            In Stock: {product.countInStock} NOS
          </p>
                        </div>
          <p className="text-xs text-gray-500 mt-1">
            Current Updating In Sqft: {sqqty}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-600 mb-2">
            New Quantity
          </label>
          <input
            type="number"
            value={newQuantity}
            ref={stockRef}
            onChange={(e) => setNewQuantity(e.target.value)}
            onKeyDown={(e)=> {if(e.key === "Enter") handleUpdate()}}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            min="1"
            placeholder="Enter New Quantity"
          />
        </div>

        <div className="flex justify-end">
          <button
            className="bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 mr-2"
            onClick={()=> handleUpdate()}
          >
            Update Product
          </button>
        </div>
      </div>
    </div>
  );
}
