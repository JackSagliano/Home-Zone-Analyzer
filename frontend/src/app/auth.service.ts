import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import jwt_decode from 'jwt-decode';
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  
  

  constructor(private http: HttpClient) {}



 


  register(username: string, password: string): Observable<any> {
    return this.http.post('http://localhost:3000/api/registrati', { username, password });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post('http://localhost:3000/api/accedi', { username, password });
  }
 
  isLoggedIn(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(false);
    }
    return this.http.get('http://localhost:3000/api/verifyToken', {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => true),
      catchError(error => of(false))
    );
  }

}



