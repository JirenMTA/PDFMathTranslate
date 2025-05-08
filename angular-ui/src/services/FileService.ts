import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FileService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    postFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post(
            `${this.apiUrl}/upload`,
            formData
        ).pipe(
            catchError(err => { console.error(err); throw err; })
        );
    }

    doTranslate(fileId: string): Observable<any> {
        const params = new HttpParams()
            .set('filename', fileId)
            .set('target_lang', 'vi');

        return this.http.get(`${this.apiUrl}/translate`, {
            params
        });
    }
}
