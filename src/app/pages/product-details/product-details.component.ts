import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
    this.productService.getProductById(productId).subscribe(product => {
      this.product = product;
      if (product && product.images && product.images.length > 0) {
        this.selectedImage = product?.images[0];
      }
      
      console.log('Loaded product:', product);
      console.log('Product subcategory:', product?.subCategory);
      
      // Load related products - try multiple approaches
      if (product) {
        // Try different subcategory fields
        const subcategoryId = product.subCategory || 
                             product.subcategory?._id || 
                             product.subcategory || 
                             product.category;
        
        console.log('Product fields:', {
          subCategory: product.subCategory,
          subcategory: product.subcategory,
          category: product.category,
          finalSubcategoryId: subcategoryId
        });
        
        if (subcategoryId) {
          console.log('Loading related products with subcategory:', subcategoryId);
          this.loadRelatedProducts(subcategoryId, productId);
        } else {
          console.log('No subcategory found, loading all products as fallback');
          // Load all products as fallback
          this.loadAllProductsAsRelated(productId);
        }
      }
    });
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