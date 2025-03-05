export namespace main {
	
	export class Akun {
	    id: number;
	    username: string;
	    email: string;
	    password_hash: string;
	    full_name: string;
	    uang: number;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Akun(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.email = source["email"];
	        this.password_hash = source["password_hash"];
	        this.full_name = source["full_name"];
	        this.uang = source["uang"];
	        this.created_at = source["created_at"];
	    }
	}
	export class StatusAutentikasi {
	    status: string;
	    akun: Akun;
	
	    static createFrom(source: any = {}) {
	        return new StatusAutentikasi(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.akun = this.convertValues(source["akun"], Akun);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StatusTransksi {
	    status: string;
	    akun: Akun;
	
	    static createFrom(source: any = {}) {
	        return new StatusTransksi(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.akun = this.convertValues(source["akun"], Akun);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Transaksi {
	    id: number;
	    akun_id: number;
	    jumlah: number;
	    mata_uang: string;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Transaksi(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.akun_id = source["akun_id"];
	        this.jumlah = source["jumlah"];
	        this.mata_uang = source["mata_uang"];
	        this.created_at = source["created_at"];
	    }
	}

}

