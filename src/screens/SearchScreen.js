import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { listProducts } from '../actions/productActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Product from '../components/Product';
import SearchBox from '../components/SearchBox';

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
  
  const dispatch = useDispatch();
  const productList = useSelector((state) => state.productList);
  const { loading, error, products, page, pages , totalProducts } = productList;

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
    navigate(getFilterUrl({ category: e.target.value, page: 1 })); // Reset to page 1
  };

  const handleSortChange = (e) => {
    navigate(getFilterUrl({ order: e.target.value, page: 1 })); // Reset to page 1
  };

  return (
    <div className="container mx-auto ">
      {/* Heading */}
      <div className="mb-6">
        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <div className="font-semibold">
                      <div className="text-center flex justify-between mb-10">
                        <a href='/' className='text-blue-500'><i className='fa fa-angle-left' /> Back</a>
          <p className='font-bold text-red-600 text-2xl items-center font-bold'>KK TRADING</p>
          </div>
          <div className='mb-3'>
      <form class="flex items-center max-w-sm mx-auto search-form">  
      <SearchBox />
      </form>
      </div>
            <p className='text-gray-400 text-xs text-center'>Showing: {totalProducts} Results</p></div>
        )}
      </div>
      
      {/* Filter & Sort */}
      <div className="flex flex-col lg:flex-row lg:space-x-4 mb-8">
        {/* Categories */}
        <div className="w-full lg:w-1/4 mb-4 lg:mb-0">
          <h3 className="font-bold mb-2 text-lg">Categories: </h3>
          {loadingCategories ? (
            <LoadingBox />
          ) : errorCategories ? (
            <MessageBox variant="danger">{errorCategories}</MessageBox>
          ) : (
            <select
              value={category}
              onChange={handleCategoryChange}  // Reset page to 1 on category change
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="w-full lg:w-1/4 mb-4 lg:mb-0">
          <h3 className="font-bold mb-2 text-lg">Sort by: </h3>
          <select
            value={order}
            onChange={handleSortChange}  // Reset page to 1 on sort change
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="lowest">Price: Low to High</option>
            <option value="highest">Price: High to Low</option>
            <option value="toprated">Avg. Customer Reviews</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="w-full">
        <div className="container mx-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : products.length === 0 ? (
            <MessageBox>No Products Found</MessageBox>
          ) : (
            products.map((product) => (
              <Product key={product._id} product={product} />
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center mt-6 space-x-4">
            {page > 1 && (
              <button
                onClick={() => navigate(getFilterUrl({ page: page - 1 }))}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Previous
              </button>
            )}
            <span>Page {page}</span>
            {page < pages && (
              <button
                onClick={() => navigate(getFilterUrl({ page: page + 1 }))}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
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
