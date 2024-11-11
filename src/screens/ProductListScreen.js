import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  createProduct,
  deleteProduct,
  listProducts,
} from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import {
  PRODUCT_CREATE_RESET,
  PRODUCT_DELETE_RESET,
} from '../constants/productConstants';
import api from './api';

export default function ProductListScreen(props) {
  const navigate = useNavigate();
  const { pageNumber = 1 } = useParams();
  const { pathname } = useLocation();
  // const sellerMode = pathname.indexOf('/seller') >= 0;
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [iserror, setError] = useState(null);

  const productList = useSelector((state) => state.productList);
  const { loading, error, products, page, pages } = productList;

  const productCreate = useSelector((state) => state.productCreate);
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
    product: createdProduct,
  } = productCreate;

  const productDelete = useSelector((state) => state.productDelete);
  const {
    loading: loadingDelete,
    error: errorDelete,
    success: successDelete,
  } = productDelete;


  const dispatch = useDispatch();

  useEffect(() => {
    if (successCreate) {
      dispatch({ type: PRODUCT_CREATE_RESET });
      navigate(`/product/${createdProduct._id}/edit`);
    }
    if (successDelete) {
      dispatch({ type: PRODUCT_DELETE_RESET });
    }
    dispatch(
      listProducts({ pageNumber })
    );
  }, [
    createdProduct,
    dispatch,
    navigate,
    successCreate,
    successDelete,
    pageNumber,
  ]);

  const deleteHandler = (product) => {
    if (window.confirm('Are you sure to delete?')) {
      dispatch(deleteProduct(product._id));
    }
  };

  const createHandler = () => {
    dispatch(createProduct());
  };



  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      try {
        const { data } = await api.get(`/api/products/searchform/search?q=${query}`);
        setSuggestions(data.length > 0 ? data : []);
        setError(data.length === 0 ? 'No products found' : null);
      } catch (error) {
        setError('Error fetching suggestions');
      }
    } else {
      setSuggestions([]);
      setError(null);
    }
  };


  return (
    <div className="container mx-auto max-w-2xl px-4">
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">All Products and Add Product</p>
  </div>
        <button
          type="button"
          className="bg-red-500 font-bold text-sm text-white py-2 px-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg"
          onClick={createHandler}
        >
          + Add Product
        </button>
</div>

      <div className='mb-5'>
      <div className="bg-white text-center p-6 rounded-lg shadow-lg border w-full lg:w-1/2 mx-auto">
            <h2 className="text-md font-semibold mb-4 text-red-600">Search Product</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by item ID or name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border mt-2 rounded-lg shadow-md max-h-56 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion._id}
                      className="p-4 hover:bg-red-50 border-t-2 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        navigate(`/get-product/${suggestion.item_id}`)
                        setSearchQuery(suggestion.name);
                        setSuggestions([]);
                      }}
                    >
                      <span className='text-sm truncate'><span className="text-xs font-bold text-gray-400">{suggestion.item_id} - </span> {suggestion.name}</span>
                      <i className='fa fa-arrow-right text-gray-500 ml-2' />
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
      </div>

      {loadingDelete && <LoadingBox />}
      {errorDelete && <MessageBox variant="danger">{errorDelete}</MessageBox>}
      {loadingCreate && <LoadingBox />}
      {errorCreate && <MessageBox variant="danger">{errorCreate}</MessageBox>}

      {loading ? (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4 text-center">NAME</th>
                <th className="p-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((index) => (
                <tr key={index} className="border-t animate-pulse">
                  <td className="py-5 px-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </td>
                  <td className="py-5 px-2 text-center">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                  </td>
                  <td className="py-5 px-2 text-center">
                    <div className="flex justify-center">
                      <div className="h-4 bg-gray-300 rounded w-10 mx-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-10 mx-1"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4 text-center">NAME</th>
                  <th className="p-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="py-5 px-2 font-medium text-xs font-bold">{product.item_id}</td>
                    <td className="py-5 px-2 text-center font-medium text-xs">{product.name}</td>
                    <td className="py-5 px-2 text-center text-xs flex justify-center">
                      <button
                        type="button"
                        className="bg-yellow-400 text-white py-2 px-4 rounded-lg mx-1 hover:bg-yellow-500 transition-all duration-200 shadow"
                        onClick={() => navigate(`/product/${product._id}/edit`)}
                      >
                        <i className="fa fa-pencil-square" />
                      </button>
                      <button
                        type="button"
                        className="bg-red-500 text-white py-2 px-4 rounded-lg mx-1 hover:bg-red-600 transition-all duration-200 shadow"
                        onClick={() => deleteHandler(product)}
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center mt-6">
            <button
              className={`px-4 py-2 mx-1 rounded-lg text-xs ${
                page === 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              } transition-all duration-200`}
              onClick={() => page > 1 && navigate(`/productlist/pageNumber/${page - 1}`)}
              disabled={page === 1}
            >
              <i className="fa fa-angle-left mr-1" />
              Previous
            </button>

            <span className="mx-3 text-lg font-bold text-gray-700">{page}</span>

            <button
              className={`px-4 py-2 mx-1 rounded-lg text-xs ${
                page === pages
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              } transition-all duration-200`}
              onClick={() => page < pages && navigate(`/productlist/pageNumber/${page + 1}`)}
              disabled={page === pages}
            >
              Next
              <i className="fa fa-angle-right ml-1" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
