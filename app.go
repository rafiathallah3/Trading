package main

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/carlmjohnson/requests"
	supa "github.com/nedpals/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

type Akun struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	PasswordHash string  `json:"password_hash"`
	FullName     string  `json:"full_name"`
	Uang         float64 `json:"uang"`
	CreatedAt    string  `json:"created_at"`
}

type Transaksi struct {
	ID        int     `json:"id"`
	AkunID    int     `json:"akun_id"`
	Jumlah    float64 `json:"jumlah"`
	MataUang  string  `json:"mata_uang"`
	CreatedAt string  `json:"created_at"`
}

type StatusAutentikasi struct {
	Status string `json:"status"`
	Akun   Akun   `json:"akun"`
}

type StatusTransksi struct {
	Status string `json:"status"`
	Akun   Akun   `json:"akun"`
}

type CryptoResponse struct {
	CurrentPrice float64 `json:"current_price"`
}

// App struct
type App struct {
	ctx      context.Context
	Supabase *supa.Client
}

// XQH026A37M3ODQZP
// ALPACA: Key: PKW8DH38SDM1EEL32EQ3 | Secret: Nk8eM22SIv1QrBBHzu2HtAermDY0yXDqknQkPGiq

var akun Akun = Akun{-1, "", "", "", "", 0, ""}
var ctx context.Context
var HargaSekarang CryptoResponse = CryptoResponse{CurrentPrice: 0}
var CooldownDapatinHarga = time.Now()

func DapatinHarga(uang string) CryptoResponse {
	if time.Now().Sub(CooldownDapatinHarga) < 60*time.Second {
		return HargaSekarang
	}

	var hasil []CryptoResponse
	err := requests.URL(fmt.Sprintf("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=%s&x_cg_demo_api_key=CG-RtuF9UDUxQez9q4TRGSpkkGH", uang)).ToJSON(&hasil).Fetch(ctx)
	fmt.Println(hasil)

	if err != nil {
		fmt.Println(err, "ERRORRR")
		return CryptoResponse{CurrentPrice: 0}
	}

	HargaSekarang = hasil[0]
	CooldownDapatinHarga = time.Now()
	fmt.Println("HARGA SEKARANG", HargaSekarang)
	return HargaSekarang
}

// NewApp creates a new App application struct
func NewApp() *App {
	ctx = context.Background()
	supabase := supa.CreateClient("https://nwkoxjhmguvexewqhspw.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a294amhtZ3V2ZXhld3Foc3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMzcxMjksImV4cCI6MjA1NTgxMzEyOX0.i_5z0v6s-u9Q_5vD8SDQJM9ESiDs0h7JQeMWdTe3qnU")

	return &App{Supabase: supabase}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) DapatinAkun() Akun {
	return akun
}

func (a *App) Register(username, email, password, confirmPassword string) StatusAutentikasi {
	if password != confirmPassword {
		return StatusAutentikasi{"Password is not match with confirm password!", Akun{}}
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)

	if err != nil {
		return StatusAutentikasi{err.Error(), Akun{}}
	}

	row := Akun{
		Username:     username,
		Email:        email,
		PasswordHash: string(bytes),
		FullName:     username,
		CreatedAt:    "", //time.Now().UTC()
	}

	var results []Akun
	err = a.Supabase.DB.From("akun").Insert(row).Execute(&results)

	if err != nil {
		return StatusAutentikasi{"Error while registering account!", Akun{}}
	}

	return StatusAutentikasi{"Success", results[0]}
}

func (a *App) Login(username, password string) StatusAutentikasi {
	var result []Akun
	err := a.Supabase.DB.From("akun").Select().Eq("username", username).Execute(&result)

	if err != nil || len(result) <= 0 {
		fmt.Println(err)
		return StatusAutentikasi{"Password or Username is Incorrect!", Akun{}}
	}

	akun = result[0]
	err = bcrypt.CompareHashAndPassword([]byte(akun.PasswordHash), []byte(password))
	if err != nil {
		fmt.Println(err)
		return StatusAutentikasi{"Password or Username is Incorrect!", Akun{}}
	}

	fmt.Println(akun)

	return StatusAutentikasi{"Success", akun}
}

func (a *App) Portfolio() []Transaksi {
	if akun.ID == -1 {
		return []Transaksi{}
	}

	var transaksi []Transaksi
	err := a.Supabase.DB.From("transaksi").Select().Eq("akun_id", strconv.Itoa(akun.ID)).Execute(&transaksi)
	if err != nil {
		fmt.Println("Error, please try again.")
		return []Transaksi{}
	}

	return transaksi
}

func (a *App) Beli(uang, jumlah_raw string) StatusTransksi {
	hasil := DapatinHarga(uang)
	fmt.Println(hasil.CurrentPrice, "HARGA BITCOIN!")

	if hasil.CurrentPrice == 0 {
		fmt.Println("TIDAK BISA")
		return StatusTransksi{"Error, please try again.", akun}
	}

	jumlah, err := strconv.ParseFloat(jumlah_raw, 64)
	if err != nil {
		fmt.Println(err)
		return StatusTransksi{"Error, please try again.", akun}
	}

	if jumlah > akun.Uang || jumlah <= 0 || jumlah*hasil.CurrentPrice > akun.Uang {
		return StatusTransksi{"Insufficient Balance", akun}
	}

	var transaksi []Transaksi
	err = a.Supabase.DB.From("transaksi").Select().Execute(&transaksi)
	if err != nil {
		fmt.Println(err)
		return StatusTransksi{"Error, please try again.", akun}
	}

	highestID := 0
	for _, t := range transaksi {
		if t.ID > highestID {
			highestID = t.ID
		}
	}

	row := Transaksi{
		ID:        len(transaksi) + 1 + highestID,
		AkunID:    akun.ID,
		Jumlah:    jumlah,
		MataUang:  uang,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	err = a.Supabase.DB.From("transaksi").Insert(row).Execute(nil)

	if err != nil {
		fmt.Println(err)
		return StatusTransksi{"Error, please try again.", akun}
	}

	akun.Uang -= jumlah * hasil.CurrentPrice
	a.Supabase.DB.From("akun").Update(akun).Eq("id", strconv.Itoa(akun.ID)).Execute(nil)
	return StatusTransksi{"Success", akun}
}

func (a *App) Jual(mata_uang, jumlah_raw string) StatusTransksi {
	hasil := DapatinHarga(mata_uang)

	if hasil.CurrentPrice == 0 {
		return StatusTransksi{"Error, please try again.", akun}
	}

	jumlah, err := strconv.ParseFloat(jumlah_raw, 64)
	if err != nil {
		fmt.Println(err)
		return StatusTransksi{"Error, please try again.", akun}
	}

	if jumlah <= 0 {
		return StatusTransksi{"Invalid Amount", akun}
	}

	var transaksi []Transaksi
	err = a.Supabase.DB.From("transaksi").Select().Eq("akun_id", strconv.Itoa(akun.ID)).Execute(&transaksi)
	if err != nil {
		fmt.Println(err)
		return StatusTransksi{"Error, please try again.", akun}
	}

	totalPortofolio := 0.0
	for _, t := range transaksi {
		totalPortofolio += t.Jumlah
	}
	totalPortofolio = totalPortofolio * hasil.CurrentPrice

	fmt.Println(jumlah, totalPortofolio)
	if jumlah > totalPortofolio {
		return StatusTransksi{"Insufficient Balance", akun}
	}

	jumlah /= hasil.CurrentPrice
	akun.Uang += jumlah * hasil.CurrentPrice
	for _, t := range transaksi {
		if jumlah <= 0 {
			break
		}

		if t.Jumlah <= jumlah {
			a.Supabase.DB.From("transaksi").Delete().Eq("id", strconv.Itoa(t.ID)).Execute(nil)
			jumlah -= t.Jumlah
		} else {
			t.Jumlah -= jumlah
			a.Supabase.DB.From("transaksi").Update(t).Eq("id", strconv.Itoa(t.ID)).Execute(nil)
		}
	}

	a.Supabase.DB.From("akun").Update(akun).Eq("id", strconv.Itoa(akun.ID)).Execute(nil)
	return StatusTransksi{"Success", akun}
}
