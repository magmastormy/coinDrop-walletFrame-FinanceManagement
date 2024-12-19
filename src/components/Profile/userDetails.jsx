import React, { useState, useEffect } from 'react';

const UserDetails = ({ user, onSave, onEditToggle }) => {
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    setUserData(user); // Update local state on user prop change
  }, [user]);

  const handleChange = (event) => {
    setUserData({ ...userData, [event.target.name]: event.target.value });
  };

  const handleSave = () => {
    onSave(userData); // Call the provided onSave function with updated data
    setEditMode(false); // Exit edit mode
  };

  const toggleEdit = () => {
    setEditMode(!editMode);
  };

  const renderInput = (field, label) => (
    <div key={field}>
      <label htmlFor={field}>{label}</label>
      {editMode ? (
        <input type="text" name={field} value={userData[field]} onChange={handleChange} />
      ) : (
        <p>{userData[field]}</p>
      )}
    </div>
  );

  const defaultImage = 'https://via.placeholder.com/150'; // Replace with desired default image URL

  return (
    <div className="user-details">
      <h2>User Details</h2>
      <div className="user-image">
        <img
          src={userData.coverPhoto || defaultImage}
          alt="Profile Photo"
          style={{ width: 150, height: 150, borderRadius: '50%' }}
        />
      </div>
      {editMode ? (
        <button onClick={handleSave}>Save</button>
      ) : (
        <button onClick={toggleEdit}>Edit</button>
      )}
      {renderInput('username', 'Username')}
      {renderInput('email', 'Email')}
      {renderInput('firstName', 'First Name')}
      {renderInput('lastName', 'Last Name')}
      {renderInput('phone', 'Phone')}
    </div>
  );
};

export default UserDetails;