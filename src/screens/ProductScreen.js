import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createReview, deleteProduct, detailsProduct } from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Rating from '../components/Rating';
import { PRODUCT_REVIEW_CREATE_RESET } from '../constants/productConstants';
import api from './api';

export default function ProductScreen(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const { id: productId } = params;


  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [soldOut,setSoldOut] = useState(null);
  // const [qty, setQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const productReviewCreate = useSelector((state) => state.productReviewCreate);
  const { loading: loadingReviewCreate, error: errorReviewCreate, success: successReviewCreate } = productReviewCreate;


  useEffect(()=>{
    try {
      async function fetch(){
      const { data } = await api.get(`api/billing/product/get-sold-out/${productId}`);
      setSoldOut(data)
      }
    } catch (error) {
      console.error("Error fetching sold out status:", error);
    } 
  },[])

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
             <div className="flex max-w-lg mx-auto items-center justify-between bg-gradient-to-l from-gray-200 mb-4 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg  relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Product Informations</p>
  </div>
  <i className="fa fa-box text-gray-500" />
</div>
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-1">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <i className='fa fa-spinner fa-spin' />
              </div>
            ) : (

                <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
    <div className="relative">
        {/* Badge for In Stock */}
        <span className={`absolute z-20 top-2 right-2 text-white text-xs font-semibold px-3 py-2 rounded-full animate-pulse shadow-lg ${product.countInStock > 10 ? 'bg-green-600' : product.countInStock === 0 ?  'bg-red-600' : ' bg-yellow-600'}`}>
            {product.countInStock > 10 ? 'In Stock' : product.countInStock === 0 ? 'Out Of Stock' : 'Moving Out' }
        </span>

        <a href={`${product.image}`}>
            <div className="relative w-full h-56 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden">
                {!isImageLoaded && !isError && (
                    <div className="w-full h-full bg-gray-300 animate-pulse" />
                )}
                {isError ? (
                    <span className="text-gray-500 dark:text-gray-400">No image found</span>
                ) : (
                    <img
                        className={`rounded-t-lg object-cover w-full h-full transition-transform duration-300 ease-in-out transform ${isImageLoaded ? 'scale-100' : 'scale-105'}`}
                        src={`${product.image}`}
                        alt={product.image}
                        onLoad={() => setIsImageLoaded(true)}
                        onError={() => {
                            setIsImageLoaded(false);
                            setIsError(true);
                        }}
                    />
                )}
            </div>
        </a>
    </div>

    <div className="p-6 space-y-2">
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
            Product ID: <span className="text-gray-700 dark:text-white">{product.item_id}</span>
        </p>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white tracking-tight">
            {product.name}
        </h2>
        <div className="flex justify-between text-xs">
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                Brand: <span className="font-semibold text-gray-800 dark:text-white">{product.brand}</span>
            </p>
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                Category: <span className="font-semibold text-gray-800 dark:text-white">{product.category}</span>
            </p>
        </div>

        <div className="flex justify-between text-xs">
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                P Unit: <span className="font-semibold text-gray-800 dark:text-white">{product.pUnit}</span>
            </p>
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                S Unit: <span className="font-semibold text-gray-800 dark:text-white">{product.sUnit}</span>
            </p>
        </div>

        <div className="flex justify-between text-xs">
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                P S Ratio: <span className="font-semibold text-gray-800 dark:text-white">{product.psRatio}</span>
            </p>
            <p className="text-gray-600 text-xs truncate dark:text-gray-300 font-medium">
                Size: <span className="font-semibold text-gray-800 dark:text-white">{product.size}</span>
            </p>
        </div>

        <div className="flex justify-between items-center border-t pt-2">
            <div className="text-xs">
                <p className="text-gray-400 uppercase font-bold mb-2">Stock Details</p>
                <p className={`font-bold dark:text-white ${product.countInStock > 10 ? 'text-green-600' : product.countInStock === 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                    In Stock: {product.countInStock}
                </p>
            </div>
            <p className="text-xs mt-5 font-semibold text-gray-500 dark:text-gray-400">
                Stock Cleared: {soldOut ? soldOut : 0}
            </p>
        </div>
        <div className='flex justify-between pt-5'>
        <p
        onClick={()=> navigate(`/product/${product._id}/edit`)}
            className="inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-900 transition-all"
        >
            Edit Product
            <i className="fa fa-arrow-right ml-2" />
        </p>

        <p
        onClick={()=> deleteHandler(product)}
            className="inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-900 transition-all">
            <i className="fa fa-trash" />
        </p>


        </div>
    </div>
</div>



                
              
            )}
          </div>

          <div className="max-w-md shadow-xl p-6 mx-auto space-y-4">
            <h3 className="text-sm font-bold">Remarks</h3>
            {product.reviews.length === 0 ? (
              <MessageBox>No Remarks yet</MessageBox>
            ) : (
              product.reviews.map((review) => (
                <div key={review._id} className="border-b py-4 text-xs flex">
                  <strong className='text-gray-500'><i className='fa fa-user' /> {" "}{review.name}</strong>
                  <Rating rating={review.rating} caption=" " />
                  <p className='text-xs font-bold text-gray-600'>{review.comment}</p>
                  <p className="text-xs text-gray-500 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}

            {userInfo ? (
              <>
              <div className='flex '>

                <button
                  onClick={() => setShowModal(true)}
                  className="w-1/2 font-bold mx-auto bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                  >
                  add remark
                </button>

                  </div>


                {/* Review Modal */}
                {showModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white m-10 rounded-lg p-6 space-y-4 w-full max-w-lg">
                      <div className='flex justify-between'>

                      <h2 className="text-sm text-gray-500 font-bold">Write a Review</h2>

                                     
                <button
                        onClick={() => setShowModal(false)}
                        className="p-3 font-bold py-1 bg-gray-500 text-white  rounded-lg hover:bg-gray-600 transition mt-4"
                      >
                        x
                      </button>

                      </div>
                      <form onSubmit={submitHandler} className="space-y-4">
                        <div>
                          <label htmlFor="rating" className="block font-bold text-xs font-medium text-gray-700">
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
                          <label htmlFor="comment" className="block text-sm font-bold text-gray-700">
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
                          className="w-2/4 text-xs font-bold bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          Submit Review
                        </button>

                        {loadingReviewCreate && <LoadingBox />}
                        {errorReviewCreate && <MessageBox variant="danger">{errorReviewCreate}</MessageBox>}
                      </form>
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


          <a href={'/get-product'} className='text-center cursor-pointer text-xs font-bold text-gray-400'>Search Another Product ? <span className='text-red-500'>Click Here</span></a>

        </div>
      )}
    </div>
  );
}
