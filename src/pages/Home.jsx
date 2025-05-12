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

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faWallet} className="text-primary text-2xl" />
                            <h1 className="text-xl font-bold text-gray-900">WalletFrame</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <FontAwesomeIcon icon={faBell} className="text-gray-500 hover:text-primary cursor-pointer text-xl" />
                            <FontAwesomeIcon icon={faUser} className="text-gray-500 hover:text-primary cursor-pointer text-xl" />
                            <button onClick={handleLoginClick} className="btn-secondary">
                                Login
                            </button>
                            <button onClick={handleSignUpClick} className="btn-primary">
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20">
                {showLogin && <UserLogin />}
                {showRegistration && <UserRegistration />}
                {!showLogin && !showRegistration && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Hero Section */}
                        <section className="py-20">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                                        Take Control of Your Finances
                                    </h1>
                                    <p className="text-xl text-gray-600 mb-8">
                                        Smart budgeting, seamless tracking, and intelligent insights all in one place
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button onClick={handleSignUpClick} className="btn-primary">
                                            Get Started &mdash; It&apos;s Free
                                        </button>
                                        <button onClick={handleLoginClick} className="btn-secondary">
                                            Already have an account?
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <FontAwesomeIcon icon={faChartLine} className="text-[12rem] text-primary opacity-10" />
                                </div>
                            </div>
                        </section>

                        {/* Features Section */}
                        <section className="py-20 bg-gray-50 rounded-3xl">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose WalletFrame?</h2>
                            </div>
                            <div className="grid md:grid-cols-3 gap-8">
                                {[
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
                                ].map((feature, index) => (
                                    <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <FontAwesomeIcon icon={feature.icon} className="text-4xl text-primary mb-6" />
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* CTA Section */}
                        <section className="py-20 text-center">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                Ready to Start Your Financial Journey?
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Join thousands of users who have already transformed their financial lives
                            </p>
                            <button onClick={handleSignUpClick} className="btn-primary text-lg px-8 py-3">
                                Create Your Free Account
                            </button>
                        </section>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-600">
                        &copy; {new Date().getFullYear()} WalletFrame. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;