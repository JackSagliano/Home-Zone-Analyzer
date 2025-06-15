import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  

  constructor(private http: HttpClient) {}

  
  aggiungiImmobileDB(geom: any, username: string, raggio_vicinato: number, questionarioData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>('http://localhost:3000/api/aggiungiImmobileDB', { geom, username, raggio_vicinato, questionarioData }, { headers });
  }

  modificaRaggioImmobile(geom: any, username: string, nuovo_raggio_vicinato: number, questionarioData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>('http://localhost:3000/api/modificaRaggioImmobile', { geom,username, nuovo_raggio_vicinato, questionarioData }, { headers });
  }

  loadMarkers(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get('http://localhost:3000/api/loadMarkers', { headers });
  }
  
  getPoisInImmobile(longitude: number, latitude: number, raggio:number): Observable<any>{
    let params = new HttpParams().set('lon', longitude.toString()).set('lat', latitude.toString()).set('raggio', raggio);

    return this.http.get('http://localhost:3000/api/getPoisInImmobile', {params});
  }
  



    aggiungiAreaDB(polygonGeoJSON: any, username: string, raggio_vicinato: number, questionarioData: any): Observable<any> {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      return this.http.post<any>('http://localhost:3000/api/aggiungiArea', { geom: polygonGeoJSON, username, raggio_vicinato, questionarioData }, { headers });
    }
 
  getPoisInArea(polygonCoordinates: any): Observable<any> {
    return this.http.post<any>('/api/getPoisInArea', { coordinates: polygonCoordinates });
  }
  rimuoviAreeDB(username: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`http://localhost:3000/api/rimuoviAreeCandidate?username=${username}`, {headers});
  }
  modificaRaggioArea(geom: any, nuovo_raggio_vicinato: number, questionarioData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`http://localhost:3000/api/modificaRaggioArea`, { geom, nuovo_raggio_vicinato, questionarioData }, { headers });
  }
  

getQuartiere(coordinates: [number, number]){
 
  let params = new HttpParams().set('lon', coordinates[0].toString()).set('lat', coordinates[1].toString());

    return this.http.get('http://localhost:3000/api/getQuartiere', {params});
}


suggerisciPosizioni(questionarioData: any, raggio_vicinato: number) {
  return this.http.post<any>(`http://localhost:3000/api/suggerisciPosizioni`, { questionarioData, raggio_vicinato});
}



}
