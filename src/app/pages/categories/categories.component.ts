import { Component, OnInit } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ProductService } from '../../services/product.service';
import { Product, Category, SubCategory } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, ProductCardComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  selectedCategoryId: string | null = null;
  selectedSubCategoryId: string | null = null;
  categorySearch: string = '';
  productSearch: string = '';
  loading: boolean = false;
  error: string | null = null;
  
  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalProducts: number = 0;
  limit: number = 12;
  pagination: any = null;
  
  // Make Math available in template
  Math = Math;

  private readonly fallbackCategories: Category[] = [
    {
      _id: 'cat-1',
      name: 'منظفات منزلية',
      description: 'مجموعة متكاملة من منظفات الأرضيات والمطابخ والحمامات',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
      isActive: true,
      parent: null,
      ancestors: [],
      subcategories: [
        {
          _id: 'sub-1',
          name: 'منظفات الأرضيات',
          description: 'منظفات فعّالة لجميع أنواع الأرضيات',
          image: 'https://images.unsplash.com/photo-1504548840739-580b10ae7715?auto=format&fit=crop&w=900&q=80',
          isActive: true,
          parent: 'cat-1',
          ancestors: [],
          products: []
        },
        {
          _id: 'sub-2',
          name: 'منظفات المطبخ',
          description: 'سائل أطباق ومنظفات أسطح المطبخ',
          image: 'https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80',
          isActive: true,
          parent: 'cat-1',
          ancestors: [],
          products: []
        }
      ]
    },
    {
      _id: 'cat-2',
      name: 'أدوات منزلية',
      description: 'أدوات مطبخ، حمام، وتنظيف متكاملة',
      image: 'https://images.unsplash.com/photo-1559718062-36113814f8c2?auto=format&fit=crop&w=900&q=80',
      isActive: true,
      parent: null,
      ancestors: [],
      subcategories: [
        {
          _id: 'sub-3',
          name: 'أدوات المطبخ',
          description: 'سكاكين، أطباق، وحافظات طعام',
          image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80',
          isActive: true,
          parent: 'cat-2',
          ancestors: [],
          products: []
        },
        {
          _id: 'sub-4',
          name: 'أدوات الحمام',
          description: 'إكسسوارات الحمام ومنتجات التخزين',
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
          isActive: true,
          parent: 'cat-2',
          ancestors: [],
          products: []
        }
      ]
    }
  ] as any;

  private readonly fallbackProducts: Product[] = [
    {
      _id: 'prod-1',
      name: 'منظف أرضيات مركز',
      description: 'تركيبة فعالة تقتل 99.9% من الجراثيم وتترك عطراً منعشاً يدوم طويلاً',
      price: 95,
      originalPrice: 120,
      priceAfterDiscount: 95,
      image: 'https://images.unsplash.com/photo-1504548840739-580b10ae7715?auto=format&fit=crop&w=900&q=80',
      category: 'منظفات منزلية',
      subCategory: 'منظفات الأرضيات',
      stock: 50,
      rating: 4.8,
      reviews: 203
    },
    {
      _id: 'prod-2',
      name: 'سائل غسل الصحون مركز',
      description: 'برائحة الليمون منعش، رغوة غنية، لطيف على اليدين ويزيل أصعب الدهون',
      price: 70,
      originalPrice: 85,
      priceAfterDiscount: 70,
      image: 'https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80',
      category: 'منظفات منزلية',
      subCategory: 'منظفات المطبخ',
      stock: 80,
      rating: 4.6,
      reviews: 134
    },
    {
      _id: 'prod-3',
      name: 'مجموعة أدوات مطبخ استلس',
      description: 'أساسيات المطبخ بجودة عالية تشمل أدوات التقديم والطبخ',
      price: 320,
      image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80',
      category: 'أدوات منزلية',
      subCategory: 'أدوات المطبخ',
      stock: 25,
      rating: 4.7,
      reviews: 89
    },
    {
      _id: 'prod-4',
      name: 'منظم حمام متعدد الأرفف',
      description: 'تصميم أنيق لتخزين الأدوات الشخصية والعناية اليومية',
      price: 180,
      image: 'https://images.unsplash.com/photo-1604014237415-3cf0ee1157e8?auto=format&fit=crop&w=900&q=80',
      category: 'أدوات منزلية',
      subCategory: 'أدوات الحمام',
      stock: 40,
      rating: 4.5,
      reviews: 63
    }
  ];

  constructor(
    private productService: ProductService,
    private http: HttpClient,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // Scroll to top when component initializes
    this.viewportScroller.scrollToPosition([0, 0]);
    
    this.loadCategories();
    // Load all products for filtering purposes
    this.loadAllProducts();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    
    // Call the categories API endpoint
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = response.data;
          this.loadSubcategoriesData();
        } else {
          this.useFallbackCategories();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.useFallbackCategories();
        this.loading = false;
      }
    });
  }

  // Load subcategories data to get names and product counts
  loadSubcategoriesData(): void {
    this.categories.forEach(category => {
      if (category.subcategories && category.subcategories.length > 0) {
        // For each subcategory ID, try to get its data
        category.subcategories.forEach((subId: string) => {
          this.loadSubcategoryData(subId, category._id);
        });
      }
    });
  }

  // Load individual subcategory data and product count
  loadSubcategoryData(subId: string, categoryId: string): void {
    const categoryRef = this.categories.find(c => c._id === categoryId);

    // First, get subcategory details
    this.http.get<any>(`${environment.apiUrl}/categories/${subId}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Update the subcategory in the categories array
          if (categoryRef) {
            const subIndex = categoryRef.subcategories.findIndex((s: any) => 
              typeof s === 'string' ? s === subId : s._id === subId
            );
            if (subIndex !== -1) {
              // Replace the ID with the full subcategory object
              categoryRef.subcategories[subIndex] = response.data;
              
              // Load product count for this subcategory
              this.loadSubcategoryProductCount(subId, categoryId, subIndex);
            }
          }
        } else {
          const fallbackIndex = categoryRef ? categoryRef.subcategories.findIndex((s: any) => 
            typeof s === 'string' ? s === subId : s._id === subId
          ) : -1;
          if (fallbackIndex !== -1) {
            this.populateFallbackSubcategory(categoryId, fallbackIndex);
          }
        }
      },
      error: () => {
        const fallbackIndex = categoryRef ? categoryRef.subcategories.findIndex((s: any) => 
          typeof s === 'string' ? s === subId : s._id === subId
        ) : -1;
        if (fallbackIndex !== -1) {
          this.populateFallbackSubcategory(categoryId, fallbackIndex);
        }
      }
    });
  }

  // Load product count for subcategory
  loadSubcategoryProductCount(subId: string, categoryId: string, subIndex: number): void {
    this.http.get<any>(`${environment.apiUrl}/products/subcategory/${subId}`).subscribe({
      next: (response) => {
        let productCount = 0;
        
        if (response.success && response.data) {
          productCount = response.data.length;
        } else if (Array.isArray(response)) {
          productCount = response.length;
        }
        
        // Update the product count in the subcategory
        const category = this.categories.find(c => c._id === categoryId);
        if (category && category.subcategories[subIndex]) {
          // Cast to any first, then add productCount property
          (category.subcategories[subIndex] as any).productCount = productCount;
        }
        
      },
      error: () => {
        const category = this.categories.find(c => c._id === categoryId);
        if (category && category.subcategories[subIndex]) {
          const fallback = this.fallbackProducts.filter(product => product.subCategory === (category.subcategories[subIndex] as any).name);
          (category.subcategories[subIndex] as any).productCount = fallback.length;
        }
      }
    });
  }


  autoSelectFirstSubcategory(): void {
    // Don't auto-select anything - let user choose manually
    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
  }

  loadAllProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        
        // If there's a search query waiting, apply it now
        if (this.productSearch.trim()) {
          this.applyProductSearch();
        }
      },
      error: (error) => {
        console.error('Error loading all products:', error);
        this.allProducts = [...this.fallbackProducts];
      }
    });
  }

  loadProductsBySubcategory(subCategoryId: string, page: number = 1): void {
    this.loading = true;
    this.error = null;
    this.currentPage = page;
    
    // Call the subcategory products API endpoint with pagination
    const url = `${environment.apiUrl}/products/subcategory/${subCategoryId}?page=${page}&limit=${this.limit}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        
        if (response.success && response.data) {
          this.filteredProducts = response.data;
          
          // Handle pagination info
          if (response.pagination) {
            this.pagination = response.pagination;
            this.currentPage = response.pagination.current || page;
            this.totalPages = response.pagination.pages || 1;
            this.totalProducts = response.pagination.total || 0;
          }
        } else if (Array.isArray(response)) {
          // Handle direct array response (fallback)
          this.filteredProducts = response;
          this.totalProducts = response.length;
          this.totalPages = Math.ceil(response.length / this.limit);
        } else {
          this.error = 'Failed to load products for this subcategory';
          this.filteredProducts = [];
          this.resetPagination();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products for subcategory:', subCategoryId, err);
        this.filteredProducts = this.fallbackProducts.filter(product =>
          product.subCategory === this.getSubCategoryName(subCategoryId)
        );
        this.totalProducts = this.filteredProducts.length;
        this.totalPages = Math.ceil(this.totalProducts / this.limit) || 1;
        this.error = null;
        this.loading = false;
      }
    });
  }

  loadProductsByCategory(categoryId: string): void {
    this.loading = true;
    this.error = null;
    
    // For main category, we'll filter from all products or call a category API if available
    const category = this.categories.find(c => c._id === categoryId);
    if (category) {
      this.filteredProducts = this.allProducts.filter(product => 
        product.category === category.name
      );
      this.totalProducts = this.filteredProducts.length;
      this.totalPages = Math.ceil(this.totalProducts / this.limit) || 1;
    } else {
      this.filteredProducts = [];
    }
    this.loading = false;
  }

  get filteredCategories(): Category[] {
    let filtered = this.categories;
    
    // Filter by search term if provided
    if (this.categorySearch) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(this.categorySearch.toLowerCase()) ||
        category.description.toLowerCase().includes(this.categorySearch.toLowerCase())
      );
    }
    
    // Only show categories that have subcategories with data (not just IDs)
    filtered = filtered.filter(category => {
      if (!category.subcategories || category.subcategories.length === 0) {
        return false;
      }
      
      // Check if subcategories have actual data (not just string IDs)
      const hasDataSubcategories = category.subcategories.some((sub: any) => 
        typeof sub === 'object' && sub._id && sub.name
      );
      
      return hasDataSubcategories;
    });
    
    return filtered;
  }

  toggleCategory(categoryId: string): void {
    if (this.selectedCategoryId === categoryId) {
      // إذا كانت مفتوحة، نغلقها
      this.selectedCategoryId = null;
      this.selectedSubCategoryId = null;
      this.filteredProducts = []; // Don't load all products
    } else {
      // نفتح الصنف الجديدة
      this.selectedCategoryId = categoryId;
      this.selectedSubCategoryId = null;
      this.filteredProducts = []; // Clear products when opening category
      // لا نحمل منتجات هنا، فقط نفتح Subcategories
    }
  }

  selectSubCategory(subCategory: any): void {
    // Get the subcategory ID
    const id = typeof subCategory === 'object' ? subCategory._id : subCategory;
    
    this.selectedSubCategoryId = id;
    this.resetPagination();
    this.loadProductsBySubcategory(id, 1);
  }

  onProductSearch(): void {
    if (!this.selectedSubCategoryId) return;
    
    if (!this.productSearch.trim()) {
      // If search is empty, reload all products for the selected subcategory
      this.loadProductsBySubcategory(this.selectedSubCategoryId);
    } else {
      // Apply search filter to current products
      this.applyProductSearch();
    }
  }

  applyProductSearch(): void {
    if (!this.allProducts || this.allProducts.length === 0) {
      // If we don't have all products loaded, load them first
      this.loadAllProducts();
      return;
    }

    const query = this.productSearch.toLowerCase().trim();
    
    // Filter products by name only
    this.filteredProducts = this.allProducts.filter(product => 
      product.name.toLowerCase().includes(query)
    );
    
  }

  clearSearch(): void {
    this.productSearch = '';
    if (this.selectedSubCategoryId) {
      // Reload products for the selected subcategory from page 1
      this.resetPagination();
      this.loadProductsBySubcategory(this.selectedSubCategoryId, 1);
    }
  }

  clearAllFilters(): void {
    this.selectedCategoryId = null;
    this.selectedSubCategoryId = null;
    this.categorySearch = '';
    this.productSearch = '';
    this.filteredProducts = []; // Don't load all products
    this.loading = false;
    this.error = null;
  }

  getCurrentSelectionName(): string {
    if (this.selectedSubCategoryId) {
      return this.getSubCategoryName(this.selectedSubCategoryId);
    }
    if (this.selectedCategoryId) {
      const category = this.categories.find(c => c._id === this.selectedCategoryId);
      return category?.name || '';
    }
    return '';
  }

  getCurrentSelectionCount(): number {
    return this.filteredProducts.length;
  }

  getSubCategoryName(subCategory: any): string {
    // Handle both string IDs and object references
    const id = typeof subCategory === 'object' ? subCategory._id || subCategory.id : subCategory;
    
    // Mock subcategory names - in real app, you'd fetch this from API
    const subCategoryNames: { [key: string]: string } = {
      '1': 'منظفات الأرضيات',
      '2': 'منظفات المطبخ',
      '3': 'منظفات الحمام',
      '4': 'منظفات الزجاج',
      '5': 'منظفات الملابس',
      '6': 'أدوات المطبخ',
      '7': 'أدوات التنظيف',
      '8': 'أدوات الحمام',
      '9': 'أدوات الغسيل',
      '10': 'منتجات العناية بالبشرة',
      '11': 'منتجات العناية بالشعر',
      '12': 'منتجات العناية الشخصية'
    };
    return subCategoryNames[id] || 'صنف فرعية';
  }

  getSubCategoryProductCount(subCategory: any): number {
    if (typeof subCategory === 'object' && subCategory.productCount !== undefined) {
      return subCategory.productCount || 0;
    }
    const name = this.getSubCategoryDisplayName(subCategory);
    return this.fallbackProducts.filter(product => product.subCategory === name).length;
  }

  // Get subcategories that have actual data (not just IDs)
  getSubcategoriesWithData(category: Category): any[] {
    if (!category.subcategories) return [];
    
    return category.subcategories.filter((sub: any) => 
      typeof sub === 'object' && sub._id && sub.name
    );
  }

  // Get display name for subcategory
  getSubCategoryDisplayName(subCategory: any): string {
    if (typeof subCategory === 'object' && subCategory.name) {
      return subCategory.name;
    }
    
    // Fallback to ID if no name available
    const id = typeof subCategory === 'string' ? subCategory : subCategory._id || subCategory.id;
    return this.getSubCategoryName(id);
  }

  // Helper method to safely extract subcategory ID
  getSubCategoryId(subCategory: any): string {
    return typeof subCategory === 'object' ? subCategory._id || subCategory.id : subCategory;
  }

  private useFallbackCategories(): void {
    this.categories = JSON.parse(JSON.stringify(this.fallbackCategories));
    // Populate fallback product counts
    this.categories.forEach(category => {
      category.subcategories?.forEach((sub: any, index: number) => {
        this.populateFallbackSubcategory(category._id, index);
      });
    });
    this.error = null;
  }

  private populateFallbackSubcategory(categoryId: string, subIndex: number): void {
    const category = this.categories.find(c => c._id === categoryId);
    if (!category || !category.subcategories || !category.subcategories[subIndex]) {
      return;
    }
    const sub = category.subcategories[subIndex] as any;
    const fallback = this.fallbackProducts.filter(product => product.subCategory === sub.name);
    sub.productCount = fallback.length;
    sub.products = fallback;
  }

  onAddToCart(product: Product): void {
    // Product added to cart via product card component
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

  // Pagination methods
  resetPagination(): void {
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalProducts = 0;
    this.pagination = null;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    if (this.selectedSubCategoryId) {
      this.loadProductsBySubcategory(this.selectedSubCategoryId, page);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}