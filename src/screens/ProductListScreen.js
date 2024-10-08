import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  useParams, useNavigate, useLocation } from 'react-router-dom';
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
import SearchBox from '../components/SearchBox';

export default function ProductListScreen(props) {
  const navigate = useNavigate();
  const { pageNumber = 1 } = useParams();
  const { pathname } = useLocation();
  const sellerMode = pathname.indexOf('/seller') >= 0;

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

  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
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
      listProducts({ seller: sellerMode ? userInfo._id : '', pageNumber })
    );
  }, [
    createdProduct,
    dispatch,
    navigate,
    sellerMode,
    successCreate,
    successDelete,
    userInfo._id,
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

  return (
    <div className="container mx-auto px-4">
      <div className="text-center flex justify-between mb-8 items-center">
        <a href="/" className="text-blue-500 text-sm font-medium">
          <i className="fa fa-angle-left mr-2" />
          Back
        </a>
        <h1 className="font-extrabold text-lg text-red-600">KK TRADING</h1>
        <button
          type="button"
          className="bg-red-500 font-bold text-sm text-white  py-2 px-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg"
          onClick={createHandler}
        >
          + Add Product
        </button>
      </div>

      <div className='mb-10'>
      <form class="flex items-center max-w-sm mx-auto search-form">  
      <SearchBox />
      </form>
      </div>

      {loadingDelete && <LoadingBox />}
      {errorDelete && <MessageBox variant="danger">{errorDelete}</MessageBox>}
      {loadingCreate && <LoadingBox />}
      {errorCreate && <MessageBox variant="danger">{errorCreate}</MessageBox>}

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 ">ID</th>
                  <th className="p-4 text-center">NAME</th>
                  {/* <th className="p-4 text-center">BRAND</th> */}
                  <th className="p-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="py-5 px-2 item-center font-medium text-xs font-bold">{product.item_id}</td>
                    <td className="py-5 px-2 item-center font-medium text-xs">{product.name}</td>
                    {/* <td className="py-5 px-2  text-center text-xs">{product.category}</td> */}
                    {/* <td className="py-5 px-2  text-center text-xs">{product.brand}</td> */}
                    <td className="py-5 px-2  text-center text-xs flex justify-center">
                      <button
                        type="button"
                        className="bg-yellow-400 text-white py-2 px-4 rounded-lg mx-1 hover:bg-yellow-500 transition-all duration-200 shadow"
                        onClick={() => navigate(`/product/${product._id}/edit`)}
                      >
                        <i className='fa fa-pencil-square' />
                      </button>
                      <button
                        type="button"
                        className="bg-red-500 text-white py-2 px-4 rounded-lg mx-1 hover:bg-red-600 transition-all duration-200 shadow"
                        onClick={() => deleteHandler(product)}
                      >
                        <i className='fa fa-trash'/>
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
