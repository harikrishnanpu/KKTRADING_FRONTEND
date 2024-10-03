import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Auto table plugin for jsPDF

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [error, setError] = useState('');

  // Fetch all returns from the server
  const fetchReturns = async () => {
    try {
      const { data } = await Axios.get('/api/returns');
      setReturns(data);
    } catch (err) {
      setError('Error fetching returns data');
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Function to generate PDF of a specific return
  const generateReturnPDF = (returnData) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Set color to a shade of red
    doc.setFont("Helvetica", "bold"); // Set font to bold
    doc.text('Return Bill', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal");

    // Convert returnDate to Date object if it's a string
    const returnDate = new Date(returnData.returnDate);

    // Add return details
    doc.setFontSize(12);
    doc.text(`Return No: ${returnData.returnNo}`, 14, 40);
    doc.text(`Return Date: ${returnDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Customer Name: ${returnData.customerName}`, 14, 60);

    // Add "Returned Products" section
    doc.setFontSize(14);
    doc.text('Returned Products:', 14, 75);

    // Table for Returned Products
    doc.autoTable({
      head: [['Item ID', 'Product Name', 'Quantity', 'Price per Unit', 'Total']],
      body: returnData.products.map(product => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        `$${product.price ? product.price.toFixed(2) : '0.00'}`,
        `$${(product.price * product.quantity).toFixed(2)}`
      ]),
      startY: 85, 
      theme: 'striped',
      styles: {
        cellPadding: 4,
        fontSize: 10,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    const totalReturnValue = returnData.products.reduce((sum, product) => sum + (product.price * product.quantity || 0), 0);
    const finalY = doc.autoTable.previous.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Return Value: $${totalReturnValue.toFixed(2)}`, 14, finalY);
    doc.save(`Return_${returnData.returnNo}.pdf`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 md:p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-red-600">All Returns</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {returns.length === 0 ? (
          <p className="text-gray-600 text-center">No returns found.</p>
        ) : (
          <>
            {/* Responsive table for larger screens */}
            <div className="hidden md:block">
              <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="border border-gray-300 px-4 py-2">Return No</th>
                    <th className="border border-gray-300 px-4 py-2">Return Date</th>
                    <th className="border border-gray-300 px-4 py-2">Customer Name</th>
                    <th className="border border-gray-300 px-4 py-2">Products</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnEntry) => (
                    <tr key={returnEntry.returnNo} className="hover:bg-gray-100 transition duration-300 ease-in-out">
                      <td className="border border-gray-300 px-4 py-2">{returnEntry.returnNo}</td>
                      <td className="border border-gray-300 px-4 py-2">{new Date(returnEntry.returnData).toLocaleDateString()}</td>
                      <td className="border border-gray-300 px-4 py-2">{returnEntry.customerName}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {returnEntry.products.map((product) => (
                          <div key={product.item_id}>
                            {product.name} (Qty: {product.quantity})
                          </div>
                        ))}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                          onClick={() => generateReturnPDF(returnEntry)}
                        >
                          View PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card layout for mobile screens */}
            <div className="md:hidden space-y-4">
              {returns.map((returnEntry) => (
                <div key={returnEntry.returnNo} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Return No: {returnEntry.returnNo}
                  </h3>
                  <p className="text-sm mb-1">Return Date: {returnEntry.returnDate}</p>
                  <p className="text-sm mb-1">Customer: {returnEntry.customerName}</p>
                  <p className="text-sm font-semibold mb-2">Products:</p>
                  <ul className="pl-4 list-disc text-sm">
                    {returnEntry.products.map((product) => (
                      <li key={product.item_id}>
                        {product.name} (Qty: {product.quantity})
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generateReturnPDF(returnEntry)}
                    >
                      View PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
