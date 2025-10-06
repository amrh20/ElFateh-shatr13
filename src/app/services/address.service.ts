import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Address {
  _id?: string;
  phone: string;
  address: {
    street: string;
    city: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Get all addresses for current user
  getUserAddresses(): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ success: false, error: 'Not authenticated' });
    }

    return this.http.get<any>(`${this.apiUrl}/users/me/addresses`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(res => res),
      catchError(error => {
        console.error('Error fetching addresses:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  // Create new address
  createAddress(addressData: Address): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ success: false, error: 'Not authenticated' });
    }

    return this.http.post<any>(`${this.apiUrl}/users/me/addresses`, addressData, {
      headers: this.getHeaders()
    }).pipe(
      map(res => res),
      catchError(error => {
        console.error('Error creating address:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  // Update address
  updateAddress(addressId: string, addressData: Address): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ success: false, error: 'Not authenticated' });
    }

    return this.http.put<any>(`${this.apiUrl}/users/me/addresses/${addressId}`, addressData, {
      headers: this.getHeaders()
    }).pipe(
      map(res => res),
      catchError(error => {
        console.error('Error updating address:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  // Delete address
  deleteAddress(addressId: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ success: false, error: 'Not authenticated' });
    }

    return this.http.delete<any>(`${this.apiUrl}/users/me/addresses/${addressId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => res),
      catchError(error => {
        console.error('Error deleting address:', error);
        return of({ success: false, error: error.message });
      })
    );
  }
}

