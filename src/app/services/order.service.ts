import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Order } from '../models/product.model';
import { AuthService } from './auth.service';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private auth: AuthService) {}

  getUserOrders(): Observable<any> {
    const token = this.auth.getToken();
    if (!token) { return of(null); }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    return this.http.get<any>(`${this.apiUrl}/orders/user`, { headers }).pipe(
      map(res => res),
      catchError(() => of(null))
    );
  }

  getCurrentOrder(): Observable<Order | null> {
    // This method is replaced by getUserOrders() which calls the real API
    return of(null);
  }

  hasActiveOrder(): Observable<boolean> {
    return new Observable(observer => {
      this.getCurrentOrder().subscribe(order => {
        if (order && ['pending', 'confirmed', 'shipped'].includes(order.status)) {
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      });
    });
  }

  getOrderStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'تم استلام الطلب',
      'confirmed': 'مؤكد',
      'processing': 'قيد المعالجة',
      'shipped': 'تم الشحن',
      'delivered': 'تم التوصيل',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }

  getOrderStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-gray-100 text-gray-800',
      'confirmed': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-orange-100 text-orange-800',
      'shipped': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  checkDiscount(discountCode: string, totalAmount: number): Observable<any> {
    const token = this.auth.getToken();
    if (!token) { 
      return of({ error: 'Authentication required' }); 
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const payload = {
      discountCode: discountCode,
      totalAmount: totalAmount
    };

    return this.http.post<any>(`${this.apiUrl}/orders/check-discount`, payload, { headers }).pipe(
      map(res => res),
      catchError(error => {
        console.error('Discount check error:', error);
        return of({ error: 'Invalid discount code' });
      })
    );
  }

  createOrder(orderData: any): Observable<any> {
    const token = this.auth.getToken();
    if (!token) { 
      return of({ error: 'Authentication required' }); 
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<any>(`${this.apiUrl}/orders`, orderData, { headers }).pipe(
      map(res => res),
      catchError(error => {
        console.error('Order creation error:', error);
        return of({ error: 'Failed to create order', details: error });
      })
    );
  }
} 