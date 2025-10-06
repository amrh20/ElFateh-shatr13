import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AddressService, Address } from '../../services/address.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  isLoading: boolean = false;
  isEditMode: boolean = false;
  isPasswordLoading: boolean = false;
  activeTab: string = 'profile';

  user: User = {
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'user'
  };

  editFullName: string = '';
  editUsername: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Addresses Management
  addresses: Address[] = [];
  isAddressLoading: boolean = false;
  showAddressModal: boolean = false;
  isEditingAddress: boolean = false;
  currentAddress: Address = {
    phone: '',
    address: {
      street: '',
      city: ''
    }
  };

  constructor(
    private authService: AuthService, 
    private notifications: NotificationService,
    private addressService: AddressService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
  }

  loadProfile(): void {
    this.authService.getMyProfile().subscribe(user => {
      if (user) {
        this.user = { ...this.user, ...user };
        this.editFullName = this.user.name || '';
        this.editUsername = this.user.email || this.user.phone || '';
      }
    });
  }

  toggleEdit(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.editFullName = this.user.name || '';
      this.editUsername = this.user.email || this.user.phone || '';
    }
  }

  saveProfile(): void {
    this.isLoading = true;
    this.authService.updateMyProfile({
      username: this.editUsername || undefined,
      fullName: this.editFullName || undefined
    }).subscribe(success => {
      this.isLoading = false;
      if (success) {
        this.isEditMode = false;
        this.loadProfile();
        this.notifications.showSuccess('تم تحديث المعلومات بنجاح!', { duration: 3000 });
      } else {
        this.notifications.showError('حدث خطأ أثناء تحديث المعلومات!');
      }
    });
  }

  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.notifications.showError('كلمتا المرور غير متطابقتان!');
      return;
    }

    if (this.newPassword.length < 6) {
      this.notifications.showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل!');
      return;
    }

    this.isPasswordLoading = true;
    this.authService.updateMyProfile({
      password: this.newPassword
    }).subscribe(success => {
      this.isPasswordLoading = false;
      if (success) {
        this.newPassword = '';
        this.confirmPassword = '';
        this.notifications.showSuccess('تم تغيير كلمة المرور بنجاح!', { duration: 3000 });
      } else {
        this.notifications.showError('حدث خطأ أثناء تغيير كلمة المرور!');
      }
    });
  }

  // Address CRUD Operations
  loadAddresses(): void {
    this.isAddressLoading = true;
    this.addressService.getUserAddresses().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.addresses = res.data;
        }
        this.isAddressLoading = false;
      },
      error: () => {
        this.isAddressLoading = false;
        this.notifications.showError('حدث خطأ أثناء تحميل العناوين!');
      }
    });
  }

  openAddAddressModal(): void {
    this.isEditingAddress = false;
    this.currentAddress = {
      phone: '',
      address: {
        street: '',
        city: ''
      }
    };
    this.showAddressModal = true;
  }

  openEditAddressModal(address: Address): void {
    this.isEditingAddress = true;
    this.currentAddress = { ...address };
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.currentAddress = {
      phone: '',
      address: {
        street: '',
        city: ''
      }
    };
  }

  saveAddress(): void {
    if (!this.currentAddress.phone || !this.currentAddress.address.street || !this.currentAddress.address.city) {
      this.notifications.showError('يرجى ملء جميع الحقول!');
      return;
    }

    this.isAddressLoading = true;

    if (this.isEditingAddress && this.currentAddress._id) {
      // Update existing address
      this.addressService.updateAddress(this.currentAddress._id, this.currentAddress).subscribe({
        next: (res) => {
          this.isAddressLoading = false;
          if (res && res.success) {
            this.notifications.showSuccess('تم تحديث العنوان بنجاح!');
            this.loadAddresses();
            this.closeAddressModal();
          } else {
            this.notifications.showError('حدث خطأ أثناء تحديث العنوان!');
          }
        },
        error: () => {
          this.isAddressLoading = false;
          this.notifications.showError('حدث خطأ أثناء تحديث العنوان!');
        }
      });
    } else {
      // Create new address
      this.addressService.createAddress(this.currentAddress).subscribe({
        next: (res) => {
          this.isAddressLoading = false;
          if (res && res.success) {
            this.notifications.showSuccess('تم إضافة العنوان بنجاح!');
            this.loadAddresses();
            this.closeAddressModal();
          } else {
            this.notifications.showError('حدث خطأ أثناء إضافة العنوان!');
          }
        },
        error: () => {
          this.isAddressLoading = false;
          this.notifications.showError('حدث خطأ أثناء إضافة العنوان!');
        }
      });
    }
  }

  deleteAddress(addressId: string): void {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) {
      return;
    }

    this.isAddressLoading = true;
    this.addressService.deleteAddress(addressId).subscribe({
      next: (res) => {
        this.isAddressLoading = false;
        if (res && res.success) {
          this.notifications.showSuccess('تم حذف العنوان بنجاح!');
          this.loadAddresses();
        } else {
          this.notifications.showError('حدث خطأ أثناء حذف العنوان!');
        }
      },
      error: () => {
        this.isAddressLoading = false;
        this.notifications.showError('حدث خطأ أثناء حذف العنوان!');
      }
    });
  }
}


