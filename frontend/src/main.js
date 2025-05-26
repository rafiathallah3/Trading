import './style.css';
import './app.css';

import {Login, Register, DapatinAkun, Portfolio, Beli, Jual, Transaksi, BuatKripto, Kripto, EditKripto, HapusKripto } from '../wailsjs/go/main/App';
import { models } from '../wailsjs/go/models';

const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const indexSection = document.getElementById('indexSection');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const indexBtn = document.getElementById('indexBtn');
const logoutBtn = document.getElementById('logoutBtn');

const goToLogin = document.getElementById('goToLogin');
const goToRegister = document.getElementById('goToRegister');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const cryptoList = document.getElementById('cryptoList');
const portfolioList = document.getElementById('portfolioList');
const transactionHistory = document.getElementById('transactionHistory');

const userBalanceElement = document.getElementById('userBalance');
const portfolioValueElement = document.getElementById('portfolioValue');

// Bootstrap Modals
const addCryptoModal = new bootstrap.Modal(document.getElementById('addCryptoModal'));
const editCryptoModal = new bootstrap.Modal(document.getElementById('editCryptoModal'));
const buyCryptoModal = new bootstrap.Modal(document.getElementById('buyCryptoModal'));
const sellCryptoModal = new bootstrap.Modal(document.getElementById('sellCryptoModal'));

// Data Storage
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let cryptocurrencies = JSON.parse(localStorage.getItem('cryptocurrencies')) || [
    { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 50000, marketCap: 950000000000, change: 2.5 },
    { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3000, marketCap: 350000000000, change: 1.8 },
    { id: 3, name: 'Cardano', symbol: 'ADA', price: 2.5, marketCap: 80000000000, change: -0.5 },
    { id: 4, name: 'Solana', symbol: 'SOL', price: 150, marketCap: 45000000000, change: 5.2 },
    { id: 5, name: 'Polkadot', symbol: 'DOT', price: 35, marketCap: 35000000000, change: -1.2 }
];
let ListKripto = [];
let KriptoYangAda = [];

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toFixedTrunc(x, digits) {
    const factor = Math.pow(10, digits);
    return (Math.trunc(x * factor) / factor).toFixed(digits);
}

// TradingView Widget Integration
let SimbolDiPilih = 'GOLD'
function loadTradingViewWidget() {
    // Clear previous widget if exists
    document.getElementById('tradingview_widget_container').innerHTML = '';
    
    new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": SimbolDiPilih,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": false,
        "container_id": "tradingview_widget_container"
    });
}

let currentSearchTerm = '';
let currentSortOption = '';

// Event listener for chart symbol selector
document.getElementById('chartSymbolSelector').addEventListener('change', function() {
    SimbolDiPilih = this.value;
    loadTradingViewWidget();
});

// Initialize the app
async function init() {
    // Show login section by default
    showSection(loginSection);
    
    const akun = await DapatinAkun()
    if(akun.id !== -1) {
        const portfolio = await Portfolio();
        akun.portfolio = portfolio;
        const transaksi = await Transaksi();
        akun.transactions = transaksi

        currentUser = akun;
        showSection(indexSection);
        updateDashboard();
        
        // Initialize TradingView widget
        loadTradingViewWidget();
    }

    // Update navbar based on login status
    updateNavbar();

    document.getElementById('cryptoSearch').addEventListener('keydown', async function(e) {
        if(e.key === "Enter") {
            let sebelumCurrentSearch = currentSearchTerm;
            currentSearchTerm = this.value;
    
            if (sebelumCurrentSearch != this.value) {
                await updateDashboard();
            }
        }
    });

    document.getElementById('clearSearchBtn').addEventListener('click', async function() {
        document.getElementById('cryptoSearch').value = '';
        let sebelumCurrentSearch = currentSearchTerm;
        currentSearchTerm = '';

        if(sebelumCurrentSearch != currentSearchTerm) {
            await updateDashboard();
        }
    });

    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            let sebelumCurrentSort = currentSortOption;
            currentSortOption = this.dataset.sort;

            if(sebelumCurrentSort != this.dataset.sort) {
                updateDashboard();
            }
            
            // Update dropdown button text
            const sortText = this.textContent;
            document.getElementById('sortDropdown').innerHTML = `<i class="bi bi-sort-down"></i> ${sortText}`;
        });
    });

    const kriptoID = document.getElementById('cryptoID');
    document.getElementById("verifikasiCrypto").addEventListener('click', function() {
        const apakahData = ListKripto.find(item => item.id == kriptoID.value);
        if(apakahData) {
            updateTambahKripto(apakahData)
            return;
        }

        $.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${kriptoID.value}&x_cg_demo_api_key=CG-yYG9FmMVNXk1VuXf2FriEpyf`, data => {
            if(data.length <= 0) {
                updateTambahKripto({});
                alert(`Symbol: ${kriptoID.value} is not found!`);
                return;
            }

            ListKripto.push(...data);
            updateTambahKripto(data[0]);
        });
    });

    $.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=&per_page=250&page=1&x_cg_demo_api_key=CG-yYG9FmMVNXk1VuXf2FriEpyf`, data => {
        ListKripto = data;
        const input = document.getElementById("cryptoID");
        const list = document.getElementById("autocompleteList");

        input.addEventListener("input", function () {
            const value = this.value.toLowerCase();
            list.innerHTML = "";

            if (!value) return;

            const exactMatch = data.find(item => item.id === value);
            if (exactMatch) {
                list.innerHTML = "";
                return;
            }

            const filtered = data.filter(item => item.id.includes(value));

            filtered.forEach(item => {
                const div = document.createElement("div");
                div.textContent = item.id;
                div.classList.add("autocomplete-item");
                
                div.addEventListener("click", () => {
                    input.value = item.id;
                    list.innerHTML = "";
                });

                list.appendChild(div);
            });
        });


        document.addEventListener("click", function (e) {
            if (e.target !== input) {
                list.innerHTML = "";
            }
        });
    });
}

// Section Navigation
function showSection(section) {
    // Hide all sections
    loginSection.classList.remove('active');
    registerSection.classList.remove('active');
    indexSection.classList.remove('active');
    
    // Show the selected section
    section.classList.add('active');
}

function updateTambahKripto(data) {
    const inputCryptoSymbol = document.getElementById("cryptoSymbol");
    const inputHargaKripto  = document.getElementById("cryptoPrice");
    const inputMarketCap    = document.getElementById("cryptoMarketCap");
    const inputCryptoChange = document.getElementById("cryptoChange");

    inputCryptoSymbol.value = data.symbol ? data.symbol.toUpperCase() : "";
    inputHargaKripto.value = data.current_price ? data.current_price : 0;
    inputMarketCap.value = data.market_cap ? data.market_cap : 0;
    inputCryptoChange.value = data.market_cap_change_percentage_24h ? data.market_cap_change_percentage_24h : 0;

    inputCryptoSymbol.disabled = Object.keys(data).length !== 0;
    inputHargaKripto.disabled = Object.keys(data).length !== 0;
    inputMarketCap.disabled = Object.keys(data).length !== 0;
    inputCryptoChange.disabled = Object.keys(data).length !== 0;
}

// Update navbar based on login status
function updateNavbar() {
    if (currentUser) {
        // User is logged in, hide login/register buttons
        loginBtn.classList.add('d-none');
        registerBtn.classList.add('d-none');
        indexBtn.classList.remove('d-none');
        logoutBtn.classList.remove('d-none');
    } else {
        // User is logged out, show login/register buttons
        loginBtn.classList.remove('d-none');
        registerBtn.classList.remove('d-none');
        indexBtn.classList.add('d-none');
        logoutBtn.classList.add('d-none');
    }
}

// Event Listeners for Navigation
loginBtn.addEventListener('click', () => showSection(loginSection));
registerBtn.addEventListener('click', () => showSection(registerSection));
indexBtn.addEventListener('click', () => {
    if (currentUser) {
        showSection(indexSection);
        updateDashboard();
    } else {
        alert('Please login first');
        showSection(loginSection);
    }
});

goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(loginSection);
});

goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(registerSection);
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    // localStorage.removeItem('currentUser');
    showSection(loginSection);
    updateNavbar();
});

// Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const hasil = await Login(username, password);
    if(hasil.status === "Success" && hasil.akun !== -1) {
        const portfolio = await Portfolio();
        hasil.akun.portfolio = portfolio;
        
        const transaksi = await Transaksi();
        hasil.akun.transactions = transaksi;

        currentUser = hasil.akun;
        // localStorage.setItem('currentUser', JSON.stringify(hasil.akun));
        showSection(indexSection);
        updateDashboard();
        updateNavbar();
        
        // Initialize TradingView widget
        loadTradingViewWidget();
        
        loginForm.reset();

        return;
    }

    alert('Invalid username or password');
});

// Register Form Submission
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (users.some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        uang: 10000,
        portfolio: [],
        transactions: []
    };
    
    users.push(newUser);
    // localStorage.setItem('users', JSON.stringify(users));
    
    alert('Registration successful! Please login.');
    registerForm.reset();
    showSection(loginSection);
});

// Update Dashboard
async function updateDashboard() {
    const akun = await DapatinAkun()
    if(akun.id !== -1) {
        const portfolio = await Portfolio();
        akun.portfolio = portfolio;
        const transaksi = await Transaksi();
        akun.transactions = transaksi

        currentUser = akun;
    }

    if (!currentUser) return;
    
    // Update user balance
    userBalanceElement.textContent = toFixedTrunc(currentUser.uang, 2);

    await updateKripto();

    // Update portfolio value
    await updatePortfolioValue();
    
    // Render cryptocurrency list
    await renderCryptoList();
    
    // Render portfolio
    await renderPortfolio();
    
    // Render transaction history
    await renderTransactionHistory();
}

async function updateKripto() {
    let krip = await Kripto("", "");

    const promises = krip.map(async (crypto, i) => {
        if (crypto.apakah_asli) {
            try {
                const data = await new Promise((resolve, reject) => {
                    $.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${crypto.kuripto_id}&x_cg_demo_api_key=CG-yYG9FmMVNXk1VuXf2FriEpyf`)
                        .done(resolve)
                        .fail(reject);
                });

                crypto.market_cap = data[0].market_cap;
                crypto.change_24h = data[0].market_cap_change_percentage_24h;
                crypto.harga = data[0].current_price;

                krip[i].market_cap = crypto.market_cap;
                krip[i].change_24h = crypto.change_24h;
                krip[i].harga = crypto.harga;
            } catch (error) {
                console.error(`Failed to fetch data for ${crypto.kuripto_id}:`, error);
            }
        }
    });

    await Promise.all(promises);
    KriptoYangAda = krip
}

// Calculate and update portfolio value
async function updatePortfolioValue() {
    let totalValue = 0;

    currentUser.portfolio.forEach((item, i) => {
        const crypto = KriptoYangAda.find(c => c.kuripto_id === item.mata_uang);
        if (!crypto) return;

        totalValue += crypto.harga * item.jumlah;
    })

    portfolioValueElement.textContent = toFixedTrunc(totalValue, 2);
}

// Render cryptocurrency list
async function renderCryptoList() {
    let krip = await Kripto(currentSortOption, currentSearchTerm)
    cryptoList.innerHTML = '';
    
    if (krip.length === 0) {
        cryptoList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No cryptocurrencies found</td>
            </tr>
        `;
        return;
    }

    krip.forEach(async (item, i) => {
        const crypto = KriptoYangAda.find(c => c.kuripto_id === item.kuripto_id);
        if (!crypto) return;
        
        const row = document.createElement('tr');
        
        const changeClass = crypto.change_24h >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = crypto.change_24h >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
        
        row.innerHTML = `
            <td>${crypto.nama}</td>
            <td>${crypto.simbol}</td>
            <td>$${toFixedTrunc(crypto.harga, 2)}</td>
            <td>$${formatNumber(crypto.market_cap)}</td>
            <td class="${changeClass}">
                <i class="bi ${changeIcon}"></i> ${toFixedTrunc(Math.abs(crypto.change_24h), 2)}%
            </td>
            <td>
                <button class="btn btn-sm btn-success buy-btn" data-id="${crypto.kuripto_id}">
                    <i class="bi bi-cart-plus"></i> Buy
                </button>
                <button class="btn btn-sm btn-primary edit-btn" data-id="${crypto.kuripto_id}">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${crypto.kuripto_id}">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        
        cryptoList.appendChild(row);

        row.querySelector('.buy-btn').addEventListener('click', () => openBuyModal(crypto.kuripto_id));
        row.querySelector('.edit-btn').addEventListener('click', () => openEditModal(crypto.kuripto_id));
        row.querySelector('.delete-btn').addEventListener('click', () => deleteCrypto(crypto.kuripto_id));
    });

    const chartSymbolSelector = document.getElementById("chartSymbolSelector");
    chartSymbolSelector.innerHTML = '<option value="GOLD">GOLD</option>';
    let apakahAda = false;
    KriptoYangAda.forEach(kripto => {
        if(kripto.apakah_asli) {
            const option = document.createElement('option');
            option.innerHTML = `${kripto.nama} (${kripto.simbol} / USD)`;
            option.setAttribute("value", kripto.simbol+"USD");

            if(kripto.simbol + "USD" === SimbolDiPilih) {
                apakahAda = true;
                chartSymbolSelector.value = SimbolDiPilih;
            }
    
            chartSymbolSelector.appendChild(option);
        }
    });

    if(!apakahAda) {
        SimbolDiPilih = "GOLD";
    }    
}

// Render user portfolio
async function renderPortfolio() {
    portfolioList.innerHTML = '';
    
    if(!currentUser) {
        return;
    }

    currentUser.portfolio = await Portfolio();

    if (!currentUser.portfolio.length) {
        portfolioList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Your portfolio is empty</td>
            </tr>
        `;
        return;
    }

    const semua_transaksi = await Transaksi();
    const jumlah_hasil = {};
    semua_transaksi.forEach(transaksi => {
        if(jumlah_hasil[transaksi.mata_uang] === undefined) {
            jumlah_hasil[transaksi.mata_uang] = 0
        }

        if(transaksi.tipe === "BUY") {
            jumlah_hasil[transaksi.mata_uang] += transaksi.harga * transaksi.jumlah;
        } else {
            jumlah_hasil[transaksi.mata_uang] -= transaksi.harga  * transaksi.jumlah;
        }
    });

    currentUser.portfolio.forEach(item => {
        const crypto = KriptoYangAda.find(c => c.kuripto_id === item.mata_uang);
        if (!crypto) return;
        
        const value = crypto.harga * item.jumlah;
        const profit = toFixedTrunc((value - jumlah_hasil[item.mata_uang]), 3);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${crypto.nama} (${crypto.simbol})</td>
            <td>${toFixedTrunc(item.jumlah, 5)}</td>
            <td>$${toFixedTrunc(value, 2)}</td>
            <td class=${(profit > 0 ? "text-success" : "text-danger")}>${profit}</td>
            <td>
                <button class="btn btn-sm btn-danger sell-btn" data-id="${crypto.kuripto_id}">
                    <i class="bi bi-cart-dash"></i> Sell
                </button>
            </td>
        `;
        
        portfolioList.appendChild(row);
    });
    
    // Add event listeners to sell buttons
    document.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', () => openSellModal(btn.dataset.id));
    });
}

// Render transaction history
async function renderTransactionHistory() {
    transactionHistory.innerHTML = '';
    
    if(!currentUser) {
        return;
    }

    currentUser.transactions = await Transaksi();

    if (!currentUser.transactions.length) {
        transactionHistory.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No transactions yet</td>
            </tr>
        `;
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...currentUser.transactions].sort((a, b) => b.date - a.date);
    
    sortedTransactions.forEach(transaction => {
        // const crypto = KriptoYangAda.find(c => c.kuripto_id === transaction.mata_uang);
        // if (!crypto) return;
        
        const row = document.createElement('tr');
        const date = new Date(transaction.created_at).toLocaleString();
        const typeClass = transaction.tipe === 'BUY' ? 'text-success' : 'text-danger';
        
        row.innerHTML = `
            <td>${date}</td>
            <td class="${typeClass}">${transaction.tipe.toUpperCase()}</td>
            <td>${transaction.mata_uang} (BTC)</td>
            <td>${toFixedTrunc(transaction.jumlah, 5)}</td>
            <td>$${toFixedTrunc(transaction.harga, 2)}</td>
            <td>$${toFixedTrunc((transaction.jumlah * transaction.harga), 2)}</td>
        `;
        
        transactionHistory.appendChild(row);
    });
}

// Add Cryptocurrency
document.getElementById('saveCryptoBtn').addEventListener('click', async () => {
    const nama = document.getElementById('cryptoName').value;
    const kuripto_id = document.getElementById('cryptoID').value;
    const simbol = document.getElementById('cryptoSymbol').value;
    const harga = parseFloat(document.getElementById('cryptoPrice').value);
    const market_cap = parseFloat(document.getElementById('cryptoMarketCap').value);
    const change_24h = parseFloat(document.getElementById('cryptoChange').value);
    
    if (!nama || !kuripto_id || !simbol || isNaN(harga) || isNaN(market_cap) || isNaN(change_24h)) {
        alert('Please fill all fields correctly');
        return;
    }
    
    const hasil = await BuatKripto(new models.Kripto({
        nama,
        kuripto_id,
        simbol,
        harga,
        market_cap,
        change_24h
    }));
    
    if(hasil === "Sukses") {
        // cryptocurrencies.push(newCrypto);
        
        addCryptoModal.hide();
        document.getElementById('addCryptoForm').reset();
    } else {
        alert("Error when creating a cryptocurrency, please try again!");
    }

    updateDashboard();
});

// Open Edit Cryptocurrency Modal
function openEditModal(cryptoId) {
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    if (!crypto) return;
    
    document.getElementById('editCryptoId').value = crypto.kuripto_id;
    document.getElementById('editCryptoName').value = crypto.nama;
    document.getElementById('editCryptoSymbol').value = crypto.simbol;
    document.getElementById('editCryptoPrice').value = crypto.harga;
    document.getElementById('editCryptoChange').value = crypto.change_24h;

    document.getElementById('editCryptoSymbol').disabled = crypto.apakah_asli;
    document.getElementById('editCryptoPrice').disabled = crypto.apakah_asli;
    document.getElementById('editCryptoChange').disabled = crypto.apakah_asli;
    
    editCryptoModal.show();
}

// Update Cryptocurrency
document.getElementById('updateCryptoBtn').addEventListener('click', async () => {
    const kuripto_id = document.getElementById('editCryptoId').value;
    const nama = document.getElementById('editCryptoName').value;
    const simbol = document.getElementById('editCryptoSymbol').value;
    const harga = parseFloat(document.getElementById('editCryptoPrice').value);
    const change_24h = parseFloat(document.getElementById('editCryptoChange').value);
    
    if (!nama || !simbol || isNaN(harga) || isNaN(change_24h)) {
        alert('Please fill all fields correctly');
        return;
    }

    const index = KriptoYangAda.findIndex(c => c.kuripto_id === kuripto_id);
    if (index === -1) return;
    
    const hasil = await EditKripto(new models.Kripto({
        nama,
        kuripto_id,
        simbol,
        harga,
        market_cap: KriptoYangAda[index].market_cap,
        change_24h
    }))
    
    if(hasil !== "Sukses") {
        alert(`Error when updating cryptocurrency! ${hasil}`)
    }

    editCryptoModal.hide();
    updateDashboard();
});

// Delete Cryptocurrency
async function deleteCrypto(cryptoId) {
    if (!confirm('Are you sure you want to delete this cryptocurrency?')) return;
    
    const hasil = await HapusKripto(cryptoId);

    if(hasil !== "Sukses") {
        alert("Error when trying to delete a cryptocurrency! " + hasil);
    }

    updateDashboard();
}

// Open Buy Cryptocurrency Modal
function openBuyModal(cryptoId) {
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    if (!crypto) return;
    
    document.getElementById('buyCryptoId').value = crypto.kuripto_id;
    document.getElementById('buyCryptoName').value = `${crypto.nama} (${crypto.simbol.toUpperCase()})`;
    document.getElementById('buyCryptoPrice').value = `$${toFixedTrunc(crypto.harga, 2)}`;
    
    const buyAmount = document.getElementById('buyAmount');
    buyAmount.value = '0';
    buyAmount.max = currentUser.uang / crypto.harga;
    
    document.getElementById('buyTotal').value = '$0.00';
    
    // Calculate total on amount change
    buyAmount.addEventListener('input', () => {
        const amount = parseFloat(buyAmount.value);
        if (isNaN(amount)) {
            document.getElementById('buyTotal').value = '$0.00';
            return;
        }
        
        const total = amount * crypto.harga;
        document.getElementById('buyTotal').value = `$${toFixedTrunc(total, 2)}`;
    });

    document.getElementById('buySliderAmount').value = 0;
    document.getElementById('buySliderAmount').setAttribute("max", currentUser.uang / crypto.harga);
    
    buyCryptoModal.show();
}

// Buy Cryptocurrency
document.getElementById('confirmBuyBtn').addEventListener('click', async () => {
    const cryptoId = document.getElementById('buyCryptoId').value;
    const amount = parseFloat(document.getElementById('buyAmount').value);
    
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    if (!crypto) return;
    
    const total = amount * crypto.price;
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (total > currentUser.uang) {
        alert('Insufficient balance');
        return;
    }

    const hasil = await Beli(cryptoId, amount.toString())
    if(hasil.status !== "Success") {
        alert(`Error when buying crypto! ${hasil.status}`);
        return;
    }

    buyCryptoModal.hide();
    updateDashboard();
});

// Open Sell Cryptocurrency Modal
function openSellModal(cryptoId) {
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    if (!crypto) return;
    
    const portfolioItem = currentUser.portfolio.find(item => item.mata_uang === cryptoId);
    if (!portfolioItem || portfolioItem.amount <= 0) {
        alert('You do not own any of this cryptocurrency');
        return;
    }
    
    document.getElementById('sellCryptoId').value = crypto.kuripto_id;
    document.getElementById('sellCryptoName').value = `${crypto.nama} (${crypto.simbol})`;
    document.getElementById('sellCryptoPrice').value = `$${toFixedTrunc(crypto.harga, 2)}`;
    document.getElementById('sellAvailable').value = portfolioItem.jumlah;
    
    const sellAmount = document.getElementById('sellAmount');
    sellAmount.value = '';
    sellAmount.max = portfolioItem.jumlah;
    
    document.getElementById('sellTotal').value = '$0.00';
    
    // Calculate total on amount change
    sellAmount.addEventListener('input', () => {
        const amount = parseFloat(sellAmount.value);
        if (isNaN(amount)) {
            document.getElementById('sellTotal').value = '$0.00';
            return;
        }
        
        const total = amount * crypto.harga;
        document.getElementById('sellTotal').value = `$${toFixedTrunc(total, 2)}`;
    });
    
    sellCryptoModal.show();
}

// Sell Cryptocurrency
document.getElementById('confirmSellBtn').addEventListener('click', async () => {
    const cryptoId = document.getElementById('sellCryptoId').value;
    const amount = document.getElementById('sellAmount').value;
    
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    if (!crypto) return;

    const hasil = await Jual(cryptoId, amount);
    
    if(hasil.status !== "Sukses") {
        alert("Error when selling cryptocurrency! " + hasil.status)
    }
    
    sellCryptoModal.hide();
    updateDashboard();
});

// Calculate buy total on amount change
document.getElementById('buyAmount').addEventListener('input', function() {
    const amount = parseFloat(this.value);
    const cryptoId = document.getElementById('buyCryptoId').value;
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    
    if (!crypto || isNaN(amount)) {
        document.getElementById('buyTotal').value = '$0.00';
        return;
    }
    
    const total = amount * crypto.price;
    document.getElementById('buyTotal').value = `$${toFixedTrunc(total, 2)}`;
});

document.getElementById('buySliderAmount').addEventListener('input', function() {
    document.getElementById('buyAmount').value = this.value;

    const cryptoId = document.getElementById('buyCryptoId').value;
    const crypto = KriptoYangAda.find(c => c.kuripto_id === cryptoId);
    
    if (!crypto || isNaN(this.value)) {
        document.getElementById('buyTotal').value = '$0.00';
        return;
    }
    
    const total = this.value * crypto.harga;
    document.getElementById('buyTotal').value = `$${toFixedTrunc(total, 2)}`;
});

// Calculate sell total on amount change
document.getElementById('sellAmount').addEventListener('input', function() {
    const amount = parseFloat(this.value);
    const cryptoId = parseInt(document.getElementById('sellCryptoId').value);
    const crypto = cryptocurrencies.find(c => c.id === cryptoId);
    
    if (!crypto || isNaN(amount)) {
        document.getElementById('sellTotal').value = '$0.00';
        return;
    }
    
    const total = amount * crypto.price;
    document.getElementById('sellTotal').value = `$${toFixedTrunc(total, 2)}`;
});

// Initialize the app
init();

setInterval(updateDashboard, 30000);

// new TradingView.widget(
//     {
//         "autosize": true,
//         "symbol": "BINANCE:BTCUSDT",
//         "interval": "240",
//         "timezzone": "Etc/Utc",
//         "theme": "dark",
//         "style": "1",
//         "locale": "en",
//         "toolbar_bg": "#f1f3f6",
//         "enable_publishing": true,
//         "withdateranges": false,
//         "hide_side_toolbar": true,
//         "allow_symbol_change": true,
//         "watchlist": [
//             "BINANCE:BTCUSDT",
//             "BINANCE:ETHUSDT"
//         ],
//         "details": true,
//         "hotlist": true,
//         "calendar": true,
//         "studies": [
//             "STD;SMA"
//         ],
//         "container_id": "chart",
//         "show_popup_button": true,
//         "popup_width": "1000",
//         "popup_height": "4000"
//     }
// );

// const formatter = new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
  
//     // These options can be used to round to whole numbers.
//     trailingZeroDisplay: 'stripIfInteger'   // This is probably what most people
//                                             // want. It will only stop printing
//                                             // the fraction when the input
//                                             // amount is a round number (int)
//                                             // already. If that's not what you
//                                             // need, have a look at the options
//                                             // below.
//     //minimumFractionDigits: 0, // This suffices for whole numbers, but will
//                                 // print 2500.10 as $2,500.1
//     //maximumFractionDigits: 0, // Causes 2500.99 to be printed as $2,501
// });

// let Akun = undefined;

// function TunjuinPage(page, status) {
//     if(status) {
//         $(`#${page}`).removeClass("d-none");
//         return;
//     }

//     $(`#${page}`).addClass("d-none");
// }

// function CariPage(page) {
//     switch (page) {
//     case "/login":
//         TunjuinPage("LoginPage", true);
//         TunjuinPage("RegisterPage", false);
//         TunjuinPage("HomePage", false);
//         break
//     case "/register":
//         TunjuinPage("LoginPage", false);
//         TunjuinPage("RegisterPage", true);
//         TunjuinPage("HomePage", false);
//         break
//     case "/":
//         TunjuinPage("LoginPage", false);
//         TunjuinPage("RegisterPage", false);
//         TunjuinPage("HomePage", true);
//         break;
//     }
// }

// function UpdateAkun() {
//     if(Akun === undefined || Akun.id === -1) {
//         return;
//     }
    
//     CariPage("/");
//     TunjuinPage("SudahLoginNavbar", true);
//     TunjuinPage("BelumLoginNavbar", false);
//     $("#username_navbar").text(Akun.username);
//     $("#Uang").text(`${formatter.format(Akun.uang)}`);
//     UpdatePortfolio();
// }

// let TotalBitcoin = 0;
// let TotalPortfolio = 0;
// function UpdatePortfolio() {
//     if (Akun === undefined) {
//         return;
//     }

//     try {
//         Portfolio().then(hasil => {
//             $.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=CG-yYG9FmMVNXk1VuXf2FriEpyf", data => {
//                 const HargaBitcoin = data[0].current_price;
                
//                 TotalPortfolio = 0;
//                 TotalBitcoin = 0;
//                 $("#Portfolio").empty();
//                 hasil.forEach(v => {
//                     $("#Portfolio").append(`
//                     <tr>
//                         <td>Bitcoin</td>
//                         <td>${v.jumlah}</td>
//                         <td>${formatter.format(v.jumlah * HargaBitcoin)}</td>
//                         <td>${v.created_at}</td>
//                     </tr>
//                     `);
                    
//                     TotalBitcoin += v.jumlah;
//                     TotalPortfolio += v.jumlah * HargaBitcoin;
//                 });

//                 $("#UangPortfolio").text(`${formatter.format(TotalPortfolio)}`);
//             });
//         });
//     } catch {
//         console.error(err);
//     }
// }

// $(document).ready(() => {
//     console.log("READY!!")
//     $("a").each((_, v) => {
//         v.addEventListener("click", e => {
//             e.preventDefault();
            
//             CariPage(v.getAttribute("href"))
//         });
//     });

//     DapatinAkun().then(hasil => {
//         Akun = hasil;
//         UpdateAkun();
//     });

//     let ApakahLogin = false;
//     $("#submit_login").on("click", () => {
//         if(ApakahLogin) {
//             return;
//         }
//         ApakahLogin = true;

//         try {
//             Login($("#username_login").val(), $("#password_login").val()).then(hasil => {
//                 if(hasil.status === "Success" && hasil.akun !== -1) {
//                     Akun = hasil.akun;
//                     ApakahLogin = false;
//                     UpdateAkun();

//                     return;
//                 }

//                 $("#status_login").removeClass("d-none");
//                 $("#status_login").text(hasil.status);
//             });
//         } catch (err) {
//             console.error(err);
//         }

//         ApakahLogin = false;
//         return false;
//     })

//     let ApakahRegister = false;
//     $("#submit_register").on("click", () => {
//         if(ApakahRegister) {
//             return;
//         }
//         ApakahRegister = true;

//         try {
//             Register($("#username_register").val(), $("#email_register").val(), $("#password_register").val(),  $("#confirm_password_register").val()).then(hasil => {
//                 if(hasil.status === "Success") {
//                     CariPage("/login");
//                     ApakahRegister = false;
//                     return;
//                 }

//                 $("#status_register").removeClass("d-none");
//                 $("#status_register").text(hasil.status);
//             });
//         } catch (err) {
//             console.error(err);
//         }

//         ApakahRegister = false;
//         return false;
//     });

//     $("#RangeBeli").on("input", () => {
//         $("#JumlahBeli").text(`Bitcoin: ${$("#RangeBeli").val()}`);
//     });

//     let HargaBitcoin = 0;
//     $("#RangeJual").on("input", () => {
//         $("#JumlahJual").text(`Money: ${formatter.format($("#RangeJual").val())}`);
//         $("#JumlahJualBitcoin").text(`Bitcoin: ${($("#RangeJual").val() / HargaBitcoin).toFixed(6)}`);
//     });

//     const ModalBeli = document.getElementById("beliModal");
//     ModalBeli.addEventListener('show.bs.modal', ev => {
//         $("#RangeBeli").val(0);
//         $("#JumlahBeli").text(`Bitcoin: 0`);
//         $("#StatusBeli").addClass("d-none");
//         $.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=CG-yYG9FmMVNXk1VuXf2FriEpyf", data => {
//             $("#RangeBeli").attr("max", Akun.uang / data[0].current_price);
//         });
//     });

//     const ModalJual = document.getElementById("jualModal");
//     ModalJual.addEventListener('show.bs.modal', ev => {
//         UpdatePortfolio();
//         $("#RangeJual").val(0);
//         $("#JumlahJual").text(`Money: $0`);
//         $("#JumlahJualBitcoin").text(`Bitcoin: 0`);
//         $("#StatusJual").addClass("d-none");
//         $("#RangeJual").attr("max", TotalPortfolio);
//         $.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=CG-yYG9FmMVNXk1VuXf2FriEpyf", data => {
//             HargaBitcoin = data[0].current_price;
//         });
//     });

//     $("#TombolBeli").on("click", () => {
//         try {
//             Beli("bitcoin", $("#RangeBeli").val()).then(hasil => {
//                 if(hasil.status === "Success") {
//                     $("#StatusBeli").removeClass("text-danger");
//                     $("#StatusBeli").addClass("text-success");
//                 } else {
//                     $("#StatusBeli").addClass("text-danger");
//                     $("#StatusBeli").removeClass("text-success");
//                 }

//                 $("#StatusBeli").text(hasil.status);
//                 $("#StatusBeli").removeClass("d-none");

//                 Akun = hasil.akun;
//                 UpdateAkun();
//             });
//         } catch {
//             console.error(err);
//         }
//     })

//     $("#TombolJual").on("click", () => {
//         try {
//             Jual("bitcoin", $("#RangeJual").val()).then(hasil => {
//                 if(hasil.status === "Success") {
//                     $("#StatusJual").removeClass("text-danger");
//                     $("#StatusJual").addClass("text-success");
//                 } else {
//                     $("#StatusJual").addClass("text-danger");
//                     $("#StatusJual").removeClass("text-success");
//                 }

//                 $("#StatusJual").text(hasil.status);
//                 $("#StatusJual").removeClass("d-none");

//                 Akun = hasil.akun;
//                 UpdateAkun();
//             });
//         } catch {
//             console.error(err);
//         }
//     })
// });

// setInterval(() => {
//     UpdatePortfolio();
// }, 10000)