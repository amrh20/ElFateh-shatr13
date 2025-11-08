import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product: Product | undefined;
  selectedImage: string = '';
  quantity: number = 1;
  
  // Lightbox properties
  showLightbox: boolean = false;
  lightboxImage: string = '';
  
  // Related products
  relatedProducts: Product[] = [];
  isLoadingRelatedProducts: boolean = false;

  private readonly dummyProducts: Product[] = [
    {
      _id: 'dummy-1',
      name: 'منظف متعدد الاستخدام',
      description: 'منظف مركز آمن على جميع الأسطح، يزيل أصعب البقع ويترك رائحة منعشة تدوم طويلًا.',
      price: 120,
      originalPrice: 150,
      priceAfterDiscount: 120,
      discount: 30,
      rating: 4.7,
      reviews: 128,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=900&q=80'
      ],
      brand: 'الفتح',
      category: 'منظفات منزلية',
      subCategory: 'متعدد الاستخدام',
      specifications: {
        'الحجم': '1 لتر',
        'بلد المنشأ': 'مصر',
        'التركيبة': 'خالية من المواد القاسية',
        'الاستعمال': 'أسطح المطبخ، الأجهزة، الأرضيات'
      }
    },
    {
      _id: 'dummy-2',
      name: 'سائل غسل الصحون المركز',
      description: 'تركيبة مركزة بفيتامين E لنعومة اليدين ولمعان الأواني مع رغوة وفيرة وسهولة في الشطف.',
      price: 70,
      originalPrice: 90,
      priceAfterDiscount: 70,
      discount: 20,
      rating: 4.6,
      reviews: 94,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1615485290382-31f1050aeed7?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1609947017136-69df02c9a5a7?auto=format&fit=crop&w=900&q=80'
      ],
      brand: 'Sparkle',
      category: 'منظفات المطبخ',
      subCategory: 'غسول الصحون',
      productType: 'specialOffer',
      specifications: {
        'الحجم': '750 مل',
        'العطر': 'حمضيات طازجة',
        'مناسب ل': 'الأواني، الأكواب، أدوات المائدة',
        'مزايا إضافية': 'صديق للبشرة، سريع الشطف'
      }
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
      images: [
        'https://images.unsplash.com/photo-1504548840739-580b10ae7715?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80'
      ],
      brand: 'Pure Home',
      category: 'منظفات منزلية',
      subCategory: 'مطهرات الأرضيات',
      productType: 'bestSeller',
      specifications: {
        'الحجم': '2 لتر',
        'العطر': 'لافندر',
        'مدة الحماية': 'حتى 24 ساعة',
        'نسبة التعقيم': '99.9%'
      }
    }
  ];
  
  // Slider reference
  @ViewChild('relatedProductsSlider') relatedProductsSlider!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // Scroll to top when component initializes
    this.viewportScroller.scrollToPosition([0, 0]);
    
    this.route.params.subscribe((params) => {
      const productId = params['id'];
      this.loadProduct(productId);
    });
  }

  loadProduct(productId: string | number): void {
    if (typeof productId === 'string' && productId.startsWith('dummy')) {
      const product = this.dummyProducts.find(item => item._id === productId);
      if (product) {
        this.setupProductState(product, true);
      }
      return;
    }

    this.productService.getProductById(productId).subscribe(product => {
      this.setupProductState(product, false, productId);
    });
  }

  private setupProductState(product: Product | undefined, isDummy: boolean, productId?: string | number): void {
    this.product = product;

    if (this.product) {
      if (!this.product.images || this.product.images.length === 0) {
        const primaryImage = this.product.image || 'assets/images/placeholder.png';
        this.product.images = [primaryImage];
      }

      this.selectedImage = this.product.images?.[0] || this.product.image || '';
      this.lightboxImage = this.selectedImage;
      this.quantity = 1;

      if (isDummy) {
        const related = this.dummyProducts.filter(item => item._id !== this.product?._id);
        this.relatedProducts = related.slice(0, 4);
        this.isLoadingRelatedProducts = false;
        return;
      }

      if (!productId) {
        productId = this.product._id || this.product.id || '';
      }

      const subcategoryId = this.product.subCategory || 
                           this.product.subcategory?._id || 
                           this.product.subcategory || 
                           this.product.category;

      if (subcategoryId) {
        this.loadRelatedProducts(subcategoryId as string, productId);
      } else {
        this.loadAllProductsAsRelated(productId);
      }
    }
  }

  loadRelatedProducts(subcategoryId: string, currentProductId: string | number): void {
    this.isLoadingRelatedProducts = true;
    console.log('Loading related products for subcategory:', subcategoryId);
    console.log('Current product ID:', currentProductId);
    
    // Use the subcategory filter to get related products
    const queryString = `subcategory=${encodeURIComponent(subcategoryId)}&limit=8`;
    console.log('Query string:', queryString);
    
    this.productService.getProductsWithFilters(queryString).subscribe({
      next: (response) => {
        this.isLoadingRelatedProducts = false;
        console.log('Related products response:', response);
        
        if (response.success && response.data && response.data.products) {
          console.log('Found products:', response.data.products.length);
          
          // Filter out the current product from related products
          this.relatedProducts = response.data.products.filter(
            (product: Product) => product._id !== currentProductId && product.id !== currentProductId
          );
          
          console.log('Related products after filtering:', this.relatedProducts.length);
          
          // If no related products found, try fallback
          if (this.relatedProducts.length === 0) {
            console.log('No related products found, trying fallback method...');
            this.loadRelatedProductsFallback(subcategoryId, currentProductId);
            return;
          }
          
          // Limit to 6 products for the slider
          this.relatedProducts = this.relatedProducts.slice(0, 6);
          console.log('Final related products:', this.relatedProducts.length);
        } else {
          console.log('No products found in response, trying fallback method...');
          this.loadRelatedProductsFallback(subcategoryId, currentProductId);
        }
      },
      error: (error) => {
        this.isLoadingRelatedProducts = false;
        console.error('Error loading related products:', error);
        
        // Fallback: try to load all products and filter by subcategory
        console.log('Trying fallback method...');
        this.loadRelatedProductsFallback(subcategoryId, currentProductId);
      }
    });
  }

  loadRelatedProductsFallback(subcategoryId: string, currentProductId: string | number): void {
    console.log('Loading all products for fallback filtering...');
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log('All products loaded:', products.length);
        
        // Filter products by subcategory
        const relatedProducts = products.filter((product: Product) => {
          const productSubcategory = product.subCategory || product.subcategory?._id || product.subcategory || product.category;
          return productSubcategory === subcategoryId && 
                 product._id !== currentProductId && 
                 product.id !== currentProductId;
        });
        
        console.log('Filtered related products:', relatedProducts.length);
        
        // Limit to 6 products
        this.relatedProducts = relatedProducts.slice(0, 6);
        console.log('Final fallback related products:', this.relatedProducts.length);
      },
      error: (error) => {
        console.error('Fallback method also failed:', error);
      }
    });
  }

  loadAllProductsAsRelated(currentProductId: string | number): void {
    console.log('Loading all products as related products...');
    this.isLoadingRelatedProducts = true;
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.isLoadingRelatedProducts = false;
        console.log('All products loaded for related section:', products.length);
        
        // Filter out current product and get random 6 products
        const filteredProducts = products.filter(
          (product: Product) => product._id !== currentProductId && product.id !== currentProductId
        );
        
        // Shuffle and take 6 products
        const shuffled = filteredProducts.sort(() => 0.5 - Math.random());
        this.relatedProducts = shuffled.slice(0, 6);
        
        console.log('Final random related products:', this.relatedProducts.length);
      },
      error: (error) => {
        this.isLoadingRelatedProducts = false;
        console.error('Error loading all products:', error);
      }
    });
  }

  get isInWishlist(): boolean {
    return this.product && this.product._id ? this.wishlistService.isInWishlist(this.product._id) : false;
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product && this.product.stock) {
      this.cartService.addToCart(this.product, this.quantity);
      // Show success message or redirect to cart
    }
  }

  toggleWishlist(): void {
    if (this.product && this.product._id) {
      if (this.isInWishlist) {
        this.wishlistService.removeFromWishlist(this.product._id);
      } else {
        this.wishlistService.addToWishlist(this.product);
      }
    }
  }

  getSpecifications(): { key: string; value: string }[] {
    if (!this.product?.specifications) return [];
    return Object.entries(this.product.specifications).map(([key, value]) => ({
      key,
      value
    }));
  }

  // Lightbox Methods
  openLightbox(image: string): void {
    this.lightboxImage = image;
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.showLightbox = false;
    document.body.style.overflow = '';
  }

  nextImage(): void {
    if (!this.product?.images) return;
    const currentIndex = this.getCurrentImageIndex();
    const nextIndex = (currentIndex + 1) % this.product.images.length;
    this.lightboxImage = this.product.images[nextIndex];
    this.selectedImage = this.product.images[nextIndex];
  }

  previousImage(): void {
    if (!this.product?.images) return;
    const currentIndex = this.getCurrentImageIndex();
    const prevIndex = currentIndex === 0 ? this.product.images.length - 1 : currentIndex - 1;
    this.lightboxImage = this.product.images[prevIndex];
    this.selectedImage = this.product.images[prevIndex];
  }

  getCurrentImageIndex(): number {
    if (!this.product?.images) return 0;
    return this.product.images.findIndex(img => img === this.lightboxImage);
  }

  // Price and Discount Methods
  hasDiscount(): boolean {
    return !!(this.product?.discount && this.product.discount > 0) || 
           !!(this.product?.priceAfterDiscount && this.product.priceAfterDiscount < this.product.price) ||
           !!(this.product?.isOnSale);
  }

  getCurrentPrice(): number {
    if (!this.product) return 0;
    
    if (this.product.priceAfterDiscount && this.product.priceAfterDiscount > 0) {
      return this.product.priceAfterDiscount;
    }
    
    if (this.product.discount && this.product.discount > 0) {
      return Math.max(0, this.product.price - this.product.discount);
    }
    
    return this.product.price;
  }

  getDiscountAmount(): number {
    if (!this.product) return 0;
    
    if (this.product.discount && this.product.discount > 0) {
      return this.product.discount;
    }
    
    if (this.product.priceAfterDiscount && this.product.priceAfterDiscount > 0) {
      return this.product.price - this.product.priceAfterDiscount;
    }
    
    return 0;
  }

  calculateDiscountPercentage(): number {
    if (!this.hasDiscount() || !this.product) return 0;
    
    const originalPrice = this.product.price;
    const discountAmount = this.getDiscountAmount();
    
    if (originalPrice > 0) {
      return Math.round((discountAmount / originalPrice) * 100);
    }
    
    return 0;
  }

  // Helper method for related products discount percentage
  calculateRelatedProductDiscountPercentage(product: Product): number {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0;
    
    const originalPrice = product.originalPrice;
    const currentPrice = product.priceAfterDiscount || product.price;
    
    if (originalPrice > 0) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    
    return 0;
  }

  // Slider navigation methods
  scrollSlider(direction: 'left' | 'right'): void {
    if (!this.relatedProductsSlider) return;
    
    const element = this.relatedProductsSlider.nativeElement;
    const scrollAmount = 280; // Width of one product card + gap
    
    if (direction === 'left') {
      element.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
} 