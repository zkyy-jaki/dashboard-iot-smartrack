/**
 * ============================================================================
 * INDUSTRIAL IOT API SERVICE LAYER
 * ============================================================================
 * Menyediakan metode komunikasi HTTP REST untuk berinteraksi dengan
 * backend Express + SQLite / Prisma.
 */

import { ApiEndpointContract, StockCalculationResult, Product, RackRow, InventoryHistory, BuzzerCommand } from '../types';
import { calculateRowStock } from '../utils/stockCalculator';
import { APP_CONFIG } from '../config';

export const IoTApiService = {
  baseUrl: `${APP_CONFIG.NETWORK.BACKEND_URL}/api/v1`,
  wsEndpoint: APP_CONFIG.NETWORK.BACKEND_URL.replace(/^http/, 'ws'),

  /**
   * Kontrak dokumentasi endpoint API untuk ditampilkan di halaman Pengaturan
   */
  getEndpointsContract(): ApiEndpointContract[] {
    return [
      { method: 'GET', path: '/api/v1/racks/RACK-001/overview', desc: 'Ambil status lengkap rak, hitungan stok baris & telemetri lingkungan' },
      { method: 'PATCH', path: '/api/v1/racks/RACK-001/rows/:rowId', desc: 'Perbarui panjang baris, kapasitas, atau penetapan SKU' },
      { method: 'GET', path: '/api/v1/products', desc: 'Daftar kardus produk terdaftar dan dimensi aksialnya' },
      { method: 'POST', path: '/api/v1/products', desc: 'Daftarkan SKU baru dengan panjang aksial L_box (cm)' },
      { method: 'GET', path: '/api/v1/inventory/history', desc: 'Lihat riwayat pergerakan stok (Stock In / Stock Out)' },
      { method: 'POST', path: '/api/v1/control/buzzer', desc: 'Kirim perintah kontrol buzzer ke ESP32 (MUTE / ON / OFF / AUTO)' },
      { method: 'GET', path: '/api/v1/ota/status', desc: 'Cek riwayat & status proses update firmware OTA (DOWNLOADING -> BURNING -> SUCCESS)' },
      { method: 'POST', path: '/api/v1/ota/trigger', desc: 'Trigger update firmware OTA Over-The-Air ke ESP32' },
      { method: 'POST', path: '/api/v1/racks/:rackId/actuators', desc: 'Override manual indikator lampu LED RGB dan alarm buzzer' }
    ];
  },

  /**
   * Mengambil data overview rak terbaru dari backend
   */
  async getRackOverview(rackId: string = APP_CONFIG.RACK.DEFAULT_RACK_ID): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/racks/${rackId}/overview`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[IoTApiService] Gagal fetch overview rak (${rackId}), menggunakan fallback data lokal.`, err);
      return null;
    }
  },

  /**
   * Mengambil daftar master produk kardus
   */
  async getProducts(): Promise<Product[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/products`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      console.warn('[IoTApiService] Gagal fetch produk dari API, menggunakan fallback lokal.', err);
      return null;
    }
  },

  /**
   * Menyimpan produk baru ke backend database
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      const res = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[IoTApiService] Gagal menyimpan produk:', err);
      return null;
    }
  },

  /**
   * Memperbarui data produk yang ada
   */
  async updateProduct(sku: string, product: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(sku)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      console.error(`[IoTApiService] Gagal update produk ${sku}:`, err);
      return null;
    }
  },

  /**
   * Menghapus produk terdaftar berdasarkan SKU
   */
  async deleteProduct(sku: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(sku)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error(`[IoTApiService] Gagal hapus produk ${sku}:`, err);
      return false;
    }
  },

  /**
   * Mengambil daftar status seluruh node sensor fisik dari SQLite
   */
  async getSensors(): Promise<any[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/sensors`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      console.warn('[IoTApiService] Gagal fetch sensors dari API.', err);
      return null;
    }
  },

  /**
   * Mengambil riwayat alert sensor yang melewati ambang batas
   */
  async getSensorAlerts(limit: number = 20): Promise<any[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/sensors/alerts?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      console.warn('[IoTApiService] Gagal fetch sensor alerts dari API.', err);
      return null;
    }
  },

  /**
   * Memperbarui konfigurasi dimensi baris rak atau penetapan SKU
   */
  async updateRowConfig(
    rackId: string,
    rowId: string,
    payload: Partial<RackRow>
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/racks/${rackId}/rows/${encodeURIComponent(rowId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.error(`[IoTApiService] Gagal update baris ${rowId}:`, err);
      return false;
    }
  },

  /**
   * Mengambil riwayat mutasi stok
   */
  async getInventoryHistory(limit: number = 50): Promise<InventoryHistory[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/inventory/history?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch (err) {
      console.warn('[IoTApiService] Gagal fetch riwayat inventaris.', err);
      return null;
    }
  },

  /**
   * Mengirim perintah kontrol buzzer ke hardware via MQTT (MUTE, ON, OFF, AUTO)
   * POST /api/control/buzzer
   */
  async sendBuzzerCommand(command: BuzzerCommand): Promise<boolean> {
    try {
      // Coba endpoint standar /api/control/buzzer
      let res = await fetch(`${APP_CONFIG.NETWORK.BACKEND_URL}/api/control/buzzer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      // Fallback jika baseUrl /api/v1 digunakan
      if (!res.ok && res.status === 404) {
        res = await fetch(`${this.baseUrl}/control/buzzer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        });
      }

      return res.ok;
    } catch (err) {
      console.error(`[IoTApiService] Gagal kirim perintah buzzer ${command}:`, err);
      return false;
    }
  },

  /**
   * Alias kompatibilitas untuk sendBuzzerCommand
   */
  async sendBuzzerControl(command: BuzzerCommand): Promise<boolean> {
    return this.sendBuzzerCommand(command);
  },

  /**
   * Mengirim perintah aktuator manual (LED RGB & Buzzer) ke ESP32
   */
  async sendActuatorOverride(
    rackId: string,
    ledState: string,
    buzzerActive: boolean
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/racks/${rackId}/actuators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledState, buzzerActive })
      });
      return res.ok;
    } catch (err) {
      console.error('[IoTApiService] Gagal kirim perintah aktuator:', err);
      return false;
    }
  },

  /**
   * Mengambil status OTA firmware update ESP32 terbaru
   */
  async getOtaStatus(): Promise<{ success: boolean; ota: any; firmwareVersion: string } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/ota/status`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[IoTApiService] Gagal fetch status OTA:', err);
      return null;
    }
  },

  /**
   * Mengirim sinyal trigger update OTA firmware ke ESP32
   */
  async triggerOtaUpdate(payload: any = 'TRIGGER_OTA'): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/ota/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error('[IoTApiService] Gagal kirim trigger OTA:', err);
      return false;
    }
  },

  /**
   * Helper fungsi kalkulasi stok baris rak
   */
  calculateRowStock(
    rowSpanCm: number,
    leftDistCm: number,
    rightDistCm: number,
    boxLengthCm: number,
    maxCapacity: number,
    sensorsOnline: boolean = true
  ): StockCalculationResult {
    return calculateRowStock(rowSpanCm, leftDistCm, rightDistCm, boxLengthCm, maxCapacity, sensorsOnline);
  }
};

export default IoTApiService;
