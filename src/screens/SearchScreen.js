import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { listProducts } from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Product from '../components/Product';
import SearchBox from '../components/SearchBox';
import SkeletonProduct from '../components/SkeletonProduct'; // Skeleton loading component

export default function SearchScreen() {
  const navigate = useNavigate();
  const {
    name = 'all',
    category = 'all',
    min = 0,
    max = 0,
    rating = 0,
    order = 'newest',
    pageNumber = 1,
  } = useParams();
  
  const [jumpPage, setJumpPage] = useState(pageNumber); // State for input page navigation

  const dispatch = useDispatch();
  const productList = useSelector((state) => state.productList);
  const { loading, error, products, page, pages, totalProducts } = productList;

  const productCategoryList = useSelector((state) => state.productCategoryList);
  const { loading: loadingCategories, error: errorCategories, categories } = productCategoryList;

  useEffect(() => {
    dispatch(
      listProducts({
        pageNumber,
        name: name !== 'all' ? name : '',
        category: category !== 'all' ? category : '',
        min,
        max,
        rating,
        order,
      })
    );
  }, [dispatch, name, category, min, max, rating, order, pageNumber]);

  const getFilterUrl = (filter) => {
    const filterPage = filter.page || 1; // Reset to page 1 for new filters
    const filterCategory = filter.category || category;
    const filterName = filter.name || name;
    const filterRating = filter.rating || rating;
    const sortOrder = filter.order || order;
    const filterMin = filter.min ?? min;
    const filterMax = filter.max ?? max;
    
    return `/search/category/${filterCategory}/name/${filterName}/min/${filterMin}/max/${filterMax}/rating/${filterRating}/order/${sortOrder}/pageNumber/${filterPage}`;
  };

  const handleCategoryChange = (e) => {
    navigate(getFilterUrl({ category: e.target.value, page: 1 }));
  };

  const handleSortChange = (e) => {
    navigate(getFilterUrl({ order: e.target.value, page: 1 }));
  };

  const handlePageInputChange = (e) => {
    setJumpPage(e.target.value);
  };

  const handleJumpToPage = () => {
    if (jumpPage > 0 && jumpPage <= pages) {
      navigate(getFilterUrl({ page: jumpPage }));
    }
  };

  return (
    <div className="container mx-auto p-2">
            {/* Top Banner */}
            <div className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
  <div onClick={()=> { navigate('/'); }} className="text-center cursor-pointer">
    <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
    <p className="text-gray-400 text-xs font-bold">Products and Management</p>
  </div>
  <i className="fa fa-box text-gray-500" />
</div>
      {/* Heading */}
      <div className="mb-6">
        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <div className="font-semibold">

            <div className="mb-3">
              <form className="flex items-center max-w-sm mx-auto search-form">
                <SearchBox />
              </form>
            </div>
            <p className="text-gray-400 text-xs text-center">Showing: {totalProducts} Results</p>
          </div>
        )}
      </div>

      {/* Filter & Sort */}
      <div className="flex space-x-2 lg:flex-row lg:space-x-4 mb-3">
        {/* Categories */}
        <div className="w-1/2 lg:w-1/4 mb-4 lg:mb-0">
          <h3 className="font-bold mb-2 text-xs">Categories:</h3>
          {loadingCategories ? (
            <LoadingBox />
          ) : errorCategories ? (
            <MessageBox variant="danger">{errorCategories}</MessageBox>
          ) : (
            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Any</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort Options */}
        <div className="w-1/2 lg:w-1/4 mb-4 lg:mb-0">
          <h3 className="font-bold mb-2 text-xs">Sort by:</h3>
          <select
            value={order}
            onChange={handleSortChange}
            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="lowest">Price: Low to High</option>
            <option value="highest">Price: High to Low</option>
            <option value="toprated">Avg. Customer Reviews</option>
          </select>
        </div>
      </div>

      {/* Products List with Skeleton */}

     {loading && Array.from({ length: 10 }).map((_, index) => (
              <SkeletonProduct key={index} /> // Skeleton for loading state
            )) }

      <div className="w-full">
        <div className="mx-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            ""
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : products.length === 0 ? (
            <MessageBox>No Products Found</MessageBox>
          ) : (
            products.map((product) => (
              <div key={product._id} className="space-x-2 rounded-lg hover:shadow-lg transition-shadow">
                <Product product={product} />
              </div>
            ))
          )}
        </div>

        {/* Pagination with Go to Page */}
        {pages > 1 && (
          <div className="flex justify-between items-center mt-4 space-x-4">
            {page >= 1 && (
              <button
                onClick={() => navigate(getFilterUrl({ page: page - 1 }))}
                disabled={page === 1}
                className="px-3 cursor-pointer text-xs font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Previous
              </button>
            )}
            <div className="flex text-xs items-center space-x-2">
              <span>Page {page} of {pages}</span>
              <input
                type="number"
                value={jumpPage}
                onChange={handlePageInputChange}
                className="border border-gray-300 rounded-lg p-2 h-8 w-10 focus:outline-none"
                min={1}
                max={pages}
              />
              <button
                onClick={handleJumpToPage}
                className="px-4 font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Go
              </button>
            </div>
            {page < pages && (
              <button
                onClick={() => navigate(getFilterUrl({ page: page + 1 }))}
                className="px-4 text-xs font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

