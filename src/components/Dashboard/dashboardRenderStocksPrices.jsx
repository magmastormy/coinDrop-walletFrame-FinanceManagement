import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { cn } from '../../lib/utils';

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
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                        {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Updating...'}
                    </span>
                </div>
                <motion.button
                    onClick={fetchCryptoData}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
                >
                    <RefreshCw
                        className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")}
                    />
                </motion.button>
            </div>

            {error ? (
                <motion.div
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {error}
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {cryptoData.map((crypto, index) => (
                        <motion.div
                            key={crypto.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: "easeOut"
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={`https://assets.coingecko.com/coins/images/1/thumb/${crypto.id}.png`}
                                    alt={crypto.name}
                                    className="w-8 h-8 rounded-full"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-foreground">{crypto.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                        ${crypto.price.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                </div>
                            </div>
                            <motion.div
                                className={cn(
                                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
                                    crypto.priceChange >= 0
                                        ? "text-emerald-400 bg-emerald-400/10"
                                        : "text-rose-400 bg-rose-400/10"
                                )}
                                initial={false}
                                animate={{ scale: [1.1, 1] }}
                                transition={{ duration: 0.2 }}
                            >
                                {crypto.priceChange >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
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
