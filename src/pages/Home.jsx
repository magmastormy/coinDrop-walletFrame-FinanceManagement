import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWallet,
    faChartLine,
    faUsers,
    faBell,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import UserRegistration from '../components/Auth/userRegistrationForm';
import UserLogin from '../components/Auth/userLoginForm';

const Home = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);

    const handleLoginClick = () => {
        setShowLogin(true);
        setShowRegistration(false);
    };

    const handleSignUpClick = () => {
        setShowRegistration(true);
        setShowLogin(false);
    };

    const features = [
        {
            icon: faWallet,
            title: "Smart Wallet Management",
            description: "Organize and track multiple wallets in one place. Get real-time updates and insights."
        },
        {
            icon: faChartLine,
            title: "Visual Analytics",
            description: "Beautiful charts and graphs to help you understand your spending patterns."
        },
        {
            icon: faUsers,
            title: "Social Budgeting",
            description: "Connect with friends and family to share budgeting tips and achievements."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">
            {/* Header */}
            <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Use a more vibrant text-primary color if defined in your Tailwind config */}
                            <FontAwesomeIcon icon={faWallet} className="text-primary text-xl sm:text-2xl" />
                            <h1 className="text-lg sm:text-xl font-bold text-gray-800">WalletFrame</h1>
                        </div>
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            {/* Styled icons for better hover effect */}
                            <FontAwesomeIcon
                                icon={faBell}
                                className="text-gray-500 hover:text-primary cursor-pointer text-lg sm:text-xl transition-colors duration-200"
                                title="Notifications"
                            />
                             <FontAwesomeIcon
                                icon={faUser}
                                className="text-gray-500 hover:text-primary cursor-pointer text-lg sm:text-xl transition-colors duration-200"
                                title="User Profile"
                             />
                            {/* Modernized button styles - replace with your actual btn-secondary/btn-primary if they are custom */}
                            <button
                                onClick={handleLoginClick}
                                className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleSignUpClick}
                                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 text-sm sm:text-base shadow-md hover:shadow-lg" // Assuming 'primary' is defined, added shadow
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-16 sm:pt-20">
                {showLogin && (
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                        <UserLogin />
                            </div>
                    )}
                {showRegistration && (
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                        <UserRegistration />
                    </div>
                )}
                {!showLogin && !showRegistration && (
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        {/* Hero Section */}
                        <section className="py-16 sm:py-24 lg:py-32">
                            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                                <div>
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight sm:leading-tight lg:leading-tight mb-4 sm:mb-6">
                                        Take Control of Your Finances
                                    </h1>
                                    <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8">
                                        Smart budgeting, seamless tracking, and intelligent insights all in one place.
                                    </p>
                                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                                        <button
                                            onClick={handleSignUpClick}
                                            className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 text-base sm:text-lg shadow-md hover:shadow-lg w-full sm:w-auto text-center"
                                        >
                                            Get Started &mdash; It&apos;s Free
                                        </button>
                                        <button
                                            onClick={handleLoginClick}
                                            className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-base sm:text-lg w-full sm:w-auto text-center"
                                        >
                                            Already have an account?
                                        </button>
                                    </div>
                                </div>
                                {/* Replaced the large icon with an image placeholder */}
                                <div className="flex justify-center order-first lg:order-last relative">
                                    {/* Placeholder Image - Replace with your actual image asset */}
                                    <img
                                        src="https://placehold.co/600x400/E0E7FF/4338CA?text=Financial+Illustration"
                                        alt="Financial Management Illustration"
                                        className="rounded-lg shadow-xl max-w-full h-auto transition-transform duration-300 hover:scale-105"
                                    />
                                    {/* You can keep a subtle background element if desired, or remove it */}
                                    {/* <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="w-64 h-64 sm:w-80 sm:h-80 bg-primary-light rounded-full opacity-20 animate-pulse"></div>
                                     </div> */}
                                </div>
                            </div>
                        </section>

                        {/* Features Section */}
                        <section className="py-16 sm:py-24 bg-white rounded-xl sm:rounded-2xl shadow-inner">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Why Choose WalletFrame?</h2>
                                <p className="text-lg text-gray-600">Discover the benefits of smart financial management.</p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                                {features.map((feature, index) => (
                                    <div key={index} className="bg-gray-50 p-6 sm:p-8 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"> {/* Changed background, added border */}
                                        {/* Styled icon */}
                                        <div className="flex justify-center mb-4 sm:mb-6">
                                            <FontAwesomeIcon icon={feature.icon} className="text-3xl sm:text-4xl text-primary" />
                                        </div>
                                        {/* Adjusted text styles */}
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 text-center">{feature.title}</h3>
                                        <p className="text-gray-600 text-sm sm:text-base text-center">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* CTA Section */}
                        <section className="py-16 sm:py-24 text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                                Ready to Start Your Financial Journey?
                            </h2>
                            <p className="text-lg text-gray-700 mb-6 sm:mb-8">
                                Join thousands of users who have already transformed their financial lives.
                            </p>
                             {/* Using the modernized primary button style */}
                            <button
                                onClick={handleSignUpClick}
                                className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
                            >
                                Create Your Free Account
                            </button>
                        </section>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <p className="text-center text-sm sm:text-base">
                        &copy; {new Date().getFullYear()} WalletFrame. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;