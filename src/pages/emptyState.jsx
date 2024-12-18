import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon, title, description, action }) => {
    return (
        <motion.div 
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="empty-state-icon">
                {icon}
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            {action && (
                <div className="empty-state-action">
                    {action}
                </div>
            )}
        </motion.div>
    );
};

export default EmptyState;