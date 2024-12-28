// src/components/Transaction/transactionList.jsx
import React from 'react';
import { useTable } from 'react-table';
import './styles/transactionListStyles.css';

const TransactionList = ({ transactions=[], handleEdit, handleDelete }) => {
    const data = React.useMemo(() => 
        Array.isArray(transactions) ? transactions : [], 
        [transactions]
    );

    const columns = React.useMemo(
        () => [
            {
                Header: 'Description',
                accessor: 'description',
            },
            {
                Header: 'Amount',
                accessor: 'amount',
                Cell: ({ value }) => `$${Number(value).toFixed(2)}`
            },
            {
                Header: 'Type',
                accessor: 'type',
            },
            {
                Header: 'Date',
                accessor: 'date',
                Cell: ({ value }) => new Date(value).toLocaleDateString(),
            },
            {
                Header: 'Actions',
                accessor: 'actions',
                Cell: ({ row }) => (
                    <div>
                        <button onClick={() => handleEdit(row.original)}>Edit</button>
                        <button onClick={() => handleDelete(row.original._id)}>Delete</button>
                    </div>
                ),
            },
        ],
        [handleEdit, handleDelete]
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    return (
        <table className="transaction-table" {...getTableProps()}>
            <thead>
                {headerGroups.map(headerGroup => {
                    const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                    return (
                        <tr key={key} {...headerGroupProps}>
                            {headerGroup.headers.map(column => {
                                const { key, ...columnProps } = column.getHeaderProps();
                                return (
                                    <th key={key} {...columnProps}>
                                        {column.render('Header')}
                                    </th>
                                );
                            })}
                        </tr>
                    );
                })}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row);
                    const { key, ...rowProps } = row.getRowProps();
                    return (
                        <tr key={key} {...rowProps}>
                            {row.cells.map(cell => {
                                const { key, ...cellProps } = cell.getCellProps();
                                return (
                                    <td key={key} {...cellProps}>
                                        {cell.render('Cell')}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default TransactionList;