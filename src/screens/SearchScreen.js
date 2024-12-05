// src/screens/SearchScreen.js

import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Product from '../components/Product';
import SearchBox from '../components/SearchBox';
import SkeletonProduct from '../components/SkeletonProduct';
import api from './api';

export default function SearchScreen() {
  const navigate = useNavigate();
  const {
    name = 'all',
    category = 'all',
    brand = 'all',
    size = 'all',
    min = 0,
    max = 0,
    rating = 0,
    order = 'newest',
    inStock = 'all',
    countInStockMin = 0,
    pageNumber = 1,
  } = useParams();

  const [jumpPage, setJumpPage] = useState(pageNumber);
  const [priceMin, setPriceMin] = useState(min);
  const [priceMax, setPriceMax] = useState(max);
  const [stockMin, setStockMin] = useState(countInStockMin);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [error, setError] = useState('');
  const [errorCategories, setErrorCategories] = useState('');
  const [errorBrands, setErrorBrands] = useState('');
  const [errorSizes, setErrorSizes] = useState('');
  const [page, setPage] = useState(pageNumber);
  const [pages, setPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingCategories(true);
        setLoadingBrands(true);
        setLoadingSizes(true);

        const [categoriesRes, brandsRes, sizesRes] = await Promise.all([
          api.get('/api/products/categories'),
          api.get('/api/products/brands'),
          api.get('/api/products/sizes'),
        ]);

        setCategories(categoriesRes.data);
        setBrands(brandsRes.data);
        setSizes(sizesRes.data);

        setLoadingCategories(false);
        setLoadingBrands(false);
        setLoadingSizes(false);
      } catch (err) {
        setErrorCategories(err.message);
        setErrorBrands(err.message);
        setErrorSizes(err.message);
        setLoadingCategories(false);
        setLoadingBrands(false);
        setLoadingSizes(false);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const { data } = await api.get(
          `/api/products?pageNumber=${pageNumber}&name=${name}&category=${category}&brand=${brand}&size=${size}&min=${min}&max=${max}&rating=${rating}&order=${order}&inStock=${inStock}&countInStockMin=${countInStockMin}`
        );

        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
        setTotalProducts(data.totalProducts);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    name,
    category,
    brand,
    size,
    min,
    max,
    rating,
    order,
    inStock,
    countInStockMin,
    pageNumber,
  ]);

  const getFilterUrl = (filter) => {
    const filterPage = filter.page || 1;
    const filterCategory = filter.category || category;
    const filterBrand = filter.brand || brand;
    const filterSize = filter.size || size;
    const filterName = filter.name || name;
    const filterRating = filter.rating || rating;
    const sortOrder = filter.order || order;
    const filterMin = filter.min ?? min;
    const filterMax = filter.max ?? max;
    const filterInStock =
      filter.inStock !== undefined ? filter.inStock : inStock;
    const filterCountInStockMin =
      filter.countInStockMin ?? countInStockMin;

    return `/search/category/${filterCategory}/brand/${filterBrand}/size/${filterSize}/name/${filterName}/min/${filterMin}/max/${filterMax}/rating/${filterRating}/order/${sortOrder}/inStock/${filterInStock}/countInStockMin/${filterCountInStockMin}/pageNumber/${filterPage}`;
  };

  const handleCategoryChange = (e) => {
    navigate(getFilterUrl({ category: e.target.value, page: 1 }));
  };

  const handleBrandChange = (e) => {
    navigate(getFilterUrl({ brand: e.target.value, page: 1 }));
  };

  const handleSizeChange = (e) => {
    navigate(getFilterUrl({ size: e.target.value, page: 1 }));
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

  const handleMinPriceChange = (e) => {
    setPriceMin(e.target.value);
  };

  const handleMaxPriceChange = (e) => {
    setPriceMax(e.target.value);
  };

  const handlePriceFilter = () => {
    navigate(getFilterUrl({ min: priceMin, max: priceMax, page: 1 }));
  };

  const handleInStockChange = (e) => {
    navigate(
      getFilterUrl({
        inStock: e.target.checked ? 'true' : 'all',
        page: 1,
      })
    );
  };

  const handleStockMinChange = (e) => {
    setStockMin(e.target.value);
  };

  const handleStockFilter = () => {
    navigate(
      getFilterUrl({
        countInStockMin: stockMin,
        page: 1,
      })
    );
  };

  const handleRatingChange = (e) => {
    navigate(getFilterUrl({ rating: e.target.value, page: 1 }));
  };

  return (
    <div className="container mx-auto p-2">
      {/* Top Banner */}
      <div
        onClick={() => {
          navigate('/');
        }}
        className="flex max-w-4xl mx-auto items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative cursor-pointer"
      >
        <div className="text-center">
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Products and Management
          </p>
        </div>
        <i className="fa fa-box text-gray-500" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-40 transition-transform transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:relative lg:bg-transparent`}
        >
          <div className="w-64 bg-white h-full shadow-lg lg:shadow-none lg:bg-transparent lg:h-auto">
            {/* Close Button on Mobile */}
            <div className="flex justify-end p-4 lg:hidden">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <i className="fa fa-times text-xl" />
              </button>
            </div>
            {/* Filters */}
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">Filters</h2>
              {/* Search Box */}
              <div className="mb-4">
                <SearchBox />
              </div>
              {/* Category Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Category</h3>
                {loadingCategories ? (
                  <LoadingBox />
                ) : errorCategories ? (
                  <MessageBox variant="danger">{errorCategories}</MessageBox>
                ) : (
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {/* Brand Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Brand</h3>
                {loadingBrands ? (
                  <LoadingBox />
                ) : errorBrands ? (
                  <MessageBox variant="danger">{errorBrands}</MessageBox>
                ) : (
                  <select
                    value={brand}
                    onChange={handleBrandChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {/* Size Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Size</h3>
                {loadingSizes ? (
                  <LoadingBox />
                ) : errorSizes ? (
                  <MessageBox variant="danger">{errorSizes}</MessageBox>
                ) : (
                  <select
                    value={size}
                    onChange={handleSizeChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All</option>
                    {sizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {/* Price Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Price</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={handleMinPriceChange}
                    placeholder="Min"
                    className="w-1/2 border border-gray-300 rounded-lg p-2 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={priceMax}
                    onChange={handleMaxPriceChange}
                    placeholder="Max"
                    className="w-1/2 border border-gray-300 rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handlePriceFilter}
                  className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Apply
                </button>
              </div>
              {/* Count In Stock Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Stock Availability</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={stockMin}
                    onChange={handleStockMinChange}
                    placeholder="Min Quantity"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStockFilter}
                  className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Apply
                </button>
              </div>
              {/* In-Stock Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Availability</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inStock === 'true'}
                    onChange={handleInStockChange}
                    className="mr-2"
                  />
                  <label>In Stock Only</label>
                </div>
              </div>
              {/* Rating Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Rating</h3>
                <select
                  value={rating}
                  onChange={handleRatingChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="0">All Ratings</option>
                  <option value="1">1 star & up</option>
                  <option value="2">2 stars & up</option>
                  <option value="3">3 stars & up</option>
                  <option value="4">4 stars & up</option>
                  <option value="5">5 stars</option>
                </select>
              </div>
              {/* Sort Options */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Sort By</h3>
                <select
                  value={order}
                  onChange={handleSortChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="lowest">Price: Low to High</option>
                  <option value="highest">Price: High to Low</option>
                  <option value="toprated">Avg. Customer Reviews</option>
                  <option value="countinstock">Stock Quantity</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar with Toggle Button on Mobile */}
          <div className="p-4 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Filters
            </button>
            <div className="text-lg font-bold">Products</div>
          </div>
          {/* Heading */}
          <div className="mb-6">
            {loading ? (
              <LoadingBox />
            ) : error ? (
              <MessageBox variant="danger">{error}</MessageBox>
            ) : (
              <div className="font-semibold">
                <p className="text-gray-400 text-xs text-center">
                  Showing: {totalProducts} Results
                </p>
              </div>
            )}
          </div>

          {/* Products List with Skeleton */}
          {loading &&
            Array.from({ length: 10 }).map((_, index) => (
              <SkeletonProduct key={index} />
            ))}

          <div className="w-full">
            <div className="mx-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {loading ? (
                ''
              ) : error ? (
                <MessageBox variant="danger">{error}</MessageBox>
              ) : products.length === 0 ? (
                <MessageBox>No Products Found</MessageBox>
              ) : (
                products.map((product) => (
                  <div
                    key={product._id}
                    className="space-x-2 rounded-lg hover:shadow-lg transition-shadow"
                  >
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
                  <span>
                    Page {page} of {pages}
                  </span>
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
      </div>
    </div>
  );
}
