import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faWallet, 
    faChartLine, 
    faUsers, 
    faGear,
    faBell,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import './styles/homestyle.css';
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
        <div className="home-container">
            <header className="home-header">
                <div className="header-left">
                    <FontAwesomeIcon icon={faWallet} className="logo-icon" />
                    <h1>WalletFrame</h1>
                </div>
                <div className="header-right">
                    <FontAwesomeIcon icon={faBell} className="header-icon" />
                    <FontAwesomeIcon icon={faUser} className="header-icon" />
                    <button onClick={handleLoginClick}>Login</button>
                    <button onClick={handleSignUpClick}>Sign Up</button>
                </div>
            </header>

            <main className="home-main">
                {showLogin && <UserLogin />}
                {showRegistration && <UserRegistration />}
                {!showLogin && !showRegistration && (
                    <div>
                        <section className="welcome-section">
                            <h2>Welcome to WalletFrame</h2>
                            <p>Your personal finance companion</p>
                        </section>

                        <section className="quick-actions">
                            <div className="action-card">
                                <FontAwesomeIcon icon={faChartLine} className="card-icon" />
                                <h3>Dashboard</h3>
                                <p>View your financial overview</p>
                                <Link to="/dashboard" className="action-link">Go to Dashboard</Link>
                            </div>

                            <div className="action-card">
                                <FontAwesomeIcon icon={faUsers} className="card-icon" />
                                <h3>Social</h3>
                                <p>Connect with your network</p>
                                <Link to="/social" className="action-link">View Social</Link>
                            </div>

                            <div className="action-card">
                                <FontAwesomeIcon icon={faGear} className="card-icon" />
                                <h3>Settings</h3>
                                <p>Customize your experience</p>
                                <Link to="/settings" className="action-link">Manage Settings</Link>
                            </div>
                        </section>
                    </div>
                )}
            </main>

            <footer className="home-footer">
                <p>&copy; 2024 WalletFrame. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;