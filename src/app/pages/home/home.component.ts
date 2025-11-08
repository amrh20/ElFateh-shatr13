import { Component, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';
import { Product, Category, Order } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { register } from 'swiper/element/bundle';

// Register Swiper elements
register();

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  featuredProducts: Product[] = [];
  bestSellers: any[] = [];
  onSaleProducts: Product[] = [];
  currentOrder: Order | null = null;
  
  // Storage info
  storageInfo: any = null;
  cartSize = 0;
  wishlistSize = 0;

  private readonly fallbackCategories: Category[] = [
    {
      _id: 'fc-1',
      name: 'منظفات منزلية',
      description: 'مجموعة متكاملة لتنظيف المنزل بروائح منعشة',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
      isActive: true,
      parent: null,
      ancestors: [],
      subcategories: []
    },
    {
      _id: 'fc-2',
      name: 'أدوات مطبخ',
      description: 'أفضل الأدوات والإكسسوارات لمطبخك',
      image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80',
      isActive: true,
      parent: null,
      ancestors: [],
      subcategories: []
    },
    {
      _id: 'fc-3',
      name: 'العناية الشخصية',
      description: 'منتجات مميزة للعناية اليومية بك وبعائلتك',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      isActive: true,
      parent: null,
      ancestors: [],
      subcategories: []
    }
  ];

  private readonly fallbackProducts: Product[] = [
    {
      _id: 'fp-1',
      name: 'منظف أرضيات برائحة اللافندر',
      description: 'تركيبة فعالة تنظف وتترك عطراً مميزاً يدوم طويلاً',
      price: 95,
      originalPrice: 120,
      priceAfterDiscount: 95,
      image: 'https://images.unsplash.com/photo-1504548840739-580b10ae7715?auto=format&fit=crop&w=900&q=80',
      images: ['https://images.unsplash.com/photo-1504548840739-580b10ae7715?auto=format&fit=crop&w=900&q=80'],
      category: 'منظفات منزلية',
      subCategory: 'منظفات الأرضيات',
      stock: 40,
      rating: 4.8,
      reviews: 215
    },
    {
      _id: 'fp-2',
      name: 'سائل غسل الصحون مركز',
      description: 'رغوة غنية، سهل الشطف، لطيف على اليدين',
      price: 70,
      originalPrice: 85,
      priceAfterDiscount: 70,
      image: 'https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80',
      images: ['https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80'],
      category: 'منظفات منزلية',
      subCategory: 'منظفات المطبخ',
      stock: 60,
      rating: 4.6,
      reviews: 142
    },
    {
      _id: 'fp-3',
      name: 'طقم أواني مطبخ استلس 10 قطع',
      description: 'جودة ممتازة ومتانة عالية للاستخدام اليومي',
      price: 480,
      image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80',
      images: ['https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80'],
      category: 'أدوات مطبخ',
      subCategory: 'أدوات المطبخ',
      stock: 20,
      rating: 4.9,
      reviews: 98
    },
    {
      _id: 'fp-4',
      name: 'منظم حمام متعدد الأرفف',
      description: 'تصميم أنيق لتخزين أدوات الحمام بشكل منظم',
      price: 190,
      originalPrice: 220,
      priceAfterDiscount: 190,
      image: 'https://images.unsplash.com/photo-1604014237415-3cf0ee1157e8?auto=format&fit=crop&w=900&q=80',
      images: ['https://images.unsplash.com/photo-1604014237415-3cf0ee1157e8?auto=format&fit=crop&w=900&q=80'],
      category: 'أدوات منزلية',
      subCategory: 'أدوات الحمام',
      stock: 35,
      rating: 4.5,
      reviews: 77
    }
  ];

  private readonly fallbackOrder: Order = {
    id: 'ORD-2025-1001',
    userId: 1,
    items: [
      {
        product: this.fallbackProducts[0],
        quantity: 2
      },
      {
        product: this.fallbackProducts[2],
        quantity: 1
      }
    ],
    totalAmount: 670,
    status: 'confirmed',
    orderDate: new Date(),
    deliveryDate: undefined,
    deliveryAddress: 'المعادى، القاهرة',
    paymentMethod: 'cash',
    trackingNumber: 'TRK-102938'
  };

  constructor(
    private productService: ProductService,
    public orderService: OrderService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // Scroll to top when component initializes
    this.viewportScroller.scrollToPosition([0, 0]);
    
    this.loadCategories();
    this.loadFeaturedProducts();
    this.loadBestSellers();
    this.loadOnSaleProducts();
    this.loadCurrentOrder();
    this.loadStorageInfo();
    this.subscribeToServices();
    
    // Test API response structure
    this.testAPIResponse();
  }

  // Data loading methods
  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = this.prepareCategories(categories && categories.length ? categories : this.fallbackCategories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = this.prepareCategories(this.fallbackCategories);
        this.notificationService.error('خطأ', 'فشل في تحميل الأصناف، تم عرض بيانات تجريبية');
      }
    });
  }

  loadFeaturedProducts(): void {
    this.productService.getFeaturedProductsFromAPI().subscribe({
      next: (products) => {
        console.log('Featured products:', products);
        this.featuredProducts = this.prepareProducts(products && products.length ? products : this.fallbackProducts);
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
        this.featuredProducts = this.prepareProducts(this.fallbackProducts);
        this.notificationService.error('خطأ', 'فشل في تحميل المنتجات المميزة، تم عرض بيانات تجريبية');
      }
    });
  }

  loadBestSellers(): void {
    this.productService.getBestSellersFromAPI().subscribe({
      next: (products) => {
        this.bestSellers = this.prepareProducts(products && products.length ? products : this.fallbackProducts);
      },
      error: (error) => {
        console.error('Error loading best sellers:', error);
        this.bestSellers = this.prepareProducts(this.fallbackProducts);
        this.notificationService.error('خطأ', 'فشل في تحميل الأكثر مبيعاً، تم عرض بيانات تجريبية');
      }
    });
  }

  loadOnSaleProducts(): void {
    this.productService.getSpecialOfferProductsFromAPI().subscribe({
      next: (products) => {
        this.onSaleProducts = this.prepareProducts(products && products.length ? products : this.fallbackProducts);
      },
      error: (error) => {
        console.error('Error loading special offer products:', error);
        this.onSaleProducts = this.prepareProducts(this.fallbackProducts);
        this.notificationService.error('خطأ', 'فشل في تحميل العروض الخاصة، تم عرض بيانات تجريبية');
      }
    });
  }

  loadCurrentOrder(): void {
    this.orderService.getUserOrders().subscribe({
      next: (res) => {
        if (res && res.success && res.data && res.data.length > 0) {
          // Find the first active order (not delivered or cancelled)
          const activeOrder = res.data.find((order: any) => 
            ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
          );
          
          if (activeOrder) {
            // Map the API response to our Order model
            this.currentOrder = {
              id: activeOrder.orderNumber,
              userId: activeOrder.user,
              items: activeOrder.items.map((item: any) => ({
                product: {
                  _id: item.product._id,
                  name: item.product.name,
                  description: item.product.description || '',
                  price: item.product.price,
                  image: item.product.images && item.product.images.length > 0 
                    ? item.product.images[0] 
                    : 'assets/images/placeholder.jpg',
                  category: item.product.category || '',
                  brand: item.product.brand || '',
                  stock: item.product.stock || 0,
                  rating: item.product.rating || 0,
                  reviews: item.product.reviews || 0,
                  isOnSale: item.product.isOnSale || false,
                  images: item.product.images || []
                },
                quantity: item.quantity
              })),
              totalAmount: activeOrder.totalAmount,
              status: activeOrder.status,
              orderDate: new Date(activeOrder.createdAt),
              deliveryDate: activeOrder.updatedAt ? new Date(activeOrder.updatedAt) : undefined,
              deliveryAddress: `${activeOrder.customerInfo?.address?.street || ''}, ${activeOrder.customerInfo?.address?.city || ''}`,
              paymentMethod: 'cash',
              trackingNumber: activeOrder.orderNumber
            };
          } else {
            this.currentOrder = null;
          }
        } else {
          this.currentOrder = null;
        }
      },
      error: (error) => {
        console.error('Error loading current order:', error);
        this.currentOrder = this.fallbackOrder;
      }
    });
  }

  refreshCurrentOrder(): void {
    this.notificationService.success('جاري التحديث', 'جاري تحديث حالة الطلب...');
    this.loadCurrentOrder();
  }

  loadStorageInfo(): void {
    try {
      this.storageInfo = this.storageService.getStorageInfo();
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  }

  subscribeToServices(): void {
    // Subscribe to cart changes
    this.cartService.getCartItems().subscribe(items => {
      this.cartSize = this.cartService.getCartSize();
    });

    // Subscribe to wishlist changes
    this.wishlistService.getWishlistItems().subscribe(items => {
      this.wishlistSize = this.wishlistService.getWishlistSize();
    });
  }

  onAddToCart(product: Product): void {
    // Product added to cart via product card component
    
    // Show success message
    this.notificationService.success('تم الإضافة', `${product.name} تم إضافته إلى السلة بنجاح`);
  }

  // Storage management methods
  clearStorage(): void {
    if (confirm('هل أنت متأكد من مسح جميع البيانات المحفوظة؟')) {
      const result = this.storageService.clearAll();
      this.notificationService.showStorageResult(result);
      
      if (result.success) {
        this.loadStorageInfo();
      }
    }
  }

  exportStorageData(): void {
    try {
      const data = this.storageService.exportStorageData();
      if (data) {
        // Create download link
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elfateh_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.notificationService.success('تم التصدير', 'تم تصدير البيانات بنجاح');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.notificationService.error('خطأ', 'فشل في تصدير البيانات');
    }
  }

  importStorageData(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const result = this.storageService.importStorageData(e.target.result);
          this.notificationService.showStorageResult(result);
          
          if (result.success) {
            this.loadStorageInfo();
            // Refresh data
            this.subscribeToServices();
          }
        } catch (error) {
          console.error('Error importing data:', error);
          this.notificationService.error('خطأ', 'فشل في استيراد البيانات');
        }
      };
      reader.readAsText(file);
    }
  }

  // Get storage usage percentage
  getStorageUsagePercentage(): number {
    return this.storageInfo ? this.storageInfo.percentage : 0;
  }

  // Get storage usage color
  getStorageUsageColor(): string {
    const percentage = this.getStorageUsagePercentage();
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  }

  // Check if storage is healthy
  isStorageHealthy(): boolean {
    return this.storageInfo ? !this.storageInfo.quotaExceeded : true;
  }

  // Helper method to clean image URLs from API response
  getCleanImageUrl(imageUrl: string): string {
    let cleaned = imageUrl || '';

    if (cleaned.includes('data-src=')) {
      const match = cleaned.match(/data-src="([^"]+)"/);
      if (match && match[1]) {
        cleaned = match[1];
      }
    }

    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    if (cleaned.includes('\\"')) {
      cleaned = cleaned.replace(/\\"/g, '');
    }

    return cleaned || 'assets/images/placeholder.png';
  }

  // Test API response structure
  testAPIResponse(): void {
    this.productService.testAPIResponse().subscribe({
      next: (response) => {
      },
      error: (error) => {
        console.error('API Test failed in home component:', error);
      }
    });
  }

  private prepareProducts(products: any[]): Product[] {
    if (!Array.isArray(products)) {
      return [];
    }
    return products.map(product => this.mapProduct(product));
  }

  private prepareCategories(categories: any[]): Category[] {
    if (!Array.isArray(categories)) {
      return [];
    }
    return categories.map(category => ({
      ...category,
      image: this.getCleanImageUrl(category?.image || ''),
      subcategories: category?.subcategories || []
    }));
  }

  private mapProduct(product: any): Product {
    const fallbackImage = this.getCleanImageUrl(product?.image || (Array.isArray(product?.images) ? product.images[0] : ''));
    const images = Array.isArray(product?.images) && product.images.length
      ? product.images.map((img: string) => this.getCleanImageUrl(img))
      : [fallbackImage];

    return {
      ...product,
      image: fallbackImage,
      images
    } as Product;
  }
}