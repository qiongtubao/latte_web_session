export interface Store {
    get(key:string, callback);
    set(key:string,value:any, callback);
}


