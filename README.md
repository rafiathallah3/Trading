# 💸 Cryptocurrency Trading Simulation Application

This project is a **Cryptocurrency Trading Simulation App** developed using **Golang** with a **Wails GUI**, simulating how users can trade digital assets in a virtual, risk-free environment. Users can create custom cryptocurrencies or simulate real-world assets like Bitcoin, track their portfolios, and manage transactions using real-time data.

## 🛠 Technologies Used

- **Golang** – Main programming language.
- **Wails** – Desktop GUI framework (uses HTML, CSS, and JS for frontend).
- **Supabase** – Hosted SQL database (used for storing user data, cryptocurrency info, transactions, and portfolios).
- **CoinGecko API** – For fetching real-time data (price, market cap, etc.) of real cryptocurrencies.
- **TradingView Widget** – For displaying real-time trading charts.
- **Sorting & Searching Algorithms**:
  - **Bubble Sort**, **Selection Sort**, **Insertion Sort**
  - **Sequential Search**, **Binary Search**

## 🔑 Features

### 🔍 Search & Sort
- Search cryptocurrencies using **Sequential Search** and **Binary Search**.
- Sort cryptocurrencies based on:
  - **Current Price**
  - **Market Capitalization**
  - Uses **Selection Sort**, **Insertion Sort**, and **Bubble Sort** algorithms.

### 💼 Portfolio Management
- Create or simulate cryptocurrencies.
- Buy/Sell digital assets using virtual balance.

### 📈 Trading Chart
- View real-time price chart for selected cryptocurrencies via **TradingView widget**.

### 🔗 Real-Time Crypto Data
- Use **CoinGecko API** to fetch live data for real cryptocurrencies.
- Users can also create their own tokens with custom or real data.

## 📦 Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/rafiathallah3/trading.git
   cd trading
   ```
2. **Download all dependencies**
    ```bash
    go mod tidy
    ```
3. **Set Environment (.env) file**
    ```bash
    SupaBaseURL=<Supabase URL>
    SupaBaseKey=<Supabase Key>
    ```
4. **Run the application using Wails**
    ```bash
    wails dev
    ```