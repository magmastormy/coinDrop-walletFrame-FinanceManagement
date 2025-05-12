import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faArrowTrendDown,
    faSpinner,
    faRotate
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './styles/dashboardRenderStocksPricesStyles.css';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano'];

const DashboardRenderStocksPrices = () => {
    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchCryptoData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
                params: {
                    ids: CRYPTO_IDS.join(','),
                    vs_currencies: 'usd',
                    include_24hr_change: true,
                    include_last_updated_at: true
                }
            });

            const formattedData = CRYPTO_IDS.map(id => ({
                id,
                name: id.charAt(0).toUpperCase() + id.slice(1),
                price: response.data[id].usd,
                priceChange: response.data[id].usd_24h_change,
                lastUpdated: new Date(response.data[id].last_updated_at * 1000)
            }));

            setCryptoData(formattedData);
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to fetch cryptocurrency data');
            console.error('Error fetching crypto data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCryptoData();
        
        // Refresh data every 5 minutes
        const interval = setInterval(fetchCryptoData, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div 
            className="crypto-prices-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="crypto-header">
                <h3>Cryptocurrency Prices</h3>
                <div className="crypto-actions">
                    {lastUpdated && (
                        <span className="last-updated">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <motion.button
                        className="refresh-button"
                        onClick={fetchCryptoData}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FontAwesomeIcon 
                            icon={loading ? faSpinner : faRotate} 
                            className={loading ? 'fa-spin' : ''} 
                        />
                    </motion.button>
                </div>
            </div>

            {error ? (
                <motion.div 
                    className="error-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.div>
            ) : (
                <div className="crypto-list">
                    {cryptoData.map((crypto, index) => (
                        <motion.div
                            key={crypto.id}
                            className="crypto-item"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: "easeOut"
                            }}
                        >
                            <div className="crypto-info">
                                <div className="crypto-name">
                                    <img 
                                        src={`https://assets.coingecko.com/coins/images/1/thumb/${crypto.id}.png`}
                                        alt={crypto.name}
                                        className="crypto-icon"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <span>{crypto.name}</span>
                                </div>
                                <motion.div 
                                    className="crypto-price"
                                    initial={false}
                                    animate={{ scale: [1.1, 1] }}
                                    transition={{ duration: 0.2 }}
                                >
                                    ${crypto.price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </motion.div>
                            </div>
                            <motion.div 
                                className={`crypto-change ${crypto.priceChange >= 0 ? 'positive' : 'negative'}`}
                                initial={false}
                                animate={{ scale: [1.1, 1] }}
                                transition={{ duration: 0.2 }}
                            >
                                <FontAwesomeIcon 
                                    icon={crypto.priceChange >= 0 ? faArrowTrendUp : faArrowTrendDown} 
                                    className="trend-icon"
                                />
                                {Math.abs(crypto.priceChange).toFixed(2)}%
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default DashboardRenderStocksPrices;