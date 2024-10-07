import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteUser, listUsers } from '../actions/userActions';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { USER_DETAILS_RESET } from '../constants/userConstants';

export default function UserListScreen(props) {
  const navigate = useNavigate();
  const userList = useSelector((state) => state.userList);
  const { loading, error, users } = userList;

  const userDelete = useSelector((state) => state.userDelete);
  const {
    loading: loadingDelete,
    error: errorDelete,
    success: successDelete,
  } = userDelete;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(listUsers());
    dispatch({
      type: USER_DETAILS_RESET,
    });
  }, [dispatch, successDelete]);
  const deleteHandler = (user) => {
    if (window.confirm('Are you sure?')) {
      dispatch(deleteUser(user._id));
    }
  };
  return (
    <div className='container mx-auto p-6'>
           <div className='flex justify-between mb-10'>
      <a href='/' className='t font-bold left-4 text-blue-500'><i className='fa fa-angle-left' /> Back</a>
      <h2 className='text-2xl font-bold text-red-600 '>KK TRADING</h2>
      </div>
      <p className='font-bold mb-5 text-left ml-2'>All Users</p>
      {loadingDelete && <LoadingBox></LoadingBox>}
      {errorDelete && <MessageBox variant="danger">{errorDelete}</MessageBox>}
      {successDelete && (
        <MessageBox variant="success">User Deleted Successfully</MessageBox>
      )}
      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <div className='hidden lg:block'>
        <table className="w-full mx-auto bg-white shadow-md rounded-lg">
          <thead className='bg-gray-200 rounded-lg'>
            <tr>
              {/* <th className='px-4 py-2 text-left'>ID</th> */}
              <th className='px-4 py-2 text-left'>NAME</th>
              <th className='px-4 py-2 text-left'>EMAIL</th>
              <th className='px-4 py-2 text-left'>Is Employee</th>
              <th className='px-4 py-2 text-left'>IS ADMIN</th>
              <th className='px-4 py-2 text-left'>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className='hover:bg-gray-100' key={user._id}>
                {/* <td className="border text-center mx-auto px-4 py-2">{user._id}</td> */}
                <td className="border text-center mx-auto px-4 py-2 truncate">{user.name}</td>
                <td className="border text-center truncate mx-auto px-4 py-2">{user.email}</td>
                <td className="border text-center mx-auto px-4 py-2">{user.isSeller ? 'YES' : ' NO'}</td>
                <td className="border text-center mx-auto px-4 py-2">{user.isAdmin ? 'YES' : 'NO'}</td>
                <td className="border flex text-center mx-auto px-4 py-2">
                  <button
                    type="button"
                    className="bg-red-500 mr-2 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => navigate(`/user/${user._id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 mr-2 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => deleteHandler(user)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}


            {/* Card layout for mobile screens */}
            <div className="lg:hidden space-y-4">

              {users?.map((user,index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                  <div className='flex justify-between'>
                  <h3 className="text-lg font-semibold text-red-600 mb-2">
                    Name: {user.name}
                  </h3>
                  </div>
                  <p className="text-sm mb-1">Username: {user.email}</p>
                  <p className={`text-sm mb-1 ${user.isSeller ? 'text-green-600' : 'text-yellow-600'}`}>Employee: {user.isSeller ? 'Ok' : 'Not Approved'}</p>
                  <p className={`text-sm mb-1 ${user.isAdmin ? 'text-green-600' : 'text-red-600'}`}>Admin: {user.isSeller ? 'Yes' : 'No'}</p>


                  <div className="mt-4 text-right">
                  <div className="mt-4 flex justify-between text-right">
                    <button
                      className="bg-red-500 font-bold text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300" 
                      onClick={() => navigate(`/user/${user._id}/edit`)}
                   >
                      Edit
                    </button>

                    <button
                      className="bg-red-500 font-bold text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300" 
                      onClick={() => deleteHandler(user)}
                   >
                      <i className='fa fa-trash' />
                    </button>
                  </div>
                  </div>
                </div>
              )) }
            </div>
    </div>
  );
}
