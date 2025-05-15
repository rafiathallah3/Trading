package models

type Akun struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	PasswordHash string  `json:"password_hash"`
	FullName     string  `json:"full_name"`
	Uang         float64 `json:"uang"`
	CreatedAt    string  `json:"created_at"`
}

type Portfolio struct {
	ID        int     `json:"id"`
	AkunID    int     `json:"akun_id"`
	Jumlah    float64 `json:"jumlah"`
	MataUang  string  `json:"mata_uang"`
	CreatedAt string  `json:"created_at"`
}

type Transaksi struct {
	ID        int     `json:"id"`
	AkunID    int     `json:"akun_id"`
	Tipe      string  `json:"tipe"`
	Jumlah    float64 `json:"jumlah"`
	Harga     float64 `json:"harga"`
	MataUang  string  `json:"mata_uang"`
	CreatedAt string  `json:"created_at"`
}

type Kripto struct {
	ID         int     `json:"id"`
	KuriptoID  string  `json:"kuripto_id"`
	Nama       string  `json:"nama"`
	Simbol     string  `json:"simbol"`
	Harga      float64 `json:"harga"`
	MarketCap  float64 `json:"market_cap"`
	Change24h  float64 `json:"change_24h"`
	ApakahAsli bool    `json:"apakah_asli"`
	CreatedAt  string  `json:"created_at"`
}

type StatusAutentikasi struct {
	Status string `json:"status"`
	Akun   Akun   `json:"akun"`
}

type StatusTransaksi struct {
	Status string `json:"status"`
	Akun   Akun   `json:"akun"`
}

type CryptoResponse struct {
	CurrentPrice float64 `json:"current_price"`
	ID           string  `json:"id"`
	Nama         string  `json:"name"`
	Simbol       string  `json:"symbol"`
	MarketCap    float64 `json:"market_cap"`
	Change24h    float64 `json:"market_cap_change_percentage_24h"`
}
