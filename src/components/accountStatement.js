<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-auto">
<div className="bg-white rounded-lg p-5 w-full max-w-4xl relative">
  <button
    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
    onClick={closeModal}
  >
    <i className="fa fa-times"></i>
  </button>
  <div className="mt-2 p-2">
    <p className="text-sm text-gray-600 font-bold mb-2 text-red-600">
      Transactions for Account ID: {selectedAccount.accountId}
    </p>

    {/* Payments In */}
    <h3 className="text-sm font-bold text-red-600 mt-5">
      Payments In
    </h3>
    <div className="relative overflow-x-auto mb-6">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3">#</th>
            <th scope="col" className="px-4 py-3">Amount</th>
            <th scope="col" className="px-4 py-3">Method</th>
            <th scope="col" className="px-4 py-3">Remark</th>
            <th scope="col" className="px-4 py-3">Submitted By</th>
            <th scope="col" className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {selectedAccount.paymentsIn.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center text-xs py-2">
                No payments in.
              </td>
            </tr>
          ) : (
            selectedAccount.paymentsIn.map((payment, index) => (
              <tr
                key={index}
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-4 py-2 text-xs">{index + 1}</td>
                <td className="px-4 py-2 text-xs">{payment.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs">{payment.method}</td>
                <td className="px-4 py-2 text-xs">{payment.remark || '-'}</td>
                <td className="px-4 py-2 text-xs">{payment.submittedBy}</td>
                <td className="px-4 py-2 text-xs">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Payments Out */}
    <h3 className="text-sm font-bold text-red-600 mt-5">
      Payments Out
    </h3>
    <div className="relative overflow-x-auto mb-6">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3">#</th>
            <th scope="col" className="px-4 py-3">Amount</th>
            <th scope="col" className="px-4 py-3">Method</th>
            <th scope="col" className="px-4 py-3">Remark</th>
            <th scope="col" className="px-4 py-3">Submitted By</th>
            <th scope="col" className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {selectedAccount.paymentsOut.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center text-xs py-2">
                No payments out.
              </td>
            </tr>
          ) : (
            selectedAccount.paymentsOut.map((payment, index) => (
              <tr
                key={index}
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-4 py-2 text-xs">{index + 1}</td>
                <td className="px-4 py-2 text-xs">{payment.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-xs">{payment.method}</td>
                <td className="px-4 py-2 text-xs">{payment.remark || '-'}</td>
                <td className="px-4 py-2 text-xs">{payment.submittedBy}</td>
                <td className="px-4 py-2 text-xs">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Balance Amount */}
    <div className="mt-4 text-right mr-2">
      <p className="text-xs mb-1">
        Balance Amount:{' '}
        <span className="text-gray-600 font-bold">
          Rs. {selectedAccount.balanceAmount.toFixed(2)}
        </span>
      </p>
    </div>
  </div>
</div>
</div>