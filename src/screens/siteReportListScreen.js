// src/screens/SiteReportListPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import api from './api';

export default function SiteReportListPage() {
  const navigate = useNavigate();
  const [siteReports, setSiteReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterBySubmittedBy, setFilterBySubmittedBy] = useState('');
  const [filterByContractorName, setFilterByContractorName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch site reports from backend
  useEffect(() => {
    const fetchSiteReports = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/site-report/');
        setSiteReports(response.data);
      } catch (err) {
        setError('Failed to fetch site reports.');
        console.error(err);
      } finally { 
        setLoading(false);
      }
    };
    fetchSiteReports();
  }, []);

  // Update filtered reports whenever filters change or site reports change
  useEffect(() => {
    let reports = siteReports;
    if (filterBySubmittedBy) {
      reports = reports.filter(
        (report) =>
          report.submittedBy &&
          report.submittedBy.toLowerCase().includes(filterBySubmittedBy.toLowerCase())
      );
    }
    if (filterByContractorName) {
      reports = reports.filter(
        (report) =>
          report.contractorName &&
          report.contractorName.toLowerCase().includes(filterByContractorName.toLowerCase())
      );
    }
    setFilteredReports(reports);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filterBySubmittedBy, filterByContractorName, siteReports]);

  const paginateReports = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const handleView = (report) => {
    setSelectedReport(report);
  };

  const closeModal = () => {
    setSelectedReport(null);
  };

  const handleCheckboxChange = async (report) => {
    try {
      // Toggle the visited status
      const updatedReport = { ...report, visited: !report.visited };
      // Update the backend
      await api.put(`/api/site-report/visited/${report._id}`, { visited: updatedReport.visited });
      // Update the state
      setSiteReports((prevReports) =>
        prevReports.map((r) => (r._id === report._id ? updatedReport : r))
      );
    } catch (err) {
      setError('Failed to update visited status.');
      console.error(err);
    }
  };

  const generatePDF = () => {
    setPdfLoading(true);
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Site Name', 'Contractor', 'Customer', 'Visited']],
      body: filteredReports.map((report) => [
        report.siteName,
        report.contractorName,
        report.customerName,
        report.visited ? 'Yes' : 'No',
      ]),
    });
    doc.save('site_reports.pdf');
    setPdfLoading(false);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderStatusIndicator = (report) => {
    if (report.visited) {
      return (
        <span className="text-green-500">
          <i className="fa fa-eye"></i>
        </span>
      );
    } else {
      return (
        <span className="text-gray-500">
          <i className="fa fa-eye-slash"></i>
        </span>
      );
    }
  };

  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y text-xs">
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-2 py-2">Site Name</th>
            <th className="px-2 py-2">Contractor</th>
            <th className="px-2 py-2">Customer</th>
            <th className="px-2 py-2">Submitted By</th>
            <th className="px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((row) => (
            <tr key={row} className="hover:bg-gray-100 divide-y divide-x">
              <td className="px-4 py-2 text-center">
                <Skeleton circle={true} height={12} width={12} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-2 py-2">
                <Skeleton height={10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCardSkeleton = () => {
    const skeletonCards = Array.from({ length: itemsPerPage }, (_, index) => index);
    return skeletonCards.map((card) => (
      <div
        key={card}
        className="bg-white rounded-lg shadow-md p-6 mb-4 animate-pulse"
      >
        <div className="flex justify-between items-center">
          <Skeleton height={20} width={`60%`} />
          <Skeleton circle={true} height={12} width={12} />
        </div>
        <p className="text-gray-600 text-xs mt-2">
          <Skeleton height={10} width={`80%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`70%`} />
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <Skeleton height={10} width={`50%`} />
        </p>
        <div className="flex justify-between">
          <p className="text-gray-600 text-xs font-bold mt-1">
            <Skeleton height={10} width={`40%`} />
          </p>
          <p className="text-gray-400 italic text-xs mt-1">
            <Skeleton height={10} width={`30%`} />
          </p>
        </div>
        <div className="flex mt-4 text-xs space-x-2">
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-200 via-gray-100 to-gray-50 shadow-md p-5 rounded-lg mb-4 relative">
        <div
          onClick={() => navigate('/')}
          className="text-center cursor-pointer"
        >
          <h2 className="text-md font-bold text-red-600">KK TRADING</h2>
          <p className="text-gray-400 text-xs font-bold">
            Site Reports List
          </p>
        </div>
        <i className="fa fa-list text-gray-500" />
      </div>

      {/* PDF Loading Spinner */}
      {pdfLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-xs">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-center mb-4 text-xs">{error}</p>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Filter by Submitted By"
            value={filterBySubmittedBy}
            onChange={(e) => setFilterBySubmittedBy(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          />
          <input
            type="text"
            placeholder="Filter by Contractor Name"
            value={filterByContractorName}
            onChange={(e) => setFilterByContractorName(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>
        <button
          onClick={generatePDF}
          className="mt-2 md:mt-0 bg-red-500 text-white px-4 py-2 rounded text-xs font-bold hover:bg-red-600"
        >
          Generate PDF
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div>
          {/* Table Skeleton for Large Screens */}
          <div className="hidden md:block">
            {renderTableSkeleton()}
          </div>
          {/* Card Skeleton for Small Screens */}
          <div className="md:hidden">
            {renderCardSkeleton()}
          </div>
        </div>
      ) : (
        <>
          {/* No Reports */}
          {filteredReports.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No site reports available.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-xs text-white">
                    <tr className="divide-y">
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-2 py-2">Site Name</th>
                      <th className="px-2 py-2">Contractor</th>
                      <th className="px-2 py-2">Customer</th>
                      <th className="px-2 py-2">Submitted By</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateReports().map((report) => (
                      <tr
                        key={report._id}
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        <td className="px-4 py-2 text-center">
                          {renderStatusIndicator(report)}
                        </td>
                        <td onClick={()=> navigate(`/report/edit/${report._id}`)} className="px-2 py-2 text-xs">
                          {report.siteName}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {report.contractorName}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {report.customerName}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {report.submittedBy}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleView(report)}
                              className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                            >
                              <i className="fa fa-eye mr-1"></i> View
                            </button>
                            <input
                              type="checkbox"
                              checked={report.visited || false}
                              onChange={() => handleCheckboxChange(report)}
                              className="form-checkbox h-4 w-4 text-red-600"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginateReports().map((report) => (
                  <div
                    key={report._id}
                    className="bg-white rounded-lg shadow-md p-6 mb-4 transition-transform transform hover:scale-100 duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-md font-bold text-red-600">
                        {report.siteName}
                      </p>
                      {renderStatusIndicator(report)}
                    </div>
                    <p className="text-gray-600 text-xs mt-2">
                      Contractor: {report.contractorName}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Customer: {report.customerName}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Submitted By: {report.submittedBy}
                    </p>
                    <div className="flex mt-4 text-xs space-x-2">
                      <button
                        onClick={() => handleView(report)}
                        className="bg-red-500 text-white px-3 font-bold py-1 rounded hover:bg-red-600 flex items-center"
                      >
                        <i className="fa fa-eye mr-2"></i> View
                      </button>
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={report.visited || false}
                          onChange={() => handleCheckboxChange(report)}
                          className="form-checkbox h-4 w-4 text-red-600"
                        />
                        <span className="text-xs">Visited</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 text-xs font-bold py-2 rounded-lg ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 text-xs font-bold py-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Modal for Viewing Report Details */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-auto">
          <div className="bg-white rounded-lg p-5 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <i className="fa fa-times"></i>
            </button>
            <div className="mt-2 p-2">
              <p className="text-sm text-gray-600 font-bold mb-2 text-red-600">
                Details for Site: {selectedReport.siteName}
              </p>
              <div className="flex justify-center mb-4">
                {selectedReport.image ? (
                  <img
                    src={selectedReport.image}
                    alt="Site"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                    <p className="text-gray-500 text-xs">No Image</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs">
                  <strong>Address:</strong> {selectedReport.address}
                </p>
                <p className="text-xs">
                  <strong>Customer Name:</strong> {selectedReport.customerName}
                </p>
                <p className="text-xs">
                  <strong>Customer Contact:</strong> {selectedReport.customerContactNumber}
                </p>
                <p className="text-xs">
                  <strong>Contractor Name:</strong> {selectedReport.contractorName}
                </p>
                <p className="text-xs">
                  <strong>Contractor Contact:</strong> {selectedReport.contractorContactNumber}
                </p>
                <p className="text-xs">
                  <strong>Site Details:</strong> {selectedReport.siteDetails}
                </p>
                <p className="text-xs">
                  <strong>Remarks:</strong> {selectedReport.remarks}
                </p>
                <p className="text-xs">
                  <strong>Submitted By:</strong> {selectedReport.submittedBy}
                </p>
                <p className="text-xs">
                  <strong>Visited:</strong> {selectedReport.visited ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
