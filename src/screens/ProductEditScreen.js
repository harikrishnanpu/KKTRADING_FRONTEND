import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { detailsProduct, updateProduct } from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants';
import api from './api';

export default function ProductEditScreen(props) {
  const navigate = useNavigate();
  const params = useParams();
  const { id: productId } = params;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [itemId, setItemId] = useState('');

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const productUpdate = useSelector((state) => state.productUpdate);
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate;

  const dispatch = useDispatch();
  useEffect(() => {
    if (successUpdate) {
      navigate('/productlist');
    }
    if (!product || product._id !== productId || successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET });
      dispatch(detailsProduct(productId));
    } else {
      setName(product.name);
      setPrice(product.price);
      setImage(product.image);
      setCategory(product.category);
      setCountInStock(product.countInStock);
      setBrand(product.brand);
      setDescription(product.description);
      setItemId(product.item_id);
    }
  }, [product, dispatch, productId, successUpdate, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    // Dispatch update product
    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        image,
        category,
        brand,
        countInStock,
        description,
        itemId
      })
    );
  };

  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUpload, setErrorUpload] = useState('');

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // replace with your Cloudinary upload preset

    setLoadingUpload(true);
    try {
      const response = await api.post(
        'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload',
        formData
      );
      setImage(response.data.secure_url);
      setLoadingUpload(false);
    } catch (error) {
      setErrorUpload(error.message);
      setLoadingUpload(false);
    }
  };

  return (
    <div>
      <form className="form" onSubmit={submitHandler}>
        {loadingUpdate && <LoadingBox></LoadingBox>}
        {errorUpdate && <MessageBox variant="danger">{errorUpdate}</MessageBox>}
        {loading ? (
          <LoadingBox></LoadingBox>
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <>
            <section className="text-gray-600 body-font relative">
              <div className="container px-5 mx-auto">
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-100 via-gray-100 to-gray-50 p-5 rounded-lg mb-2 relative">
                  <div
                    onClick={() => {
                      navigate('/');
                    }}
                    className="text-center cursor-pointer"
                  >
                    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
                    <p className="text-gray-400 text-xs font-bold">Product Information</p>
                  </div>
                  <i className="fa fa-box text-gray-500" />
                </div>
                <p className="font-bold text-center">Edit Product</p>
                <div className="lg:w-1/2 md:w-1/3 mx-auto">
                  <div className="flex flex-wrap m-2">
                    <div className="p-2 w-full">
                      <div className="relative">
                        <label htmlFor="name" className="leading-7 text-sm text-gray-600">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          placeholder="Enter name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        />
                      </div>
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="itemId">Item ID</label>
                      <input
                        id="itemId"
                        type="text"
                        placeholder="Item Id"
                        value={itemId}
                        onChange={(e) => setItemId(e.target.value)}
                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      ></input>
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="price">Price</label>
                      <input
                        id="price"
                        type="text"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      />
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="image">Image</label>
                      <input
                        id="image"
                        type="text"
                        placeholder="Enter image"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      ></input>
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="imageFile">Image File</label>
                      <input
                        onChange={uploadFileHandler}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                        id="imageFile"
                        type="file"
                      />
                      {loadingUpload && <LoadingBox></LoadingBox>}
                      {errorUpload && <MessageBox variant="danger">{errorUpload}</MessageBox>}
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="category">Category</label>
                      <input
                        id="category"
                        type="text"
                        placeholder="Enter category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      ></input>
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="brand">Brand</label>
                      <input
                        id="brand"
                        type="text"
                        placeholder="Enter brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      ></input>
                    </div>
                    <div className="p-2 w-1/2">
                      <label htmlFor="countInStock">Count In Stock</label>
                      <input
                        id="countInStock"
                        type="text"
                        placeholder="Enter countInStock"
                        value={countInStock}
                        onChange={(e) => setCountInStock(e.target.value)}
                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      ></input>
                    </div>
                    <div className="p-2 w-full mb-8">
                      <button
                        type="submit"
                        className="flex mx-auto text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
                      >
                        Submit
                      </button>
                    </div>
                    <div className="w-full p-2 border-b border-gray-200"></div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </form>
    </div>
  );
}
