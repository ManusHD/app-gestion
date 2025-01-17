import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { dcs } from '../models/dcs.model';

@Injectable()
export class DCSService {
    private apiUrl = 'http://localhost:8094/dcs';

    constructor(private http: HttpClient) {}

    getDCSs(): Observable<dcs[]> {
        return this.http.get<dcs[]>(`${this.apiUrl}`);
    }
    

}