package main

import (
	"context"
	"fmt"
	"main/models"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/carlmjohnson/requests"
	supa "github.com/nedpals/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

// App struct
type App struct {
	ctx      context.Context
	Supabase *supa.Client
}

func insertionSort(kripto []models.Kripto, urutan string) {
	for i := 1; i < len(kripto); i++ {
		temp := kripto[i]
		j := i - 1

		urut := false
		if urutan == "asc" {
			urut = temp.MarketCap < kripto[j].MarketCap
		} else if urutan == "desc" {
			urut = temp.MarketCap > kripto[j].MarketCap
		}

		for j >= 0 && urut {
			kripto[j+1] = kripto[j]
			j--
		}

		kripto[j+1] = temp
	}
}

func selectionSort(kripto []models.Kripto, urutan string) {
	for i := 0; i < len(kripto)-1; i++ {
		idx_kecilbesar := i

		for j := i + 1; j < len(kripto); j++ {
			urut := false

			if urutan == "asc" {
				urut = kripto[j].Harga < kripto[idx_kecilbesar].Harga
			} else if urutan == "desc" {
				urut = kripto[j].Harga > kripto[idx_kecilbesar].Harga
			}

			if urut {
				idx_kecilbesar = j
			}
		}

		temp := kripto[i]
		kripto[i] = kripto[idx_kecilbesar]
		kripto[idx_kecilbesar] = temp
	}
}

func bubbleSort(kripto []models.Kripto, urutan string) {
	for i := 0; i < len(kripto)-1; i++ {
		for j := 0; j < len(kripto)-i-1; j++ {
			urut := false

			if urutan == "asc" {
				urut = kripto[j].Nama > kripto[j+1].Nama
			} else if urutan == "desc" {
				urut = kripto[j].Nama < kripto[j+1].Nama
			}

			if urut {
				temp := kripto[j+1]
				kripto[j+1] = kripto[j]
				kripto[j] = temp
			}
		}
	}
}

func sequentialSort(kripto []models.Kripto, yangDiCari string) int {
	ketemu := -1

	for i := 0; i < len(kripto) && ketemu == -1; i++ {
		fmt.Println("CARI DULUUU")
		if kripto[i].Nama == yangDiCari {
			ketemu = i
		}
	}

	return ketemu
}

func binarySearch(kripto []models.Kripto, yangDiCari string, urutan string) int {
	var kiri, kanan, tengah int
	ketemu := -1
	kiri = 0
	kanan = len(kripto) - 1

	for kiri <= kanan && ketemu == -1 {
		tengah = (kanan + kiri) / 2
		fmt.Println(tengah)

		if kripto[tengah].Nama == yangDiCari {
			ketemu = tengah
		}

		if urutan == "asc" {
			if kripto[tengah].Nama < yangDiCari {
				kiri = tengah + 1
			} else {
				kanan = tengah - 1
			}
		} else if urutan == "desc" {
			if kripto[tengah].Nama > yangDiCari {
				kiri = tengah + 1
			} else {
				kanan = tengah - 1
			}
		}
	}

	fmt.Println("KETEMU", kripto, ketemu, yangDiCari, urutan, kanan, kiri)
	return ketemu
}

var akun models.Akun = models.Akun{ID: -1, Username: "", Email: "", PasswordHash: "", FullName: "", Uang: 0, CreatedAt: ""}
var ctx context.Context
var HargaSekarang models.CryptoResponse = models.CryptoResponse{CurrentPrice: 0}
var CooldownDapatinHarga = time.Now()

func DapatinHarga(uang string) models.CryptoResponse {
	if time.Since(CooldownDapatinHarga) < 3*time.Second {
		fmt.Println("Cooldown dalam mendapatkan Hargaa")
		return HargaSekarang
	}

	var hasil []models.CryptoResponse
	err := requests.URL(fmt.Sprintf("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=%s&x_cg_demo_api_key=CG-RtuF9UDUxQez9q4TRGSpkkGH", uang)).ToJSON(&hasil).Fetch(ctx)

	if err != nil {
		fmt.Println(err, "ERRORRR")
		return models.CryptoResponse{CurrentPrice: 0}
	}

	HargaSekarang = hasil[0]
	CooldownDapatinHarga = time.Now()
	return HargaSekarang
}

// NewApp creates a new App application struct
func NewApp() *App {
	ctx = context.Background()
	supabase := supa.CreateClient(os.Getenv("SupaBaseURL"), os.Getenv("SupaBaseKey"))

	return &App{Supabase: supabase}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) DapatinAkun() models.Akun {
	return akun
}

func (a *App) Register(username, email, password, confirmPassword string) models.StatusAutentikasi {
	if password != confirmPassword {
		return models.StatusAutentikasi{Status: "Password is not match with confirm password!", Akun: models.Akun{}}
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)

	if err != nil {
		return models.StatusAutentikasi{Status: err.Error(), Akun: models.Akun{}}
	}

	row := models.Akun{
		Username:     username,
		Email:        email,
		PasswordHash: string(bytes),
		FullName:     username,
		CreatedAt:    time.Now().UTC().Format(time.RFC3339), //time.Now().UTC()
	}

	var results []models.Akun
	err = a.Supabase.DB.From("akun").Insert(row).Execute(&results)

	if err != nil {
		return models.StatusAutentikasi{Status: "Error while registering account!", Akun: models.Akun{}}
	}

	return models.StatusAutentikasi{Status: "Success", Akun: results[0]}
}

func (a *App) Login(username, password string) models.StatusAutentikasi {
	var result []models.Akun
	err := a.Supabase.DB.From("akun").Select().Eq("username", username).Execute(&result)

	if err != nil || len(result) <= 0 {
		fmt.Println(err)
		return models.StatusAutentikasi{Status: "Password or Username is Incorrect!", Akun: models.Akun{}}
	}

	akun = result[0]
	err = bcrypt.CompareHashAndPassword([]byte(akun.PasswordHash), []byte(password))
	if err != nil {
		fmt.Println(err)
		return models.StatusAutentikasi{Status: "Password or Username is Incorrect!", Akun: models.Akun{}}
	}

	fmt.Println(akun)

	return models.StatusAutentikasi{Status: "Success", Akun: akun}
}

func (a *App) Portfolio() []models.Portfolio {
	if akun.ID == -1 {
		return []models.Portfolio{}
	}

	var portfolio []models.Portfolio
	err := a.Supabase.DB.From("portfolio").Select().Eq("akun_id", strconv.Itoa(akun.ID)).Execute(&portfolio)
	if err != nil {
		fmt.Println("Error, please try again.")
		return []models.Portfolio{}
	}

	return portfolio
}

func (a *App) Transaksi() []models.Transaksi {
	if akun.ID == -1 {
		return []models.Transaksi{}
	}

	var transaksi []models.Transaksi
	err := a.Supabase.DB.From("transaksi").Select().Eq("akun_id", strconv.Itoa(akun.ID)).Execute(&transaksi)
	if err != nil {
		fmt.Println("Error, please try again.")
		return []models.Transaksi{}
	}

	return transaksi
}

func (a *App) Kripto(sort, cari string) []models.Kripto {
	var kripto []models.Kripto

	err := a.Supabase.DB.From("kripto").Select().Execute(&kripto)
	if err != nil {
		fmt.Println("Error, please try again.")
		return []models.Kripto{}
	}

	if sort == "marketCap-asc" {
		insertionSort(kripto, "asc")
	}

	if sort == "marketCap-desc" {
		insertionSort(kripto, "desc")
	}

	if sort == "price-asc" {
		selectionSort(kripto, "asc")
	}

	if sort == "price-desc" {
		selectionSort(kripto, "desc")
	}

	urutan := ""
	if sort == "name-asc" {
		bubbleSort(kripto, "asc")
		urutan = "asc"
	}

	if sort == "name-desc" {
		bubbleSort(kripto, "desc")
		urutan = "desc"
	}

	if cari != "" {
		posisi := -1

		if sort == "name-asc" || sort == "name-desc" {
			posisi = binarySearch(kripto, cari, urutan)
		} else {
			posisi = sequentialSort(kripto, cari)
		}

		var duplikatKripto = []models.Kripto{}
		if posisi != -1 {
			duplikatKripto = append(duplikatKripto, kripto[posisi])
		}

		kripto = duplikatKripto
	}

	return kripto
}

func (a *App) BuatKripto(kriptoClient models.Kripto) string {
	kriptoAsli := DapatinHarga(kriptoClient.KuriptoID)
	apakahAsli := kriptoAsli.CurrentPrice != 0

	var kripto []models.Kripto
	err := a.Supabase.DB.From("kripto").Select().Execute(&kripto)
	if err != nil {
		fmt.Println(err)
		return "Gagal"
	}

	highestID := 0
	for _, t := range kripto {
		if t.ID > highestID {
			highestID = t.ID
		}
	}

	var newKripto models.Kripto
	if apakahAsli {
		newKripto = models.Kripto{
			ID:         1 + highestID,
			KuriptoID:  kriptoAsli.ID,
			Nama:       kriptoClient.Nama,
			Simbol:     strings.ToUpper(kriptoAsli.Simbol),
			Harga:      kriptoAsli.CurrentPrice,
			MarketCap:  kriptoAsli.MarketCap,
			Change24h:  kriptoAsli.Change24h,
			ApakahAsli: true,
			CreatedAt:  time.Now().UTC().Format(time.RFC3339),
		}
	} else {
		newKripto = models.Kripto{
			ID:         1 + highestID,
			KuriptoID:  kriptoClient.KuriptoID,
			Nama:       kriptoClient.Nama,
			Simbol:     strings.ToUpper(kriptoClient.Simbol),
			Harga:      kriptoClient.Harga,
			MarketCap:  kriptoClient.MarketCap,
			Change24h:  kriptoClient.Change24h,
			ApakahAsli: false,
			CreatedAt:  time.Now().UTC().Format(time.RFC3339),
		}
	}

	err = a.Supabase.DB.From("kripto").Insert(newKripto).Execute(nil)
	if err != nil {
		fmt.Println(err)
		return "Gagal"
	}

	return "Sukses"
}

func (a *App) EditKripto(kriptoClient models.Kripto) string {
	var kripto []models.Kripto

	fmt.Println(kriptoClient, "KLIENT")
	err := a.Supabase.DB.From("kripto").Select().Eq("kuripto_id", kriptoClient.KuriptoID).Execute(&kripto)
	if err != nil || len(kripto) <= 0 {
		return "Gk ketemu " + err.Error()
	}
	fmt.Println(kripto, "SEBELUM UPDATE")

	err = a.Supabase.DB.From("kripto").Update(models.Kripto{
		ID:         kripto[0].ID,
		KuriptoID:  kripto[0].KuriptoID,
		Nama:       kriptoClient.Nama,
		Simbol:     kriptoClient.Simbol,
		Harga:      kriptoClient.Harga,
		Change24h:  kriptoClient.Change24h,
		MarketCap:  kriptoClient.MarketCap,
		CreatedAt:  kripto[0].CreatedAt,
		ApakahAsli: kripto[0].ApakahAsli,
	}).Eq("kuripto_id", kriptoClient.KuriptoID).Execute(&kripto)
	if err != nil {
		return err.Error()
	}
	fmt.Println(kripto, "SETELAH UPDATE")

	return "Sukses"
}

func (a *App) HapusKripto(kuripto_id string) string {
	var kripto []models.Kripto

	err := a.Supabase.DB.From("kripto").Delete().Eq("kuripto_id", kuripto_id).Execute(&kripto)
	if err != nil {
		return err.Error()
	}

	err = a.Supabase.DB.From("portfolio").Delete().Eq("mata_uang", kuripto_id).Execute(&kripto)
	if err != nil {
		return err.Error()
	}

	return "Sukses"
}

func (a *App) Beli(uang, jumlah_raw string) models.StatusTransaksi {
	hasil := DapatinHarga(uang)

	if hasil.CurrentPrice == 0 {
		fmt.Println("TIDAK BISA")
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	jumlah, err := strconv.ParseFloat(jumlah_raw, 64)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	if jumlah > akun.Uang || jumlah <= 0 || jumlah*hasil.CurrentPrice > akun.Uang {
		return models.StatusTransaksi{Status: "Insufficient Balance", Akun: akun}
	}

	var portfolio []models.Portfolio
	err = a.Supabase.DB.From("portfolio").Select().Execute(&portfolio)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	highestID := 0
	var apakahAdaPortfolio models.Portfolio
	for _, t := range portfolio {
		if t.ID > highestID {
			highestID = t.ID
		}

		if apakahAdaPortfolio.MataUang == "" && t.MataUang == uang {
			apakahAdaPortfolio = t
		}
	}

	if apakahAdaPortfolio.MataUang == "" {
		row := models.Portfolio{
			ID:        1 + highestID,
			AkunID:    akun.ID,
			Jumlah:    jumlah,
			MataUang:  uang,
			CreatedAt: time.Now().UTC().Format(time.RFC3339),
		}
		err = a.Supabase.DB.From("portfolio").Insert(row).Execute(nil)

		if err != nil {
			fmt.Println(err)
			return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
		}
	} else {
		apakahAdaPortfolio.Jumlah += jumlah
		err = a.Supabase.DB.From("portfolio").Update(apakahAdaPortfolio).Eq("mata_uang", uang).Execute(nil)
		if err != nil {
			fmt.Println(err)
			return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
		}
	}

	akun.Uang -= jumlah * hasil.CurrentPrice
	a.Supabase.DB.From("akun").Update(akun).Eq("id", strconv.Itoa(akun.ID)).Execute(nil)

	var transaksi []models.Transaksi
	err = a.Supabase.DB.From("transaksi").Select().Execute(&transaksi)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	highestID = 0
	for _, t := range transaksi {
		if t.ID > highestID {
			highestID = t.ID
		}
	}

	newTransaction := models.Transaksi{
		ID:        1 + highestID,
		AkunID:    akun.ID,
		Jumlah:    jumlah,
		MataUang:  uang,
		Tipe:      "BUY",
		Harga:     hasil.CurrentPrice,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	err = a.Supabase.DB.From("transaksi").Insert(newTransaction).Execute(nil)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	return models.StatusTransaksi{Status: "Success", Akun: akun}
}

func (a *App) Jual(mata_uang, jumlah_raw string) models.StatusTransaksi {
	hasil := DapatinHarga(mata_uang)

	if hasil.CurrentPrice == 0 {
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	jumlah, err := strconv.ParseFloat(jumlah_raw, 64)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	if jumlah <= 0 {
		return models.StatusTransaksi{Status: "Invalid Amount", Akun: akun}
	}

	var portfolio []models.Portfolio
	err = a.Supabase.DB.From("portfolio").Select().Eq("akun_id", strconv.Itoa(akun.ID)).Eq("mata_uang", mata_uang).Execute(&portfolio)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	if len(portfolio) <= 0 {
		return models.StatusTransaksi{Status: "You do not own this cryptocurrency.", Akun: akun}
	}

	fmt.Println(jumlah, portfolio[0].Jumlah)
	if jumlah > portfolio[0].Jumlah {
		return models.StatusTransaksi{Status: "Insufficient Balance", Akun: akun}
	}

	portfolio[0].Jumlah -= jumlah

	if portfolio[0].Jumlah < 0.00001 {
		a.Supabase.DB.From("portfolio").Delete().Eq("id", strconv.Itoa(portfolio[0].ID)).Execute(nil)
	} else {
		a.Supabase.DB.From("portfolio").Update(portfolio[0]).Eq("id", strconv.Itoa(portfolio[0].ID)).Execute(nil)
	}

	totalPortofolio := jumlah * hasil.CurrentPrice
	akun.Uang += totalPortofolio

	a.Supabase.DB.From("akun").Update(akun).Eq("id", strconv.Itoa(akun.ID)).Execute(nil)

	var transaksi []models.Transaksi
	err = a.Supabase.DB.From("transaksi").Select().Execute(&transaksi)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	highestID := 0
	for _, t := range transaksi {
		if t.ID > highestID {
			highestID = t.ID
		}
	}

	newTransaction := models.Transaksi{
		ID:        1 + highestID,
		AkunID:    akun.ID,
		Jumlah:    jumlah,
		MataUang:  mata_uang,
		Tipe:      "SELL",
		Harga:     hasil.CurrentPrice,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	err = a.Supabase.DB.From("transaksi").Insert(newTransaction).Execute(nil)
	if err != nil {
		fmt.Println(err)
		return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	}

	// var portfolio []models.Portfolio
	// err = a.Supabase.DB.From("portfolio").Select().Eq("akun_id", strconv.Itoa(akun.ID)).Execute(&portfolio)
	// if err != nil {
	// 	fmt.Println(err)
	// 	return models.StatusTransaksi{Status: "Error, please try again.", Akun: akun}
	// }

	// totalPortofolio := 0.0
	// for _, t := range portfolio {
	// 	totalPortofolio += t.Jumlah
	// }
	// totalPortofolio = totalPortofolio * hasil.CurrentPrice

	// if jumlah > totalPortofolio {
	// 	return models.StatusTransaksi{Status: "Insufficient Balance", Akun: akun}
	// }

	// jumlah /= hasil.CurrentPrice
	// akun.Uang += jumlah * hasil.CurrentPrice
	// for _, t := range portfolio {
	// 	if jumlah <= 0 {
	// 		break
	// 	}

	// 	if t.Jumlah <= jumlah {
	// 		a.Supabase.DB.From("portfolio").Delete().Eq("id", strconv.Itoa(t.ID)).Execute(nil)
	// 		jumlah -= t.Jumlah
	// 	} else {
	// 		t.Jumlah -= jumlah
	// 		a.Supabase.DB.From("portfolio").Update(t).Eq("id", strconv.Itoa(t.ID)).Execute(nil)
	// 	}
	// }

	// a.Supabase.DB.From("akun").Update(akun).Eq("id", strconv.Itoa(akun.ID)).Execute(nil)
	return models.StatusTransaksi{Status: "Sukses", Akun: akun}
}
