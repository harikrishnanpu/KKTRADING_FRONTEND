// DeliveredProducts.jsx
import React, { useState, useEffect } from "react";
import api from "../screens/api";
import PropTypes from "prop-types";

const DeliveredProducts = ({ dp, handleDeliveredQuantityChange, billIndex }) => {
  const [deliveredBoxes, setDeliveredBoxes] = useState(0);
  const [deliveredPieces, setDeliveredPieces] = useState(0);
  const [psRatio, setPsRatio] = useState(1); // Default to 1 to handle psRatio <=1
  const [maxBoxes, setMaxBoxes] = useState(0);
  const [maxPieces, setMaxPieces] = useState(dp.pendingQuantity);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPsRatio = async () => {
      try {
        const response = await api.get(`/api/users/driver/getPSratio/${dp.item_id}`);
        const fetchedPsRatio = parseFloat(response.data.psRatio);
        if (isNaN(fetchedPsRatio) || fetchedPsRatio < 1) {
          setPsRatio(1);
        } else {
          setPsRatio(fetchedPsRatio);
        }
      } catch (err) {
        console.error("Error fetching PS ratio:", err);
        setPsRatio(1); // Fallback to 1 if error occurs
      }
    };

    fetchPsRatio();
  }, [dp.item_id]);

  useEffect(() => {
    // Calculate maximum boxes and pieces based on pendingQuantity
    const calculateMax = () => {
      const total = parseInt(dp.pendingQuantity, 10) || 0;
      if (psRatio > 1) {
        const boxes = Math.floor(total / psRatio);
        const pieces = total % psRatio;
        setMaxBoxes(boxes);
        setMaxPieces(pieces);
      } else {
        setMaxBoxes(0);
        setMaxPieces(total);
      }
    };

    calculateMax();
  }, [psRatio, dp.pendingQuantity]);

  useEffect(() => {
    // Initialize deliveredBoxes and deliveredPieces based on deliveredQuantity
    const initializeDelivered = () => {
      const totalDelivered = parseInt(dp.deliveredQuantity, 10) || 0;
      if (psRatio > 1) {
        const boxes = Math.floor(totalDelivered / psRatio);
        const pieces = totalDelivered % psRatio;
        setDeliveredBoxes(boxes);
        setDeliveredPieces(pieces);
      } else {
        setDeliveredBoxes(0);
        setDeliveredPieces(totalDelivered);
      }
    };

    initializeDelivered();
  }, [psRatio, dp.deliveredQuantity]);

  const handleBoxChange = (value) => {
    const boxes = parseInt(value, 10);
    if (isNaN(boxes) || boxes < 0) return;
    if (boxes > maxBoxes) {
      setError(`Maximum available boxes: ${maxBoxes}`);
      setDeliveredBoxes(maxBoxes);
      handleDeliveredQuantityChange(billIndex, dp.item_id, maxBoxes * psRatio + deliveredPieces);
      return;
    }
    setError("");
    setDeliveredBoxes(boxes);
    const totalDelivered = boxes * psRatio + deliveredPieces;
    handleDeliveredQuantityChange(billIndex, dp.item_id, totalDelivered);
  };

  const handlePieceChange = (value) => {
    const pieces = parseInt(value, 10);
    if (isNaN(pieces) || pieces < 0) return;

    if (psRatio > 1) {
      if (pieces > psRatio - 1) {
        setError(`Maximum available pieces: ${psRatio - 1}`);
        setDeliveredPieces(psRatio - 1);
        handleDeliveredQuantityChange(billIndex, dp.item_id, deliveredBoxes * psRatio + (psRatio - 1));
        return;
      }
    }

    // Calculate total delivered and ensure it does not exceed pendingQuantity
    const potentialTotal = deliveredBoxes * psRatio + pieces;
    if (potentialTotal > dp.pendingQuantity) {
      setError(`Total delivered exceeds pending quantity (${dp.pendingQuantity})`);
      setDeliveredPieces(Math.max(0, dp.pendingQuantity - deliveredBoxes * psRatio));
      handleDeliveredQuantityChange(
        billIndex,
        dp.item_id,
        deliveredBoxes * psRatio + Math.max(0, dp.pendingQuantity - deliveredBoxes * psRatio)
      );
      return;
    }

    setError("");
    setDeliveredPieces(pieces);
    const totalDelivered = deliveredBoxes * psRatio + pieces;
    handleDeliveredQuantityChange(billIndex, dp.item_id, totalDelivered);
  };

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm">
      {/* Product Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-sm text-gray-600">Product:</span>
        <span className="text-sm">{dp.name}</span>
      </div>

      {/* Product Details */}
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <div>
          <span className="font-bold">ID:</span> {dp.item_id}
        </div>
        <div>
          <span className="font-bold">Qty Ordered:</span> {dp.quantity}
        </div>
        <div>
          <span className="font-bold">Pending:</span> {dp.pendingQuantity}
        </div>
      </div>

      {/* Box and Remaining Quantities */}
      <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
        <span className="font-bold">Box & Remaining:</span>
        <span>
          {psRatio > 1
            ? `${maxBoxes} Box${maxBoxes !== 1 ? "es" : ""} and ${maxPieces} piece${maxPieces !== 1 ? "s" : ""}`
            : `${maxPieces} piece${maxPieces !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Delivered Quantity Inputs */}
      {psRatio > 1 ? (
        <div className="flex flex-col gap-2 mb-4">
          {/* Delivered Boxes Input */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-xs text-gray-600">Delivered (Boxes):</label>
            <input
              type="number"
              min="0"
              max={maxBoxes}
              className="px-2 py-1 text-xs border rounded-md w-20"
              value={deliveredBoxes}
              onChange={(e) => handleBoxChange(e.target.value)}
            />
          </div>
          {/* Delivered Pieces Input */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-xs text-gray-600">Delivered (Pieces):</label>
            <input
              type="number"
              min="0"
              max={psRatio > 1 ? psRatio - 1 : maxPieces}
              className="px-2 py-1 text-xs border rounded-md w-20"
              value={deliveredPieces}
              onChange={(e) => handlePieceChange(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4">
          <label className="font-bold text-xs text-gray-600">Delivered (Pieces):</label>
          <input
            type="number"
            min="0"
            max={maxPieces}
            className="px-2 py-1 text-xs border rounded-md w-20"
            value={deliveredPieces}
            onChange={(e) => handlePieceChange(e.target.value)}
          />
        </div>
      )}

      {/* Delivered Quantity Display */}
      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span className="font-bold">Delivered Qty:</span>
        <span>{dp.deliveredQuantity || 0} {psRatio > 1 ? `pcs (${deliveredBoxes} boxes + ${deliveredPieces} pcs)` : 'pcs'}</span>
      </div>

      {/* Delivery Status */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span className="font-bold">Delivery Status:</span>
        <i
          className={`fa ${
            dp.isDelivered ? "fa-check text-green-500" : "fa-times text-red-500"
          }`}
        ></i>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

DeliveredProducts.propTypes = {
  dp: PropTypes.shape({
    name: PropTypes.string.isRequired,
    item_id: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    pendingQuantity: PropTypes.number.isRequired,
    deliveredQuantity: PropTypes.number,
    isDelivered: PropTypes.bool,
    isPartiallyDelivered: PropTypes.bool,
  }).isRequired,
  handleDeliveredQuantityChange: PropTypes.func.isRequired,
  billIndex: PropTypes.number.isRequired,
};

export default DeliveredProducts;
