import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Product, Category, SubCategory } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  getProductById(id: string | number): Observable<Product | undefined> {
    return this.http.get<any>(`${environment.apiUrl}/products/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return undefined;
      }),
      catchError(() => {
        return of(undefined);
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products/category/${category}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  getProductsBySubcategory(subcategoryId: string): Observable<Product[]> {
    // Call the subcategory products API endpoint
    return this.http.get<any>(`${environment.apiUrl}/products/subcategory/${subcategoryId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError((err) => {
        return of([]);
      })
    );
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products/featured`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  getBestSellers(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products/bestsellers`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  getOnSaleProducts(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products/onsale`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<any>(`${environment.apiUrl}/categories`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products/search?q=${encodeURIComponent(query)}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  // Get products with filters and pagination
  getProductsWithFilters(queryString: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/products?${queryString}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response;
        }
        return {
          success: false,
          data: {
            products: [],
            total: 0,
            page: 1,
            limit: 12
          }
        };
      }),
      catchError((err) => {
        return of({
          success: false,
          data: {
            products: [],
            total: 0,
            page: 1,
            limit: 12
          }
        });
      })
    );
  }

  // Get featured products from main products API
  getFeaturedProductsFromAPI(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products`).pipe(
      map(response => {
        // Handle direct array response
        let products: Product[] = [];
        if (Array.isArray(response)) {
          products = response;
        } else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.products) {
            products = response.data.products;
          }
        }
        
        if (products.length > 0) {
          // Filter products where featured: true OR productType: "featured"
          const featuredProducts = products.filter((p: Product) => 
            p.featured === true || p.productType === 'featured'
          );
          
          // If no featured products found, use first few products as featured
          if (featuredProducts.length === 0) {
            return products.slice(0, 4);
          }
          
          return featuredProducts.slice(0, 4);
        }
        // Return empty array if no products from API
        return [];
      }),
      catchError((error) => {
        return of([]);
      })
    );
  }

  // Get best sellers from main products API
  getBestSellersFromAPI(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products`).pipe(
      map(response => {
        
        // Handle direct array response
        let products: Product[] = [];
        if (Array.isArray(response)) {
          products = response;
        } else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.products) {
            products = response.data.products;
          }
        }
        
        
        if (products.length > 0) {
          // Filter products where bestSeller: true OR productType: "bestSeller"
          const bestSellerProducts = products.filter((p: Product) => 
            p.bestSeller === true || p.productType === 'bestSeller'
          );
          return bestSellerProducts.slice(0, 4);
        }
        
        // Return empty array if no products from API
        return [];
      }),
      catchError((error) => {
        return of([]);
      })
    );
  }

  // Get special offer products from main products API
  getSpecialOfferProductsFromAPI(): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/products`).pipe(
      map(response => {
        
        // Handle direct array response
        let products: Product[] = [];
        if (Array.isArray(response)) {
          products = response;
        } else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.products) {
            products = response.data.products;
          }
        }
        
        
        if (products.length > 0) {
          // Filter products where specialOffer: true OR productType: "specialOffer"
          const specialOfferProducts = products.filter((p: Product) => 
            p.specialOffer === true || p.productType === 'specialOffer'
          );
          return specialOfferProducts.slice(0, 4);
        }
        
        // Return empty array if no products from API
        return [];
      }),
      catchError((error) => {
        return of([]);
      })
    );
  }

  // Test method to check API response structure
  testAPIResponse(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/products`).pipe(
      map(response => {
        
        // Handle different response structures
        let products: Product[] = [];
        if (Array.isArray(response)) {
          products = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.products) {
            products = response.data.products;
          }
        }
        
        if (products.length > 0) {
          // Check productType values
          const productTypes = products.map(p => p.productType).filter(Boolean);
          
          // Filter by productType
          products.filter((p: Product) => p.productType === 'featured');
          products.filter((p: Product) => p.productType === 'bestSeller');
          products.filter((p: Product) => p.productType === 'specialOffer');
          
          // Filter by boolean flags
          products.filter((p: Product) => p.featured === true);
          products.filter((p: Product) => p.bestSeller === true);
          products.filter((p: Product) => p.specialOffer === true);
        }
        
        return response;
      }),
      catchError((error) => {
        return of(null);
      })
    );
  }

  // Helper method to clean image URLs from API response
  getCleanImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // Remove data-src wrapper if exists
    if (imageUrl.includes('data-src=')) {
      const match = imageUrl.match(/data-src="([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Remove extra quotes if exists
    if (imageUrl.startsWith('"') && imageUrl.endsWith('"')) {
      return imageUrl.slice(1, -1);
    }
    
    // Remove escaped quotes if exists
    if (imageUrl.includes('\\"')) {
      return imageUrl.replace(/\\"/g, '');
    }
    
    return imageUrl;
  }
} 