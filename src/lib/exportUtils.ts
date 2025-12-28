import * as XLSX from 'xlsx';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (data: any[], filename: string, sheetName = 'Sheet1') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidths: { [key: string]: number } = {};
  const headers = Object.keys(data[0]);
  
  headers.forEach(header => {
    maxWidths[header] = header.length;
    data.forEach(row => {
      const value = String(row[header] || '');
      if (value.length > maxWidths[header]) {
        maxWidths[header] = Math.min(value.length, 50);
      }
    });
  });
  
  worksheet['!cols'] = headers.map(h => ({ wch: maxWidths[h] + 2 }));
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Format data for user export
export const formatUsersForExport = (users: any[]) => {
  return users.map(user => ({
    'Email': user.email,
    'Họ tên': user.full_name || '',
    'Số điện thoại': user.phone || '',
    'Số dư': user.balance,
    'Tổng chi tiêu': user.total_spent,
    'VIP': user.vip_levels?.name || 'Member',
    'Trạng thái': user.is_banned ? 'Đã khóa' : 'Hoạt động',
    'Ngày tạo': new Date(user.created_at).toLocaleString('vi-VN'),
  }));
};

// Format data for order export
export const formatOrdersForExport = (orders: any[]) => {
  return orders.map(order => ({
    'Mã đơn': order.order_number,
    'Email khách': order.customer_email,
    'Tên khách': order.customer_name || '',
    'SĐT': order.customer_phone || '',
    'Tổng tiền': order.total_amount,
    'Giảm giá': order.discount_amount,
    'Trạng thái': getStatusLabel(order.status),
    'Mã voucher': order.voucher_code || '',
    'Mã giới thiệu': order.referral_code || '',
    'Ngày tạo': new Date(order.created_at).toLocaleString('vi-VN'),
  }));
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'DRAFT': 'Nháp',
    'PENDING_PAYMENT': 'Chờ thanh toán',
    'PAID': 'Đã thanh toán',
    'PROCESSING': 'Đang xử lý',
    'WAITING_DELIVERY': 'Chờ giao hàng',
    'DELIVERED': 'Đã giao',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    'REFUNDED': 'Đã hoàn tiền',
    'PAYMENT_FAILED': 'TT thất bại',
    'EXPIRED': 'Hết hạn',
  };
  return labels[status] || status;
};
