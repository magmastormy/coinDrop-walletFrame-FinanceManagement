# WalletFrame-Budget

WalletFrame-Budget is a sophisticated budget management application built using modern web technologies. It streamlines personal finance tracking and savings management with an intuitive interface and powerful features.

## Key Features
- **Savings Account Management**:  
  - Render savings account cards with details like balance, automation options, and action buttons (edit, transfer, deposit, withdraw).  
  - Themed UI supporting light and dark modes.  
  - Interactive transaction tables for individual savings accounts.
- **Budget Tracking**:  
  - Easily organize and monitor income and expenditures.  
  - Set savings goals and track progress with automation options.
- **User-Friendly Actions**:  
  - Transfer funds between savings accounts.  
  - Edit savings account details.  
  - Deposit and withdraw money seamlessly.

## Technologies Used
- **Frontend**: React.js with Vite for a fast and optimized development experience.
- **Backend**: Node.js with MongoDB for efficient data management.
- **UI/UX**: Custom themes and responsive design for an enhanced user experience.

## Setup Instructions
1. **Clone the Repository**:  
   ```bash
   git clone https://github.com/magmastormy/walletFrame-Budget.git  
   cd walletFrame-Budget  
   ```
2. **Install Dependencies**:  
   ```bash
   npm install  
   ```
3. **Run the Development Server**:  
   ```bash
   npm run dev  
   ```  
   The application will be available at `http://localhost:3000`.
4. **Build for Production**:  
   ```bash
   npm run build  
   ```
5. **Test the Application**:  
   ```bash
   npm test  
   ```

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## Known Issues
- Options menu in the savings account card is not interactable.
- Error handling for savings goal deletion needs improvement.
- Write conflicts during MongoDB operations require retries or multi-document transactions.

## License
This project is licensed under the [MIT License](LICENSE).