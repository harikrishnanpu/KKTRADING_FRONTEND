import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createReview, deleteProduct, detailsProduct } from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Rating from '../components/Rating';
import { PRODUCT_REVIEW_CREATE_RESET } from '../constants/productConstants';

export default function ProductScreen(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const { id: productId } = params;

  const [qty, setQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const productReviewCreate = useSelector((state) => state.productReviewCreate);
  const { loading: loadingReviewCreate, error: errorReviewCreate, success: successReviewCreate } = productReviewCreate;

  useEffect(() => {
    if (successReviewCreate) {
      window.alert('Review Submitted Successfully');
      setRating(0);
      setComment('');
      setShowModal(false);
      dispatch({ type: PRODUCT_REVIEW_CREATE_RESET });
    }
    dispatch(detailsProduct(productId));
  }, [dispatch, productId, successReviewCreate]);

  const addToCartHandler = () => {
    navigate(`/cart/${productId}?qty=${qty}`);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (comment && rating) {
      dispatch(createReview(productId, { rating, comment, name: userInfo.name }));
    } else {
      alert('Please enter comment and rating');
    }
  };

  const deleteHandler = (product) => {
    if (window.confirm('Are you sure to delete?')) {
      dispatch(deleteProduct(product._id));
      navigate('/');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <div className="space-y-6">
          <div className="text-center flex justify-between items-center mb-8">
            <Link to="/" className="text-blue-500">
              <i className="fa fa-angle-left" /> Back
            </Link>
            <h2 className="text-xl font-bold text-red-600">KK TRADING</h2>
          </div>

          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <img
              className="w-full h-64 object-cover"
              src={`https://kktrading-backend.onrender.com${product.image}`}
              alt={product.name}
            />
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
              <div className="text-sm text-gray-600 flex justify-between">
                <p>ID: {product.item_id}</p>
                <p>Brand: {product.brand}</p>
              </div>
              <div className="text-sm text-gray-600 flex justify-between">
                <p>Supplier: {product.seller?.seller?.name || 'Unknown'}</p>
                <p className="font-bold">Price: ${product.price || '0'}</p>
              </div>
              <div className={`font-bold text-sm ${product.countInStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                In Stock: {product.countInStock}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate(`/product/${product._id}/edit`)}
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteHandler(product)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-bold">Reviews</h3>
            {product.reviews.length === 0 ? (
              <MessageBox>No reviews yet</MessageBox>
            ) : (
              product.reviews.map((review) => (
                <div key={review._id} className="border-b py-4">
                  <strong>{review.name}</strong>
                  <Rating rating={review.rating} caption=" " />
                  <p className="text-sm text-gray-500">{review.createdAt.substring(0, 10)}</p>
                  <p>{review.comment}</p>
                </div>
              ))
            )}

            {userInfo ? (
              <>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Write a Review
                </button>

                {/* Review Modal */}
                {showModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 space-y-4 w-full max-w-lg">
                      <h2 className="text-xl font-bold">Write a Review</h2>
                      <form onSubmit={submitHandler} className="space-y-4">
                        <div>
                          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                            Rating
                          </label>
                          <select
                            id="rating"
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select...</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Fair</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Very good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                            Comment
                          </label>
                          <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
                            rows="4"
                          ></textarea>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          Submit Review
                        </button>

                        {loadingReviewCreate && <LoadingBox />}
                        {errorReviewCreate && <MessageBox variant="danger">{errorReviewCreate}</MessageBox>}
                      </form>
                      <button
                        onClick={() => setShowModal(false)}
                        className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition mt-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <MessageBox>
                Please <Link to="/signin">Sign In</Link> to write a review
              </MessageBox>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
