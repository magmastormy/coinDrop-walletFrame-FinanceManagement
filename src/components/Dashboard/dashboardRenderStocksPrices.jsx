import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faArrowTrendDown,
    faStar,
    faEllipsisVertical
} from '@fortawesome/free-solid-svg-icons';

const DashboardRenderStocksPrices = () => {
    // Mock data - replace with real API data
    const mockStocks = [
        {
            id: 1,
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 45230.50,
            change: 2.5,
            volume: '1.2B',
            marketCap: '870.5B',
            favorite: true
        },
        {
            id: 2,
            symbol: 'ETH',
            name: 'Ethereum',
            price: 2350.75,
            change: -1.2,
            volume: '800M',
            marketCap: '280.3B',
            favorite: true
        },
        {
            id: 3,
            symbol: 'ADA',
            name: 'Cardano',
            price: 1.25,
            change: 5.8,
            volume: '150M',
            marketCap: '40.1B',
            favorite: false
        },
        {
            id: 4,
            symbol: 'SOL',
            name: 'Solana',
            price: 98.45,
            change: -0.5,
            volume: '250M',
            marketCap: '35.2B',
            favorite: false
        },
        {
            id: 5,
            symbol: 'DOT',
            name: 'Polkadot',
            price: 18.30,
            change: 3.2,
            volume: '120M',
            marketCap: '18.5B',
            favorite: false
        }
    ];

    const [stocks, setStocks] = useState(mockStocks);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleFavorite = (id) => {
        setStocks(stocks.map(stock => 
            stock.id === id ? { ...stock, favorite: !stock.favorite } : stock
        ));
    };

    const sortedStocks = React.useMemo(() => {
        if (!sortConfig.key) return stocks;

        return [...stocks].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }, [stocks, sortConfig]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.3
            }
        }
    };

    return (
        <motion.div 
            className="table-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="table-header">
                <h3 className="table-title">Market Overview</h3>
                <div className="table-actions">
                    <button className="table-action-button">
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                </div>
            </div>
            <div className="table-responsive">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>Symbol</th>
                            <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>Price</th>
                            <th onClick={() => handleSort('change')} style={{ cursor: 'pointer' }}>24h Change</th>
                            <th onClick={() => handleSort('volume')} style={{ cursor: 'pointer' }}>Volume</th>
                            <th onClick={() => handleSort('marketCap')} style={{ cursor: 'pointer' }}>Market Cap</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStocks.map((stock) => (
                            <motion.tr 
                                key={stock.id}
                                variants={rowVariants}
                            >
                                <td>
                                    <button 
                                        className={`favorite-button ${stock.favorite ? 'active' : ''}`}
                                        onClick={() => handleFavorite(stock.id)}
                                    >
                                        <FontAwesomeIcon icon={faStar} />
                                    </button>
                                </td>
                                <td>
                                    <div className="symbol-cell">
                                        <span className="symbol">{stock.symbol}</span>
                                        <span className="name">{stock.name}</span>
                                    </div>
                                </td>
                                <td>${stock.price.toLocaleString()}</td>
                                <td className={stock.change >= 0 ? 'positive' : 'negative'}>
                                    <FontAwesomeIcon 
                                        icon={stock.change >= 0 ? faArrowTrendUp : faArrowTrendDown} 
                                        className="trend-icon"
                                    />
                                    {stock.change}%
                                </td>
                                <td>${stock.volume}</td>
                                <td>${stock.marketCap}</td>
                                <td>
                                    <button className="action-button">
                                        <FontAwesomeIcon icon={faEllipsisVertical} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default DashboardRenderStocksPrices;