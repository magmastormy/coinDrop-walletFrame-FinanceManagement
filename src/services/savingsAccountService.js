import axiosInstance from "../api/userAxios";

const API_URL = '/savings-accounts';

const getUserSavingsAccounts = async () => {
    const response = await axiosInstance.get(API_URL);
    return response.data;
};

const createSavingsAccount = async (accountData) => {
    const response = await axiosInstance.post(API_URL, accountData);
    return response.data;
};

const updateTransaction = async (transactionData) => {
    const response = await axios.put(`${API_URL}/transactions/${transactionData._id}`, transactionData);
    return response.data;
};

export default {
    getUserSavingsAccounts,
    createSavingsAccount,
    updateTransaction,
};