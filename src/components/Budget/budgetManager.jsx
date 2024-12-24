import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {setBudgets, setLoading, setError } from '../../slices/budgetSlice';
import budgetService from '../../services/budgetService';
import CreateBudgetModal from './createBudgetModal';
import BudgetList from './budgetList';
import BudgetTransactionList from './budgetTransactionList';
import BudgetChart from './budgetCharts';
import BudgetPerformanceChart from './budgetPerformanceChart';
import TransactionChart from '../Transaction/transactionCharts';
import {faChartLine} from '@fortawesome/free-solid-svg-icons';
import './styles/budgetStyles.css';

const BudgetManager = () => 
{
   const dispatch = useDispatch();
   const { budgets, loading, error } = useSelector(state => state.budget);
   const { user } = useSelector(state => state.auth);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingBudget, setEditingBudget] = useState(null);
   const [selectedBudget, setSelectedBudget] = useState(null);
   const [transactions, setTransactions] = useState([]);
   const [filter, setFilter] = useState({ category: '', dateRange: '' });
    
   useEffect(() => {
       fetchBudgets();
   }, [dispatch]);
    const fetchBudgets = async () => {
       dispatch(setLoading(true));
       try {
           if (!user || !user.id) {
               throw new Error('User not authenticated');
           }
           const data = await budgetService.getUserBudgets(user.id);
           dispatch(setBudgets(data.budgets || []));
       } catch (err) {
           dispatch(setError(err.message));
       } finally {
           dispatch(setLoading(false));
       }
   };
    const handleBudgetSelect = async (budget) => {
       try {
           const data = await transactionService.getBudgetTransactions(budget._id);
           setTransactions(data.transactions);
           setSelectedBudget(budget);
       } catch (err) {
           console.error(err);
       }
   };
    const handleBudgetCreated = () => {
       fetchBudgets(); // Refresh the budget list after creating a new budget
       setIsModalOpen(false);
   };
    const handleEditBudget = (budget) => {
       setEditingBudget(budget);
       setIsModalOpen(true);
   };
    const handleDeleteBudget = async (budgetId) => {
       try {
           await budgetService.deleteBudget(budgetId);
           fetchBudgets(); // Refresh the budget list after deletion
       } catch (err) {
           dispatch(setError(err.message));
       }
   };
    const handleFilterChange = (e) => {
       setFilter({ ...filter, [e.target.name]: e.target.value });
   };
    return (
       <div className="budget-manager">
           <h2>My Budgets</h2>
           <div className="budget-chart-container">
                <FontAwesomeIcon icon={faChartLine} size="lg" />
                <BudgetChart budgets={budgets} />
                {
                    selectedBudget && (
                        <>
                            <BudgetPerformanceChart performanceData={budgets} />
                            <TransactionChart transactions={transactions} />
                        </>
                    )
                }
            </div>
           <div className="budget-filter">
                <input
                    type="text"
                    name="category"
                    placeholder="Filter by category"
                    value={filter.category}
                    onChange={handleFilterChange}
                />
            </div>

           <button onClick={() => setIsModalOpen(true)} className="create-budget-btn">
               + Create Budget
           </button>
           <BudgetList 
               budgets={budgets} 
               onBudgetSelect={handleBudgetSelect}
               onEdit={handleEditBudget} 
               onDelete={handleDeleteBudget} 
           />
           <CreateBudgetModal 
               isOpen={isModalOpen} 
               onClose={() => setIsModalOpen(false)}
               onBudgetCreated={handleBudgetCreated} 
           />
           {selectedBudget && (
               <BudgetTransactionList 
                   transactions={transactions}
                   budget={selectedBudget}
               />
           )}
       </div>
   );
};

export default BudgetManager;