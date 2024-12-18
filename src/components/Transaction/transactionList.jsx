import React from 'react';
import { useTable } from 'react-table';
import './styles/transactionStyles.css';
const TransactionList = ({ transactions }) => {
    const data = React.useMemo(() => transactions, [transactions]);

    const columns = React.useMemo(
        () => [
            {
                Header: 'Description',
                accessor: 'description',
            },
            {
                Header: 'Amount',
                accessor: 'amount',
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
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    return (
        <table {...getTableProps()} className="transaction-table">
            <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map(cell => (
                                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default TransactionList;