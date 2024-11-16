// src/components/SummaryModal.js
import React from 'react';
import PropTypes from 'prop-types';

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
  handleLocalSave
}) {
  const remainingAmount = ((totalAmount - discount) - receivedAmount).toFixed(2);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-full overflow-y-auto">
        <div className="p-6">
            <div className='flex justify-between items-center mb-5'>
          <h2 className="text-xs text-red-500 font-bold">Billing Summary</h2>
          <p onClick={onClose} className='font-bold text-gray-500 cursor-pointer bg-gray-300 px-2 rounded-md'>X</p>
            </div>
          <p className='text-md font-bold mt-2 text-gray-600'>
            <strong>Invoice No:</strong> {invoiceNo || "N/A"}
          </p>
          <div className='flex justify-between'>
            <div>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>Customer Name:</strong> {customerName || "N/A"}
          </p>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>Salesman:</strong> {salesmanName || "N/A"}
          </p>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>Total Products:</strong> {totalProducts}
          </p>
          <p className='text-xs mt-4 text-gray-600'>
            <strong>Sub Total:</strong> {amountWithoutGST.toFixed(2)}
          </p>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>CGST (9%):</strong> {cgst.toFixed(2)}
          </p>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>SGST (9%):</strong> {sgst.toFixed(2)}
          </p>
            </div>
            <div>
            <p className='text-xs mt-2 text-gray-600'>
            <strong>Amount Paid:</strong> {receivedAmount}
          </p>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>Payment Method:</strong> {paymentMethod}
          </p>
          <p className='text-xs mt-2 text-gray-600'>
            <strong>Received Date:</strong> {new Date(receivedDate? receivedDate : new Date()).toLocaleDateString() || "N/A"}
          </p>
            <p className='text-xs mt-2 text-gray-600'>
            <strong>Remaining Amount:</strong> {remainingAmount}
          </p>
          <div>
          </div>
            </div>
          </div>
          <p className='text-xs font-bold mt-2 text-gray-600'>
            <strong>Bill Amount:</strong> ₹{totalAmount.toFixed(2)}
          </p>
          <p className='text-xs font-bold mt-2 text-gray-600'>
            <strong>Discount:</strong> {(discount).toFixed(2)}
          </p>
          <p className='text-md font-bold mt-2 text-gray-600'>
            <strong>Total Amount:</strong> ₹{(totalAmount - discount).toFixed(2)}
          </p>

          {/* Payment Details */}
          <div className="mt-4">
            <label className="block text-xs">Discount</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
              placeholder="Enter Discount"
            />

            <label className="block text-xs">Received Amount</label>
            <input
              type="number"
              placeholder="Enter Received Amount"
              min={0}
              value={receivedAmount}
              onChange={(e) =>
                setReceivedAmount(Math.min(parseFloat(e.target.value) || 0, totalAmount))
              }
              className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
            />

            <label className="block text-xs">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online</option>
            </select>

            <label className="block text-xs">Received Date</label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full border-gray-300 px-4 py-2 mb-4 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end">
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
              {isSubmitting ? 'Submitting...' : 'Submit Billing'}
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
