import './style.css';
import './app.css';

import {Greet, Login, Register, DapatinAkun, Portfolio, Beli, Jual} from '../wailsjs/go/main/App';

new TradingView.widget(
    {
        "autosize": true,
        "symbol": "BINANCE:BTCUSDT",
        "interval": "240",
        "timezzone": "Etc/Utc",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": true,
        "withdateranges": false,
        "hide_side_toolbar": true,
        "allow_symbol_change": true,
        "watchlist": [
            "BINANCE:BTCUSDT",
            "BINANCE:ETHUSDT"
        ],
        "details": true,
        "hotlist": true,
        "calendar": true,
        "studies": [
            "STD;SMA"
        ],
        "container_id": "chart",
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "4000"
    }
);

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  
    // These options can be used to round to whole numbers.
    trailingZeroDisplay: 'stripIfInteger'   // This is probably what most people
                                            // want. It will only stop printing
                                            // the fraction when the input
                                            // amount is a round number (int)
                                            // already. If that's not what you
                                            // need, have a look at the options
                                            // below.
    //minimumFractionDigits: 0, // This suffices for whole numbers, but will
                                // print 2500.10 as $2,500.1
    //maximumFractionDigits: 0, // Causes 2500.99 to be printed as $2,501
});

let Akun = undefined;

function TunjuinPage(page, status) {
    if(status) {
        $(`#${page}`).removeClass("d-none");
        return;
    }

    $(`#${page}`).addClass("d-none");
}

function CariPage(page) {
    switch (page) {
    case "/login":
        TunjuinPage("LoginPage", true);
        TunjuinPage("RegisterPage", false);
        TunjuinPage("HomePage", false);
        break
    case "/register":
        TunjuinPage("LoginPage", false);
        TunjuinPage("RegisterPage", true);
        TunjuinPage("HomePage", false);
        break
    case "/":
        TunjuinPage("LoginPage", false);
        TunjuinPage("RegisterPage", false);
        TunjuinPage("HomePage", true);
        break;
    }
}

function UpdateAkun() {
    if(Akun === undefined || Akun.id === -1) {
        return;
    }
    
    CariPage("/");
    TunjuinPage("SudahLoginNavbar", true);
    TunjuinPage("BelumLoginNavbar", false);
    $("#username_navbar").text(Akun.username);
    $("#Uang").text(`${formatter.format(Akun.uang)}`);
    UpdatePortfolio();
}

let TotalBitcoin = 0;
let TotalPortfolio = 0;
function UpdatePortfolio() {
    if (Akun === undefined) {
        return;
    }

    try {
        Portfolio().then(hasil => {
            $.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=CG-RtuF9UDUxQez9q4TRGSpkkGH", data => {
                const HargaBitcoin = data[0].current_price;
                
                TotalPortfolio = 0;
                TotalBitcoin = 0;
                $("#Portfolio").empty();
                hasil.forEach(v => {
                    $("#Portfolio").append(`
                    <tr>
                        <td>Bitcoin</td>
                        <td>${v.jumlah}</td>
                        <td>${formatter.format(v.jumlah * HargaBitcoin)}</td>
                        <td>${v.created_at}</td>
                    </tr>
                    `);
                    
                    TotalBitcoin += v.jumlah;
                    TotalPortfolio += v.jumlah * HargaBitcoin;
                });

                $("#UangPortfolio").text(`${formatter.format(TotalPortfolio)}`);
            });
        });
    } catch {
        console.error(err);
    }
}

$(document).ready(() => {
    console.log("READY!!")
    $("a").each((_, v) => {
        v.addEventListener("click", e => {
            e.preventDefault();
            
            CariPage(v.getAttribute("href"))
        });
    });

    DapatinAkun().then(hasil => {
        Akun = hasil;
        UpdateAkun();
    });

    let ApakahLogin = false;
    $("#submit_login").on("click", () => {
        if(ApakahLogin) {
            return;
        }
        ApakahLogin = true;

        try {
            Login($("#username_login").val(), $("#password_login").val()).then(hasil => {
                if(hasil.status === "Success" && hasil.akun !== -1) {
                    Akun = hasil.akun;
                    ApakahLogin = false;
                    UpdateAkun();

                    return;
                }

                $("#status_login").removeClass("d-none");
                $("#status_login").text(hasil.status);
            });
        } catch (err) {
            console.error(err);
        }

        ApakahLogin = false;
        return false;
    })

    let ApakahRegister = false;
    $("#submit_register").on("click", () => {
        if(ApakahRegister) {
            return;
        }
        ApakahRegister = true;

        try {
            Register($("#username_register").val(), $("#email_register").val(), $("#password_register").val(),  $("#confirm_password_register").val()).then(hasil => {
                if(hasil.status === "Success") {
                    CariPage("/login");
                    ApakahRegister = false;
                    return;
                }

                $("#status_register").removeClass("d-none");
                $("#status_register").text(hasil.status);
            });
        } catch (err) {
            console.error(err);
        }

        ApakahRegister = false;
        return false;
    });

    $("#RangeBeli").on("input", () => {
        $("#JumlahBeli").text(`Bitcoin: ${$("#RangeBeli").val()}`);
    });

    let HargaBitcoin = 0;
    $("#RangeJual").on("input", () => {
        $("#JumlahJual").text(`Money: ${formatter.format($("#RangeJual").val())}`);
        $("#JumlahJualBitcoin").text(`Bitcoin: ${($("#RangeJual").val() / HargaBitcoin).toFixed(6)}`);
    });

    const ModalBeli = document.getElementById("beliModal");
    ModalBeli.addEventListener('show.bs.modal', ev => {
        $("#RangeBeli").val(0);
        $("#JumlahBeli").text(`Bitcoin: 0`);
        $("#StatusBeli").addClass("d-none");
        $.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=CG-RtuF9UDUxQez9q4TRGSpkkGH", data => {
            $("#RangeBeli").attr("max", Akun.uang / data[0].current_price);
        });
    });

    const ModalJual = document.getElementById("jualModal");
    ModalJual.addEventListener('show.bs.modal', ev => {
        UpdatePortfolio();
        $("#RangeJual").val(0);
        $("#JumlahJual").text(`Money: $0`);
        $("#JumlahJualBitcoin").text(`Bitcoin: 0`);
        $("#StatusJual").addClass("d-none");
        $("#RangeJual").attr("max", TotalPortfolio);
        $.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&x_cg_demo_api_key=CG-RtuF9UDUxQez9q4TRGSpkkGH", data => {
            HargaBitcoin = data[0].current_price;
        });
    });

    $("#TombolBeli").on("click", () => {
        try {
            Beli("bitcoin", $("#RangeBeli").val()).then(hasil => {
                if(hasil.status === "Success") {
                    $("#StatusBeli").removeClass("text-danger");
                    $("#StatusBeli").addClass("text-success");
                } else {
                    $("#StatusBeli").addClass("text-danger");
                    $("#StatusBeli").removeClass("text-success");
                }

                $("#StatusBeli").text(hasil.status);
                $("#StatusBeli").removeClass("d-none");

                Akun = hasil.akun;
                UpdateAkun();
            });
        } catch {
            console.error(err);
        }
    })

    $("#TombolJual").on("click", () => {
        try {
            Jual("bitcoin", $("#RangeJual").val()).then(hasil => {
                if(hasil.status === "Success") {
                    $("#StatusJual").removeClass("text-danger");
                    $("#StatusJual").addClass("text-success");
                } else {
                    $("#StatusJual").addClass("text-danger");
                    $("#StatusJual").removeClass("text-success");
                }

                $("#StatusJual").text(hasil.status);
                $("#StatusJual").removeClass("d-none");

                Akun = hasil.akun;
                UpdateAkun();
            });
        } catch {
            console.error(err);
        }
    })
});

setInterval(() => {
    UpdatePortfolio();
}, 10000)

// Setup the greet function
window.greet = function () {
    // // Get name
    // let name = nameElement.value;

    // // Check if the input is empty
    // if (name === "") return;

    // // Call App.Greet(name)
    // try {
    //     Greet(name)
    //         .then((result) => {
    //             // Update result with data back from App.Greet()
    //             resultElement.innerText = result;
    //         })
    //         .catch((err) => {
    //             console.error(err);
    //         });
    // } catch (err) {
    //     console.error(err);
    // }
};
