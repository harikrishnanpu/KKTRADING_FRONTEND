import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BillingList = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all billings from the backend
  const fetchBillings = async () => {
    try {
      const response = await Axios.get('/api/billing'); // Replace with your endpoint
      setBillings(response.data);
    } catch (err) {
      setError('Failed to fetch billings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const generatePDF = (billing) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Set color to a shade of blue
    doc.setFont("Helvetica", "bold"); // Set font to bold
    doc.text('Invoice', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal"); // Reset to normal

    // Convert invoiceDate to Date object if it's a string
    const invoiceDate = new Date(billing.invoiceDate);

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice No: ${billing.invoiceNo}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Salesman Name: ${billing.salesmanName}`, 14, 60);

    // Add Billing To Section
    doc.setFontSize(14);
    doc.text('Bill To:', 14, 75);

    doc.setFontSize(12);
    doc.text(`Customer Name: ${billing.customerName}`, 14, 85);
    doc.text(`Customer Address: ${billing.customerAddress}`, 14, 95);

    // Start table for products
    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price', 'Total']],
      body: billing.products.map(product => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        product.price ? product.price.toFixed(2) : '0.00',
        (product.price * product.quantity).toFixed(2) // Total price
      ]),
      startY: 105, // Position the table after invoice details
      theme: 'striped', // Optional: adds a striped theme to the table
      styles: {
        overflow: 'linebreak', // Allow line breaks
        cellWidth: 'auto', // Automatically adjust cell width
        fontSize: 10, // Adjust font size as needed
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Set specific widths for columns if needed
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
    });

    // Calculate total
    const total = billing.products.reduce((sum, product) => {
      return sum + (product.price * product.quantity || 0);
    }, 0);

    // Add Total Section
    const finalY = doc.autoTable.previous.finalY + 10; // Positioning based on previous table
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 14, finalY); // Add total amount

    // Finalize the PDF and download
    doc.save('invoice.pdf'); // Download the PDF
  };

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-600">KK Trading</h1>
        <p className='font-bold mb-5'>All Billings</p>
        {billings.length === 0 ? (
          <p className="text-center text-gray-600">No billing records found.</p>
        ) : (
          <>
            {/* Table layout for larger screens */}
            <div className="hidden md:block">
              <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Invoice No</th>
                    <th className="px-4 py-2 text-left">Invoice Date</th>
                    <th className="px-4 py-2 text-left">Salesman Name</th>
                    <th className="px-4 py-2 text-left">Customer Name</th>
                    <th className="px-4 py-2 text-left">Total Products</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map((billing) => (
                    <tr key={billing.invoiceNo} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{billing.invoiceNo}</td>
                      <td className="border px-4 py-2">{new Date(billing.invoiceDate).toLocaleDateString()}</td>
                      <td className="border px-4 py-2">{billing.salesmanName}</td>
                      <td className="border px-4 py-2">{billing.customerName}</td>
                      <td className="border px-4 py-2">{billing.products.length}</td>
                      <td className="border px-4 py-2">
                        <button
                          className="text-blue-500 hover:underline"
                          onClick={() => generatePDF(billing)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card layout for mobile screens */}
            <div className="md:hidden space-y-4">
              {billings.map((billing) => (
                <div key={billing.invoiceNo} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Invoice No: {billing.invoiceNo}
                  </h3>
                  <p className="text-sm mb-1">Invoice Date: {new Date(billing.invoiceDate).toLocaleDateString()}</p>
                  <p className="text-sm mb-1">Customer: {billing.customerName}</p>
                  <p className="text-sm font-semibold mb-2">Products:</p>
                  <ul className="pl-4 list-disc text-sm text-gray-600">
                    {billing.products.map((product) => (
                      <li key={product.item_id}>
                        {product.name} (Qty: {product.quantity})
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(billing)}
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
    </>
  );
};

export default BillingList;
