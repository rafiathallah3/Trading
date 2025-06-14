// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {models} from '../models';

export function Beli(arg1:string,arg2:string):Promise<models.StatusTransaksi>;

export function BuatKripto(arg1:models.Kripto):Promise<string>;

export function DapatinAkun():Promise<models.Akun>;

export function EditKripto(arg1:models.Kripto):Promise<string>;

export function HapusKripto(arg1:string):Promise<string>;

export function Jual(arg1:string,arg2:string):Promise<models.StatusTransaksi>;

export function Kripto(arg1:string,arg2:string):Promise<Array<models.Kripto>>;

export function Login(arg1:string,arg2:string):Promise<models.StatusAutentikasi>;

export function Portfolio():Promise<Array<models.Portfolio>>;

export function Register(arg1:string,arg2:string,arg3:string,arg4:string):Promise<models.StatusAutentikasi>;

export function Transaksi():Promise<Array<models.Transaksi>>;
