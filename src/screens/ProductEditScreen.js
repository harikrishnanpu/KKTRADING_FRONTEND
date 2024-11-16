import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
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
  const [itemId, setItemId] = useState('');
  const [seller, setSeller] = useState('');
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pUnit, setPUnit] = useState('');
  const [sUnit, setSUnit] = useState('');
  const [psRatio, setPsRatio] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [size, setSize] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [imageError, setImageError] = useState(false);


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
      setItemId(product.item_id);
      setSeller(product.seller);
      setImage(product.image);
      setBrand(product.brand);
      setCategory(product.category);
      setDescription(product.description);
      setPUnit(product.pUnit);
      setSUnit(product.sUnit);
      setPsRatio(product.psRatio);
      setLength(product.length);
      setBreadth(product.breadth);
      setSize(product.size);
      setUnit(product.unit);
      setPrice(product.price);
      setCountInStock(product.countInStock);
    }
  }, [product, dispatch, productId, successUpdate, navigate]);

  const submitHandler = (e) => {
    dispatch(
      updateProduct({
        _id: productId,
        name,
        itemId,
        seller,
        image,
        brand,
        category,
        description,
        pUnit,
        sUnit,
        psRatio,
        length,
        breadth,
        size,
        unit,
        price,
        countInStock,
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
    formData.append('upload_preset', 'ml_default');

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
    <div className="container mx-auto max-w-2xl p-4">
            <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Product Updations</p>
  </div>
  <i className="fa fa-box text-gray-500" />
</div>

<div className="text-right mt-4 mb-10">
              <button
                onClick={()=> submitHandler()}
                className="bg-red-500 text-sm hover:bg-red-700 text-white font-bold py-2 px-8 rounded"
              >
                Update
              </button>
            </div>

      <div className="form">
        {loadingUpdate && <LoadingBox />}
        {errorUpdate && <MessageBox variant="danger">{errorUpdate}</MessageBox>}
        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <>
            <div className="relative mb-4">
              <div className="mx-auto h-44 bg-gray-100 rounded-lg flex items-center justify-center relative">
                {loadingUpload ? (
                  <LoadingBox />
                ) : image ? (
                  <div>
                  <img
                    src={image}
          onError={() => setImageError(true)}
                    alt="product"
                    className={`object-cover rounded-lg w-full h-32 ${imageError ? 'hidden' : ''}`}
                    />
                          {imageError && (
          <div className="flex justify-center">
            <p className="text-gray-400 animate-pulse text-sm">No image</p>
          </div>
        )}
                  </div>
                ) :           <div className="flex justify-center">
                <p className="text-gray-400 animate-pulse text-sm">No image</p>
              </div>}
                <label
                  htmlFor="imageFile"
                  className="absolute bottom-2 font-bold right-2 text-xs bg-red-500 text-white px-4 py-2 rounded-lg cursor-pointer"
                >
                  <i className='fa fa-edit' />
                </label>
                <input
                  type="file"
                  id="imageFile"
                  className="hidden"
                  onChange={uploadFileHandler}
                />
                {errorUpload && <MessageBox variant="danger">{errorUpload}</MessageBox>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="text-xs text-gray-500">Name</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Item ID</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Brand</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Category</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Price</label>
                <input
                  type="number"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Count In Stock</label>
                <input
                  type="number"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Description</label>
                <textarea
                  className="w-full h-10 bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">P Unit</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={pUnit}
                  onChange={(e) => setPUnit(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">S Unit</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={sUnit}
                  onChange={(e) => setSUnit(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">P S Ratio</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={psRatio}
                  onChange={(e) => setPsRatio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Length</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Breadth</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={breadth}
                  onChange={(e) => setBreadth(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Size</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs text-gray-500">Unit</label>
                <input
                  type="text"
                  className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
