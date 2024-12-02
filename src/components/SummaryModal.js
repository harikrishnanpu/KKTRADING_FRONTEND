// src/components/SummaryModal.js
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

export default function SummaryModal({
  customerName,
  invoiceNo,
  totalAmount,
  amountWithoutGST,
  cgst,
  sgst,
  discount,
  setDiscount,
  receivedAmount,
  setReceivedAmount,
  paymentMethod,
  setPaymentMethod,
  receivedDate,
  setReceivedDate,
  onClose,
  onSubmit,
  isSubmitting,
  salesmanName,
  totalProducts,
  handleLocalSave,
  unloading,
  setUnloading,
  transportation,
  setTransportation,
  handling,
  setHandling,
  remark,
  setRemark,
  grandTotal,
  accounts,
  discountRef,
  paymentMethodRef,
  receivedDateRef,
  unloadingRef,
  transportationRef,
  handlingRef,
  remarkRef,
  changeRef,
  receivedAmountRef,
}) {
  const remainingAmount = (parseFloat(parseFloat(totalAmount) - discount) - parseFloat(receivedAmount)).toFixed(2);

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const [fetchedReceivedAmount,setFetchedReceivedAmount] = useState(0);
  const [fetchedRemainingAmount , setFetchedRemainingAmount] = useState(0);

  useEffect(()=>{
    setFetchedReceivedAmount(receivedAmount);
    setFetchedRemainingAmount((parseFloat(parseFloat(totalAmount) - discount) - parseFloat(receivedAmount)).toFixed(2));
  },[discount])




  const mainRef = useRef();


  return (
    <div className="fixed inset-0 flex justify-center z-50 bg-black bg-opacity-50">
      <div ref={mainRef} className="bg-white rounded-lg mt-auto shadow-lg max-w-4xl h-3/4 w-full overflow-y-auto animate-slide-up">
        <div className="p-6">
            <div className='flex justify-between items-center mb-5'>
            <p className='text-sm font-bold mt-2 text-red-600'>
            <strong>Invoice No:</strong> {invoiceNo || "N/A"}
          </p>
          <p  onClick={() => {
            mainRef.current.classList.remove('animate-slide-up');
            mainRef.current.classList.add('animate-slide-down');
            setTimeout(() => {
              mainRef.current.classList.remove('animate-slide-down');
              onClose();
            }, 200);
          }} className='font-bold text-gray-500 cursor-pointer bg-gray-300 px-2 rounded-md'>X</p>
            </div>
          <p className='text-xs font-bold mt-2 text-gray-600'>
            <strong>Discount:</strong> {(discount).toFixed(2)}
          </p>
          <p className='text-xs font-bold mt-2 text-gray-600'>
            <strong>Bill Amount:</strong> ₹{parseFloat(totalAmount).toFixed(2)}
          </p>
          <p className='text-sm font-bold mt-2 text-gray-600'>
            <strong>Total Amount:</strong> ₹{(parseFloat(grandTotal)).toFixed(2)}
          </p>

          {/* Payment Details */}
         {userInfo.isAdmin && 
         
         <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs">Discount</label>
            <input
              type="number"
              ref={discountRef}
              value={discount || 0}
              onKeyDown={(e)=> changeRef(e, receivedAmountRef)}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              placeholder="Enter Discount"
            />
            </div>

            <div>

            <label className="block text-xs">Received Amount</label>
            <input
            ref={receivedAmountRef}
              type="number"
              placeholder="Enter Received Amount"
              value={receivedAmount || 0}
              onKeyDown={(e)=> changeRef(e, paymentMethodRef)}
              onChange={(e) =>
                setReceivedAmount(Math.min(parseFloat(e.target.value) || 0, parseFloat(fetchedRemainingAmount)))
              }
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            />
            </div>

            <div>

            <label className="block text-xs">Payment Method</label>
            <select
            ref={paymentMethodRef}
              value={paymentMethod}
              onKeyDown={(e)=> changeRef(e, receivedDateRef)}

              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            >
      {accounts.map((acc) => (
        <option key={acc.accountId} value={acc.accountId}>
          {acc.accountName}
        </option>
      ))}
            </select>

            </div>
            <div>

            <label className="block text-xs">Received Date</label>
            <input
            ref={receivedDateRef}
            onKeyDown={(e)=> changeRef(e, unloadingRef)}
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            />

            </div>

            <div>

<label className="block text-xs">Unloading Charge</label>
<input
  type="number"
  onKeyDown={(e)=> changeRef(e, transportationRef)}
  ref={unloadingRef}
  placeholder="Enter Unloading Charge"
  value={unloading || 0}
  onChange={(e) =>
    setUnloading(parseFloat(e.target.value))
  }
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>

<div>

<label className="block text-xs">Transportation Charge</label>
<input
  type="number"
  onKeyDown={(e)=> changeRef(e, handlingRef)}
  ref={transportationRef}
  placeholder="Enter Received Amount"
  value={transportation || 0}
  onChange={(e) =>
    setTransportation(parseFloat(e.target.value))
  }
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>



<div>

<label className="block text-xs">Handling / Other Charges</label>
<input
  type="number"
  ref={handlingRef}
  placeholder="Enter Handling Charge"
  value={handling || 0}
  onChange={(e) =>
    setHandling(parseFloat(e.target.value))
  }
  onKeyDown={(e)=> changeRef(e, remarkRef)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>

<div>

<label className="block text-xs">Bill Remark</label>
<input
  type="text"
  ref={remarkRef}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      onSubmit(); // Corrected to match the prop name
    }
  }}
  placeholder="Enter Remark"
  value={remark}
  onChange={(e) => 
    setRemark(e.target.value)
  }
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>
          </div> }

          {/* Modal Actions */}
          <div className="flex justify-end mt-5">
            <button
              onClick={()=> { if(handleLocalSave) handleLocalSave(); else  alert('Update the bill by clicking the submit button') }}
              className="bg-red-500 text-xs font-bold text-white px-4 py-2 rounded mr-2 hover:bg-red-600"
            >
              Save
            </button>
            <button
              onClick={onSubmit}
              className="bg-red-500 text-xs font-bold text-white px-4 py-2 rounded hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : userInfo.isAdmin ?  'Submit Billing' : 'Submit Estimate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// PropTypes for type checking
SummaryModal.propTypes = {
  customerName: PropTypes.string.isRequired,
  invoiceNo: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
  amountWithoutGST: PropTypes.number.isRequired,
  cgst: PropTypes.number.isRequired,
  sgst: PropTypes.number.isRequired,
  discount: PropTypes.number.isRequired,
  setDiscount: PropTypes.func.isRequired,
  receivedAmount: PropTypes.number.isRequired,
  setReceivedAmount: PropTypes.func.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  setPaymentMethod: PropTypes.func.isRequired,
  receivedDate: PropTypes.string.isRequired,
  setReceivedDate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};
