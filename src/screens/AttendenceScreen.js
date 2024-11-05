import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from './api';

const TodayAttendance = () => {
  const userSignin = useSelector((state) => state.userSignin);
  const { userInfo } = userSignin;
  const userId = userInfo._id;
  const [attendance, setAttendance] = React.useState(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await api.get(`/api/users/attendance/today/${userId}`);
        setAttendance(response.data);
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message
        );
      }
    };

    fetchAttendance();
  }, [userId]);

  if (error) {
    return <p>Error fetching attendance: {error}</p>;
  }

  if (!attendance) {
    return <p>No attendance record found for today.</p>;
  }

  return (
    <div>
      <h2>Today's Attendance</h2>
      <p><strong>Login Time:</strong> {new Date(attendance.loginTime).toLocaleTimeString()}</p>
      <p><strong>Logout Time:</strong> {attendance.logoutTime ? new Date(attendance.logoutTime).toLocaleTimeString() : 'Not logged out yet'}</p>
    </div>
  );
};

export default TodayAttendance;
