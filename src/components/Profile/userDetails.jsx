import React from 'react';

const UserDetails = ({ user }) => {
    return (
        <div className="user-details">
            <h2>User Details</h2>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>First Name:</strong> {user.firstName}</p>
            <p><strong>Last Name:</strong> {user.lastName}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
        </div>
    );
};

export default UserDetails;