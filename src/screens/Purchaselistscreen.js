import { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AllPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);  // For modal details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all purchases from the server
    axios.get('/api/products/purchases/all')
      .then(response => {
        setPurchases(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to load purchases. Please try again later.');
        setLoading(false);
        console.error('Error fetching purchase data:', error);
      });
  }, []);

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this purchase?')) {
      try{
         await axios.delete(`/api/products/purchases/delete/${id}`)
      }catch(error){
        setError('Error Occured')
      }
      setPurchases(purchases.filter(purchase => purchase._id !== id));
    }
  };

  const handleView = (purchase) => {
    setSelectedPurchase(purchase);
  };

  const closeModal = () => {
    setSelectedPurchase(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  const generatePDF = (purchase) => {
    const doc = new jsPDF();

    // Set title with color and bold font
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Set color to a shade of blue
    doc.setFont("Helvetica", "bold"); // Set font to bold
    doc.text('Purchase Invoice', 14, 22);

    // Reset font style for other texts
    doc.setFont("Helvetica", "normal"); // Reset to normal

    // Convert invoiceDate to Date object if it's a string
    const invoiceDate = new Date(purchase.createdAt);

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice No: ${purchase.invoiceNo}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Supplier Name: ${purchase.sellerName}`, 14, 60);

    // Add Billing To Section
    doc.setFontSize(14);
    doc.text('Bill To:', 14, 75);

    // doc.setFontSize(12);
    // doc.text(`Customer Name: ${purchase.customerName}`, 14, 85);
    // doc.text(`Customer Address: ${billing.customerAddress}`, 14, 95);

    // Start table for products
    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price', 'Total']],
      body: purchase.items.map(product => [
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
    const total = purchase.items.reduce((sum, product) => {
      return sum + (product.price * product.quantity || 0);
    }, 0);

    // Add Total Section
    const finalY = doc.autoTable.previous.finalY + 10; // Positioning based on previous table
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 14, finalY); // Add total amount

    // Finalize the PDF and download
    doc.save('invoice.pdf'); // Download the PDF
  }

  return (
    <div>
        <div className="flex justify-between mt-5 mx-4">
        <div>
        <a href="/" className="font-bold text-blue-500"><i className="fa fa-angle-left" />Back</a>
        </div>
        <h1 className="text-2xl text-red-600 font-semibold">KK Trading</h1>
      </div>
    <div className="container mx-auto p-6">
      <p className="text-lg font-bold mb-6 text-left text-gray-600">Purchase History</p>

          {/* Card layout for mobile screens */}
          <div className="lg:hidden space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase._id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Invoice No: {purchase.invoiceNo}
                  </h3>
                  <p className="text-sm mb-1">Invoice Date: {new Date(purchase.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm mb-1">Seller Name: {purchase.sellerName}</p>
                  <p className="text-sm font-semibold mb-2">Products:</p>
                  <ul className="pl-4 list-disc text-sm text-gray-600">
                    {purchase.items.map((product,index) => (
                      <li key={index}>
                        {product.name} (Qty: {product.quantity})
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(purchase)}
                    >
                      View PDF
                    </button>
                    <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleView(purchase)}
                  >
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(purchase._id)}
                  >
                    <i className="fa fa-trash mr-2"></i> Remove
                  </button>
                  </div>
                </div>
              ))}
            </div>

             {/* Table layout for larger screens */}
             <div className="hidden lg:block">
              <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Invoice No</th>
                    <th className="px-4 py-2 text-left">Invoice Date</th>
                    <th className="px-4 py-2 text-left">Supplier Name</th>
                    <th className="px-4 py-2 text-left">Total Products</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase._id} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{purchase.invoiceNo}</td>
                      <td className="border px-4 py-2">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                      <td className="border px-4 py-2">{purchase.sellerName}</td>
                      <td className="border px-4 py-2">{purchase.items.length}</td>
                      <td className="border px-4 py-2">
                      <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                      onClick={() => generatePDF(purchase)}
                    >
                      View PDF
                    </button>
                    <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleView(purchase)}
                  >
                    <i className="fa fa-eye mr-2"></i> View
                  </button>
                  <button 
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemove(purchase._id)}
                  >
                    <i className="fa fa-trash mr-2"></i> Remove
                  </button>
                  </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

      {/* Modal for Viewing Details */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
            <button 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Purchase Details</h2>
            <p><strong>Seller:</strong> {selectedPurchase.sellerName}</p>
            <p><strong>Invoice No:</strong> {selectedPurchase.invoiceNo}</p>
            <p><strong>Purchase Date:</strong> {new Date(selectedPurchase.createdAt).toLocaleDateString()}</p>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Items:</h3>
              <ul className="list-inside list-[square] ml-5">
                {selectedPurchase.items.map((item, index) => (
                  <>
                  <li key={index} className="text-gray-600 flex">
                    <span class="bg-golden-gradient bg-clip-text text-transparent">Test1</span>
                  </li>
                  <li className='flex '>
                  <p className='text-sm'>{item.name} </p> 
                  <p className='text-sm font-bold'> - {item.itemId} </p>
                  <p className='text-sm'> -- {item.quantity} Nos</p>
                  </li>
                  </>
                ))}
              </ul>
            </div>

            <button 
              className="mt-6 w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition duration-150"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
