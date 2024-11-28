// DeliveredProducts.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../screens/api";
import PropTypes from "prop-types";
import debounce from "lodash.debounce";

const DeliveredProducts = ({ dp, handleDeliveredQuantityChange, billIndex }) => {
  const [deliveredBoxesInput, setDeliveredBoxesInput] = useState("");
  const [deliveredPiecesInput, setDeliveredPiecesInput] = useState("");
  const [deliveredBoxes, setDeliveredBoxes] = useState(0);
  const [deliveredPieces, setDeliveredPieces] = useState(0);
  const [psRatio, setPsRatio] = useState(1); // Default to 1 to handle psRatio <=1
  const [maxBoxes, setMaxBoxes] = useState(0);
  const [maxPieces, setMaxPieces] = useState(dp.pendingQuantity);
  const [error, setError] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  // Fetch PS Ratio
  useEffect(() => {
    const fetchPsRatio = async () => {
      try {
        const response = await api.get(`/api/users/driver/getPSratio/${dp.item_id}`);
        const fetchedPsRatio = parseFloat(response.data.psRatio);
        setPsRatio(isNaN(fetchedPsRatio) || fetchedPsRatio < 1 ? 1 : fetchedPsRatio);
      } catch (err) {
        console.error("Error fetching PS ratio:", err);
        setPsRatio(1); // Fallback to 1 if error occurs
      }
    };

    fetchPsRatio();
  }, [dp.item_id]);

  // Calculate Maximum Boxes and Pieces
  useEffect(() => {
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
  }, [psRatio, dp.pendingQuantity]);

  // Initialize Delivered Boxes and Pieces
  useEffect(() => {
    const totalDelivered = parseInt(dp.deliveredQuantity, 10) || 0;
    if (psRatio > 1) {
      const boxes = Math.floor(totalDelivered / psRatio);
      const pieces = totalDelivered % psRatio;
      setDeliveredBoxesInput(boxes.toString());
      setDeliveredPiecesInput(pieces.toString());
      setDeliveredBoxes(boxes);
      setDeliveredPieces(pieces);
    } else {
      setDeliveredBoxesInput("0");
      setDeliveredPiecesInput(totalDelivered.toString());
      setDeliveredBoxes(0);
      setDeliveredPieces(totalDelivered);
    }
  }, [psRatio, dp.deliveredQuantity]);

  // Debounced Handlers
  const debouncedHandleDeliveredQuantityChange = useCallback(
    debounce((newTotal) => {
      handleDeliveredQuantityChange(billIndex, dp.item_id, newTotal);
    }, 300),
    [billIndex, dp.item_id, handleDeliveredQuantityChange]
  );

  // Handle Boxes Input Change
  const handleBoxChange = (value) => {
    setDeliveredBoxesInput(value);
    const boxes = parseInt(value, 10);
    if (isNaN(boxes) || boxes < 0) {
      setError("Please enter a valid number of boxes.");
      return;
    }

    if (boxes > maxBoxes) {
      setError(`Maximum available boxes: ${maxBoxes}`);
      setDeliveredBoxes(maxBoxes);
      setDeliveredBoxesInput(maxBoxes.toString());
      const totalDelivered = maxBoxes * psRatio + deliveredPieces;
      debouncedHandleDeliveredQuantityChange(totalDelivered);
    } else {
      setError("");
      setDeliveredBoxes(boxes);
      const totalDelivered = boxes * psRatio + deliveredPieces;
      debouncedHandleDeliveredQuantityChange(totalDelivered);
    }
  };

  // Handle Pieces Input Change
  const handlePieceChange = (value) => {
    setDeliveredPiecesInput(value);
    const pieces = parseInt(value, 10);
    if (isNaN(pieces) || pieces < 0) {
      setError("Please enter a valid number of pieces.");
      return;
    }

    if (psRatio > 1 && pieces > psRatio - 1) {
      setError(`Maximum available pieces: ${psRatio - 1}`);
      setDeliveredPieces(psRatio - 1);
      setDeliveredPiecesInput((psRatio - 1).toString());
      const totalDelivered = deliveredBoxes * psRatio + (psRatio - 1);
      debouncedHandleDeliveredQuantityChange(totalDelivered);
      return;
    }

    // Calculate total delivered and ensure it does not exceed pendingQuantity
    const potentialTotal = deliveredBoxes * psRatio + pieces;
    if (potentialTotal > dp.pendingQuantity) {
      setError(`Total delivered exceeds pending quantity (${dp.pendingQuantity})`);
      const adjustedPieces = Math.max(0, dp.pendingQuantity - deliveredBoxes * psRatio);
      setDeliveredPieces(adjustedPieces);
      setDeliveredPiecesInput(adjustedPieces.toString());
      const totalDelivered = deliveredBoxes * psRatio + adjustedPieces;
      debouncedHandleDeliveredQuantityChange(totalDelivered);
      return;
    }

    setError("");
    setDeliveredPieces(pieces);
    const totalDelivered = deliveredBoxes * psRatio + pieces;
    debouncedHandleDeliveredQuantityChange(totalDelivered);
  };

  // Handle Checkbox Change
  const handleCheckboxChange = () => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);

    if (newChecked) {
      // Set delivered quantities to match pending quantities
      setDeliveredBoxes(maxBoxes);
      setDeliveredBoxesInput(maxBoxes.toString());
      setDeliveredPieces(maxPieces);
      setDeliveredPiecesInput(maxPieces.toString());
      setError("");

      const totalDelivered = maxBoxes * psRatio + maxPieces;
      handleDeliveredQuantityChange(billIndex, dp.item_id, totalDelivered);
    } else {
      // Reset delivered quantities
      setDeliveredBoxes(0);
      setDeliveredPieces(0);
      setDeliveredBoxesInput("0");
      setDeliveredPiecesInput("0");
      setError("");
      handleDeliveredQuantityChange(billIndex, dp.item_id, 0);
    }
  };

  // Cleanup Debounce on Unmount
  useEffect(() => {
    return () => {
      debouncedHandleDeliveredQuantityChange.cancel();
    };
  }, [debouncedHandleDeliveredQuantityChange]);

  // Early return if pendingQuantity is 0 (handled by parent component)
  if (dp.pendingQuantity === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm mb-4">
      {/* Product Header with Checkbox */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="font-bold text-sm text-gray-600">Product:</span>
          <span className="text-sm ml-2">{dp.name}</span>
        </div>
        <div>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            className="form-checkbox h-4 w-4 outline-none focus:outline-none focus:ring-0 text-red-600"
          />
        </div>
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
      {!isChecked && (
        psRatio > 1 ? (
          <div className="flex flex-col gap-2 mb-4">
            {/* Delivered Boxes Input */}
            <div className="flex items-center gap-2">
              <label htmlFor={`boxes-${dp.item_id}`} className="font-bold text-xs text-gray-600">
                Delivered (Boxes):
              </label>
              <input
                id={`boxes-${dp.item_id}`}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`px-2 py-1 text-xs border rounded-md w-20 ${
                  error.includes("boxes") ? "border-red-500" : "border-gray-300"
                }`}
                value={deliveredBoxesInput}
                onChange={(e) => handleBoxChange(e.target.value)}
                min="0"
                max={maxBoxes}
                placeholder="0"
              />
            </div>
            {/* Delivered Pieces Input */}
            <div className="flex items-center gap-2">
              <label htmlFor={`pieces-${dp.item_id}`} className="font-bold text-xs text-gray-600">
                Delivered (Pieces):
              </label>
              <input
                id={`pieces-${dp.item_id}`}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`px-2 py-1 text-xs border rounded-md w-20 ${
                  error.includes("pieces") ? "border-red-500" : "border-gray-300"
                }`}
                value={deliveredPiecesInput}
                onChange={(e) => handlePieceChange(e.target.value)}
                min="0"
                max={psRatio > 1 ? psRatio - 1 : maxPieces}
                placeholder="0"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor={`pieces-${dp.item_id}`} className="font-bold text-xs text-gray-600">
              Delivered (Pieces):
            </label>
            <input
              id={`pieces-${dp.item_id}`}
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`px-2 py-1 text-xs border rounded-md w-20 ${
                error.includes("pieces") ? "border-red-500" : "border-gray-300"
              }`}
              value={deliveredPiecesInput}
              onChange={(e) => handlePieceChange(e.target.value)}
              min="0"
              max={maxPieces}
              placeholder="0"
            />
          </div>
        )
      )}

      {/* Delivered Quantity Display */}
      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span className="font-bold">Delivered Qty:</span>
        <span>
          {dp.deliveredQuantity || 0}{" "}
          {psRatio > 1
            ? `pcs (${deliveredBoxes} boxes + ${deliveredPieces} pcs)`
            : "pcs"}
        </span>
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
