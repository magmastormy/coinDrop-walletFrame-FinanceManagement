import CreateEducationPost from './createEditEducationPost';
import EducationPostList from './listUserEducationPost';
import UserEducationInformation from './userEducationInformationBar';
import React, { useState } from 'react';
import './styles/userEducationManagerStyles.css';


const UserEducationManager = () => {
    const [educations, setEducations] = useState([]);

    const handleCreateEducation = (newEducation) => {
        setPosts([...educations, newEducation]);
    };

    return (
        <div className="user-education-manager">
            <CreateEducationPost onCreateEducation={handleCreateEducation} />
            <UserEducationInformation />
            <EducationPostList educations={educations} />
        </div>
    );
};

export default UserEducationManager;