import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ProductCardComponent
  ],
  templateUrl: './all-products.component.html',
  styleUrls: ['./all-products.component.scss']
})
export class AllProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  error = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  filterForm: FormGroup;
  
  // Search
  searchQuery = '';
  
  // Sorting
  sortOptions = [
    { value: 'name_asc', label: 'الاسم (أ-ي)' },
    { value: 'name_desc', label: 'الاسم (ي-أ)' },
    { value: 'price_asc', label: 'السعر (من الأقل)' },
    { value: 'price_desc', label: 'السعر (من الأعلى)' },
    { value: 'rating_desc', label: 'التقييم (الأعلى)' },
    { value: 'reviews_desc', label: 'عدد المراجعات' }
  ];
  
  // Product types for filtering
  productTypes = [
    { value: 'normal', label: 'عادي' },
    { value: 'featured', label: 'مميز' },
    { value: 'bestSeller', label: 'الأكثر مبيعاً' },
    { value: 'specialOffer', label: 'عرض خاص' }
  ];

  // Categories and subcategories
  categories: any[] = [];
  subCategories: any[] = [];
  
  // Mobile side navigation
  isSideNavOpen = false;
  
  private destroy$ = new Subject<void>();
  private readonly fallbackProductsData: Product[] = [
    {
      _id: 'dummy-1',
      name: 'منظف متعدد الاستخدام',
      description: 'منظف مركز آمن على جميع الأسطح، يزيل أصعب البقع ويترك رائحة منعشة.',
      price: 120,
      originalPrice: 150,
      priceAfterDiscount: 120,
      discount: 30,
      rating: 4.7,
      reviews: 128,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
      brand: 'الفتح',
      category: 'منظفات منزلية',
      subCategory: 'متعدد الاستخدام',
      productType: 'featured',
      featured: true
    },
    {
      _id: 'dummy-2',
      name: 'سائل غسل الصحون المركز',
      description: 'تركيبة مركزة بفيتامين E لنعومة اليدين ولمعان الأواني مع رغوة وفيرة وسهولة في الشطف.',
      price: 75,
      originalPrice: 90,
      priceAfterDiscount: 70,
      discount: 20,
      rating: 4.6,
      reviews: 94,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80',
      brand: 'Sparkle',
      category: 'منظفات المطبخ',
      subCategory: 'غسول الصحون',
      productType: 'specialOffer',
      specialOffer: true
    },
    {
      _id: 'dummy-3',
      name: 'مطهر ومعقم أرضيات 2 لتر',
      description: 'مطهر بتركيبة فعالة يقتل 99.9% من الجراثيم ويترك عطراً مميزاً يدوم لساعات طويلة.',
      price: 95,
      originalPrice: 95,
      rating: 4.8,
      reviews: 203,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1504548840739-580b10ae7715?auto=format&fit=crop&w=900&q=80',
      brand: 'Pure Home',
      category: 'منظفات منزلية',
      subCategory: 'مطهرات الأرضيات',
      productType: 'bestSeller',
      bestSeller: true
    },
    {
      _id: 'dummy-4',
      name: 'ملمع الزجاج والأسطح',
      description: 'بعطر اللافندر، يترك الزجاج خالياً من الخطوط ويوفر حماية من إعادة التصاق الأتربة.',
      price: 60,
      originalPrice: 70,
      priceAfterDiscount: 60,
      discount: 10,
      rating: 4.5,
      reviews: 65,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80',
      brand: 'Crystal',
      category: 'منظفات النوافذ',
      subCategory: 'ملمع الزجاج',
      productType: 'normal'
    }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private fb: FormBuilder,
    private viewportScroller: ViewportScroller
  ) {
    this.filterForm = this.fb.group({
      subcategory: [''],
      minPrice: [''],
      maxPrice: [''],
      sort: [''],
      productType: [''],
      featured: ['']
    });
  }

  ngOnInit(): void {
    // Scroll to top when component initializes
    this.viewportScroller.scrollToPosition([0, 0]);
    
    this.loadProducts();
    this.setupFilterListeners();
    this.loadCategories();
    this.setupKeyboardListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchQueryChangesSubject.complete();
    // Restore body scroll when component is destroyed
    document.body.style.overflow = 'auto';
  }

  private setupFilterListeners(): void {
    console.log('Setting up filter listeners...');
    
    // Listen to form changes with debounce
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((formValue) => {
        console.log('Filter form changed:', formValue);
        console.log('Current search query:', this.searchQuery);
        this.currentPage = 1;
        this.loadProducts(); // Call API instead of client-side filtering
      });

    // Listen to search query changes
    console.log('Setting up search query listener...');
    this.searchQueryChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe((query) => {
        console.log('Search query changed after debounce:', query);
        console.log('Current form values:', this.filterForm.value);
        this.currentPage = 1;
        console.log('About to call loadProducts...');
        this.loadProducts(); // Call API instead of client-side filtering
      });
    console.log('Search query listener set up successfully');
  }

  private searchQueryChangesSubject = new Subject<string>();
  
  private get searchQueryChanges() {
    return this.searchQueryChangesSubject;
  }

  onSearchChange(query: string): void {
    console.log('onSearchChange called with:', query);
    this.searchQuery = query;
    console.log('searchQuery updated to:', this.searchQuery);
    
    // Trigger search immediately for better UX
    console.log('About to call searchQueryChanges.next()');
    this.searchQueryChanges.next(query);
    console.log('searchQueryChanges.next() called successfully');
    
    // Close side nav after a short delay to let user see the search results
    if (query.trim().length > 2) {
      setTimeout(() => {
        this.closeSideNav();
      }, 1500);
    }
  }

  loadProducts(): void {
    console.log('loadProducts() called');
    this.loading = true;
    this.error = '';

    // Build query parameters
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Add search query
    console.log('Current searchQuery value:', this.searchQuery);
    if (this.searchQuery !== undefined && this.searchQuery !== null) {
      if (this.searchQuery.trim() !== '') {
        params.search = this.searchQuery.trim();
        console.log('Added search parameter:', params.search);
      } else {
        console.log('Search query is empty, will show all products');
      }
    } else {
      console.log('Search query is undefined/null');
    }

    // Add filter values
    const filterValues = this.filterForm.value;
    Object.keys(filterValues).forEach(key => {
      if (filterValues[key] && filterValues[key] !== '') {
        params[key] = filterValues[key];
      }
    });

    // Convert to query string
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    console.log('API Call - Query String:', queryString);
    console.log('API Call - Params:', params);

    this.productService.getProductsWithFilters(queryString)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          if (response.success && response.data) {
            // Check if pagination is at root level
            if (response.pagination) {
              // Pagination at root level
              this.products = response.data || [];
              this.totalItems = response.pagination.total || 0;
              this.totalPages = response.pagination.pages || 0;
              this.currentPage = response.pagination.current || 1;
              this.itemsPerPage = response.pagination.limit || 12;
            } else if (response.data.pagination) {
              // Pagination inside data object
              this.products = response.data.products || [];
              this.totalItems = response.data.pagination.total || 0;
              this.totalPages = response.data.pagination.pages || 0;
              this.currentPage = response.data.pagination.current || 1;
              this.itemsPerPage = response.data.pagination.limit || 12;
            } else if (response.data.products) {
              // Products array with total at data level
              this.products = response.data.products;
              this.totalItems = response.data.total || response.data.products.length;
              this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            } else if (Array.isArray(response.data)) {
              // Direct array structure
              this.products = response.data;
              this.totalItems = response.data.length;
              this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            } else {
              this.useFallbackProducts();
            }
            
            // Set filtered products to the same as products since we're doing server-side filtering
            this.filteredProducts = this.products;
            console.log('Products loaded:', this.products.length);
            console.log('Total items:', this.totalItems);
          } else {
            this.useFallbackProducts();
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading products:', err);
          console.error('Query string that failed:', queryString);
          this.useFallbackProducts();
          this.loading = false;
        }
      });
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
(product.brand || '').toLowerCase().includes(query)
      );
    }

    // Apply price filters
    const minPrice = this.filterForm.get('minPrice')?.value;
    const maxPrice = this.filterForm.get('maxPrice')?.value;
    
    if (minPrice) {
      filtered = filtered.filter(product => product.price >= minPrice);
    }
    
    if (maxPrice) {
      filtered = filtered.filter(product => product.price <= maxPrice);
    }

    // Apply product type filter
    const productType = this.filterForm.get('productType')?.value;
    if (productType) {
      filtered = filtered.filter(product => {
        switch (productType) {
          case 'featured':
            return (product.rating || 0) >= 4.5;
          case 'bestSeller':
            return (product.reviews || 0) >= 100;
          case 'specialOffer':
            return product.isOnSale;
          default:
            return true;
        }
      });
    }

    // Apply featured filter
    const featured = this.filterForm.get('featured')?.value;
    if (featured !== null && featured !== '') {
      filtered = filtered.filter(product => 
        featured ? (product.rating || 0) >= 4.5 : true
      );
    }

    // Apply sorting
    const sort = this.filterForm.get('sort')?.value;
    if (sort) {
      filtered = this.sortProducts(filtered, sort);
    }

    this.filteredProducts = filtered;
    
    // IMPORTANT: Don't override totalItems and totalPages from API
    // Only recalculate if we're doing client-side filtering AND have active filters
    if ((this.searchQuery.trim() || this.hasActiveFilters()) && filtered.length !== this.products.length) {
      // Client-side filtering with different results - recalculate pagination
      this.totalItems = filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      
      // Reset to first page if current page is out of bounds
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = 1;
      }
    }
    

  }

  private hasActiveFilters(): boolean {
    const filterValues = this.filterForm.value;
    return Object.values(filterValues).some(value => value && value !== '');
  }

  private loadCategories(): void {
    this.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        this.subCategories = this.extractAllSubcategories(this.categories);
      },
      error: (error) => {
        this.categories = [];
        this.subCategories = [];
      }
    });
  }

  private getCategories(): Observable<any[]> {
    return this.productService.getCategories().pipe(
      map((response: any) => {
        if (response && response.success && response.data) {
          return response.data;
        } else if (response && Array.isArray(response)) {
          return response;
        }
        return this.categories;
      }),
      catchError((error: any) => {
        return of(this.categories).pipe(delay(500));
      })
    );
  }

  private extractAllSubcategories(categories: any[]): any[] {
    const allSubcategories: any[] = [];
    
    categories.forEach(category => {
      if (category.subcategories && Array.isArray(category.subcategories)) {
        category.subcategories.forEach((subcategory: any) => {
          const subcategoryWithParent = {
            ...subcategory,
            parentCategoryId: category._id || category.id,
            parentCategoryName: category.name
          };
          allSubcategories.push(subcategoryWithParent);
        });
      }
    });
    
    return allSubcategories;
  }

  private sortProducts(products: Product[], sortBy: string): Product[] {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      case 'name_desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating_desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'reviews_desc':
        return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      default:
        return sorted;
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.searchQuery = '';
    this.currentPage = 1;
    this.totalItems = 0;
    this.totalPages = 0;
    this.loadProducts();
  }

  applyFiltersManually(): void {
    console.log('Manually applying filters:', this.filterForm.value);
    this.currentPage = 1;
    this.loadProducts();
  }

  onAddToCart(product: Product): void {
    // العملية تتم داخل product-card component
    // لا نحتاج لاستدعاء addToCart مرة أخرى هنا
  }

  // Mobile side navigation methods
  openSideNav(): void {
    console.log('Opening side nav...');
    this.isSideNavOpen = true;
    // Allow body scroll when side nav is open so user can see results
    document.body.style.overflow = 'auto';
  }

  closeSideNav(): void {
    this.isSideNavOpen = false;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  toggleSideNav(): void {
    if (this.isSideNavOpen) {
      this.closeSideNav();
    } else {
      this.openSideNav();
    }
  }

  onSideNavBackdropClick(): void {
    this.closeSideNav();
  }

  applyFiltersAndClose(): void {
    this.applyFilters();
    this.closeSideNav();
  }

  private setupKeyboardListeners(): void {
    // Listen for Escape key to close side nav
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isSideNavOpen) {
        this.closeSideNav();
      }
    });
  }

  get paginatedProducts(): Product[] {
    // If we have server-side pagination, return all products from current page
    // If we have client-side filtering, apply pagination locally
    if (this.searchQuery.trim() || this.hasActiveFilters()) {
      // Client-side pagination
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return this.filteredProducts.slice(startIndex, endIndex);
    } else {
      // Server-side pagination - return all products from current page
      return this.filteredProducts;
    }


  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  private useFallbackProducts(): void {
    this.error = '';
    this.products = [...this.fallbackProductsData];
    this.filteredProducts = [...this.fallbackProductsData];
    this.totalItems = this.filteredProducts.length;
    this.itemsPerPage = 12;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
  }
}
