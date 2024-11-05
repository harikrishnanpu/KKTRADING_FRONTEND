import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function AllPurchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);  // For modal details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all purchases from the server
    api.get('/api/products/purchases/all')
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
      try {
        await api.delete(`/api/products/purchases/delete/${id}`);
        setPurchases(purchases.filter(purchase => purchase._id !== id));
      } catch (error) {
        setError('Error Occurred');
      }
    }
  };

  const handleView = (purchase) => setSelectedPurchase(purchase);

  const closeModal = () => setSelectedPurchase(null);

  const generatePDF = (purchase) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.setFont("Helvetica", "bold");
    doc.text('Purchase Invoice', 14, 22);

    const invoiceDate = new Date(purchase.createdAt);
    doc.setFontSize(12);
    doc.text(`Invoice No: ${purchase.invoiceNo}`, 14, 40);
    doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 14, 50);
    doc.text(`Supplier Name: ${purchase.sellerName}`, 14, 60);

    doc.autoTable({
      head: [['Item ID', 'Name', 'Quantity', 'Price', 'Total']],
      body: purchase.items.map(product => [
        product.item_id || 'N/A',
        product.name || 'N/A',
        product.quantity ? product.quantity.toString() : '0',
        product.price ? product.price.toFixed(2) : '0.00',
        (product.price * product.quantity).toFixed(2),
      ]),
      startY: 75,
      theme: 'striped',
      styles: { overflow: 'linebreak', fontSize: 10 },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 70 }, 2: { cellWidth: 30 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 } },
    });

    const total = purchase.items.reduce((sum, product) => sum + (product.price * product.quantity || 0), 0);
    doc.text(`Total: $${total.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 10);
    doc.save('invoice.pdf');
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

  return (
    <div>
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div onClick={() => { window.history.back(); }} className="text-center cursor-pointer">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">Purchase Listing and Management</p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>
      <div className="container mx-auto p-6">

        {/* Card layout for mobile screens */}
        <div className="lg:hidden space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase._id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 onClick={() => navigate(`/purchase/edit/${purchase._id}`)} className="text-lg font-semibold text-red-600 mb-2 cursor-pointer">
                Invoice No: {purchase.invoiceNo}
              </h3>
              <p className="text-xs font-bold mb-1 text-gray-500">Invoice Date: {new Date(purchase.createdAt).toLocaleDateString()}</p>
              <p className="text-xs font-bold mb-1 text-gray-500">Seller Name: {purchase.sellerName}</p>
              <p className="text-xs font-bold mb-1 text-gray-500">Seller Name: {purchase.sellerName}</p>
              <div className="mt-4 text-xs font-bold flex space-x-2">
                <button
                  className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  onClick={() => generatePDF(purchase)}
                >
                  <i className="fa fa-file-pdf-o mr-1"></i> PDF
                </button>
                <button
                  className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  onClick={() => handleView(purchase)}
                >
                  <i className="fa fa-eye mr-1"></i> View
                </button>
                <button
                  className="flex-grow font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
                >
                  <i className="fa fa-edit mr-1"></i> Edit
                </button>
                <button
                  className="flex-grow bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  onClick={() => handleRemove(purchase._id)}
                >
                  <i className="fa fa-trash mr-1"></i> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Table layout for larger screens */}
        <div className="hidden lg:block">
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Invoice No</th>
                <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Invoice Date</th>
                <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Supplier Name</th>
                <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Total Products</th>
                <th className="px-4 py-2 text-xs text-left text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50 transition">
                  <td className="border-t text-xs px-4 py-2 text-gray-600 font-bold">{purchase.invoiceNo}</td>
                  <td className="border-t text-xs px-4 py-2 text-gray-600">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                  <td className="border-t text-xs px-4 py-2 text-gray-600">{purchase.sellerName}</td>
                  <td className="border-t text-xs px-4 py-2 text-gray-600">{purchase.items.length}</td>
                  <td className="border-t px-4 py-2">
                    <div className="flex text-xs space-x-2">
                      <button
                        className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => generatePDF(purchase)}
                      >
                        <i className="fa fa-file-pdf-o mr-1"></i> PDF
                      </button>
                      <button
                        className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleView(purchase)}
                      >
                        <i className="fa fa-eye mr-1"></i> View
                      </button>
                      <button
                        className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
                      >
                        <i className="fa fa-edit mr-1"></i> Edit
                      </button>
                      <button
                        className="bg-red-500 font-bold text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleRemove(purchase._id)}
                      >
                        <i className="fa fa-trash mr-1"></i> Remove
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
          <div className="fixed p-4 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg relative">
              <button className="absolute top-4 right-4 text-gray-600 hover:text-gray-900" onClick={closeModal}>
                <i className="fa fa-times"></i>
              </button>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Purchase Details</h2>
              <p className="text-xs"><strong>Seller:</strong> {selectedPurchase.sellerName}</p>
              <p className="text-xs"><strong>Invoice No:</strong> {selectedPurchase.invoiceNo}</p>
              <p className="text-xs"><strong>Purchase Date:</strong> {new Date(selectedPurchase.createdAt).toLocaleDateString()}</p>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Items:</h3>
                <table className="min-w-full bg-white text-xs">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left font-semibold text-gray-700">Item Name</th>
                      <th className="py-2 px-4 border-b text-left font-semibold text-gray-700">Item ID</th>
                      <th className="py-2 px-4 border-b text-left font-semibold text-gray-700">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 px-4 border-b text-gray-600">{item.name}</td>
                        <td className="py-2 px-4 border-b text-gray-600">{item.itemId}</td>
                        <td className="py-2 px-4 border-b text-gray-600">{item.quantity} Nos</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* <button
                className="mt-6 w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition text-xs"
                onClick={closeModal}
              >
                Close
              </button> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
