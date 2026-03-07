import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';

const EducationSearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(searchTerm);
    };

    return (
        <form onSubmit={handleSearch} className="relative max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search educational posts..."
                    className="pl-10"
                />
            </div>
        </form>
    );
};

export default EducationSearchBar;
