


const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-gold)' }}></div>
            <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Loading...</span>
        </div>
    );
};

export default LoadingSpinner;
