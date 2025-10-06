import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.scss']
})
export class TrackOrderComponent implements OnInit {
  searchOrderId: string = '';
  order: any = null;
  searched: boolean = false;
  userOrders: any[] = [];
  trackingSteps: any[] = [];

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  ngOnInit(): void {
    // Check for orderId in query params
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.searchOrderId = params['orderId'];
        this.loadUserOrdersAndSearch();
      } else {
        this.loadUserOrders();
      }
    });
  }

  loadUserOrders(): void {
    this.orderService.getUserOrders().subscribe(res => {
      if (res && res.success && res.data) {
        this.userOrders = res.data;
      }
    });
  }

  loadUserOrdersAndSearch(): void {
    this.orderService.getUserOrders().subscribe(res => {
      if (res && res.success && res.data) {
        this.userOrders = res.data;
        this.searchOrder();
      }
    });
  }

  selectOrder(orderData: any): void {
    this.mapOrderData(orderData);
  }

  backToList(): void {
    this.order = null;
    this.trackingSteps = [];
    this.searchOrderId = '';
    this.searched = false;
  }

  refreshOrderStatus(): void {
    if (!this.order || !this.order.id) return;
    
    // Reload user orders from API
    this.orderService.getUserOrders().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.userOrders = res.data;
          
          // Find and update the current order
          const updatedOrder = this.userOrders.find(o => o.orderNumber === this.order!.id);
          
          if (updatedOrder) {
            this.mapOrderData(updatedOrder);
          }
        }
      },
      error: (error) => {
        console.error('Error refreshing order status:', error);
      }
    });
  }

  searchOrder(): void {
    if (!this.searchOrderId) return;

    this.searched = true;
    
    // Search for the order in the user orders
    const foundOrder = this.userOrders.find(o => o.orderNumber === this.searchOrderId);
    
    if (foundOrder) {
      this.mapOrderData(foundOrder);
    } else {
      this.order = null;
      this.trackingSteps = [];
    }
  }

  private mapOrderData(foundOrder: any): void {
    this.order = {
      id: foundOrder.orderNumber,
      orderDate: new Date(foundOrder.createdAt),
      totalAmount: foundOrder.totalAmount,
      status: foundOrder.status,
      deliveryAddress: `${foundOrder.customerInfo?.address?.street || ''}, ${foundOrder.customerInfo?.address?.city || ''}`,
      paymentMethod: 'cash', // Default for now as API doesn't provide this
      trackingNumber: foundOrder.orderNumber,
      deliveryDate: foundOrder.updatedAt ? new Date(foundOrder.updatedAt) : null,
      deliveryFee: foundOrder.deliveryFee,
      subtotal: foundOrder.subtotal,
      discountAmount: foundOrder.discountAmount,
      discountCode: foundOrder.discountCode,
      customerInfo: foundOrder.customerInfo,
      items: foundOrder.items.map((item: any) => ({
        product: {
          name: item.product.name,
          brand: item.product.brand || 'غير محدد',
          price: item.product.price,
          image: item.product.images && item.product.images.length > 0 
            ? item.product.images[0] 
            : 'assets/images/placeholder.jpg'
        },
        quantity: item.quantity,
        notes: item.notes
      }))
    };
    
    // Generate tracking steps based on order status and dates
    this.generateTrackingSteps(foundOrder);
  }

  generateTrackingSteps(order: any): void {
    const createdAt = new Date(order.createdAt);
    const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
    const status = order.status;

    // Define all possible steps
    const allSteps = [
      {
        title: 'تم استلام الطلب',
        description: 'تم استلام طلبك بنجاح',
        status: 'pending'
      },
      {
        title: 'تم تأكيد الطلب',
        description: 'تم مراجعة وتأكيد طلبك',
        status: 'confirmed'
      },
      {
        title: 'جاري التحضير',
        description: 'جاري تحضير طلبك للتوصيل',
        status: 'processing'
      },
      {
        title: 'تم الشحن',
        description: 'تم شحن طلبك وهو في الطريق إليك',
        status: 'shipped'
      },
      {
        title: 'تم التوصيل',
        description: 'تم توصيل طلبك بنجاح',
        status: 'delivered'
      }
    ];

    // Determine which steps are completed based on current status
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(status);

    this.trackingSteps = allSteps.map((step, index) => ({
      title: step.title,
      description: step.description,
      completed: index <= currentStatusIndex,
      date: index === 0 ? createdAt : (index === currentStatusIndex && updatedAt ? updatedAt : (index < currentStatusIndex ? createdAt : null))
    }));
  }

  getStatusClass(status: string): string {
    return this.orderService.getOrderStatusColor(status);
  }

  getStatusText(status: string): string {
    return this.orderService.getOrderStatusText(status);
  }

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'الدفع عند الاستلام';
      default: return method;
    }
  }

  formatArabicDate(dateString: string): string {
    const date = new Date(dateString);
    
    // Arabic months
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    // Arabic days
    const arabicDays = [
      'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];
    
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    const dayName = arabicDays[date.getDay()];
    
    // Format time
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${dayName}, ${day} ${month} ${year} - ${hours}:${minutesStr} ${ampm}`;
  }
} 