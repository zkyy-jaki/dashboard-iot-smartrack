import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  X
} from 'lucide-react';
import {
  INITIAL_PRODUCTS,
  INITIAL_ROWS,
  INITIAL_SENSORS,
  INITIAL_HISTORY,
  INITIAL_ENV_HISTORY,
  INITIAL_GAS_ALERTS
} from './data/initialData';
import { APP_CONFIG } from './config';
import { Product, RackRow, Sensor, InventoryHistory, EnvHistoryPoint, GasAlert, EnvData, SystemConfig, EnrichedRow, TelemetryPayload } from './types';
import { calculateRowStock } from './utils/stockCalculator';
import { connectSocket } from './services/socketService';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import OverviewPage from './pages/OverviewPage';
import RackMonitoringPage from './pages/RackMonitoringPage';
import ProductManagementPage from './pages/ProductManagementPage';
import InventoryHistoryPage from './pages/InventoryHistoryPage';
import SensorMonitoringPage from './pages/SensorMonitoringPage';
import SettingsPage from './pages/SettingsPage';
import RackInstructionTutorial from './components/tutorial/RackInstructionTutorial';
import { useWarehouseSocket } from './hooks/useWarehouseSocket';
import { IoTApiService } from './services/iotApiService';

export default function App() {
  // Navigation & UI State
  const [activePage, setActivePage] = useState('overview');
  const [selectedRowId, setSelectedRowId] = useState('Row 01');
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString('id-ID'));
  const [systemNotification, setSystemNotification] = useState<{ msg: string; type: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Domain State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [rows, setRows] = useState<RackRow[]>(INITIAL_ROWS);
  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>(INITIAL_HISTORY);
  const [envHistory, setEnvHistory] = useState<EnvHistoryPoint[]>(INITIAL_ENV_HISTORY);
  const [gasAlerts, setGasAlerts] = useState<GasAlert[]>(INITIAL_GAS_ALERTS);

  // Environmental Telemetry State (Terikat ke APP_CONFIG)
  const [envData, setEnvData] = useState<EnvData>({
    temperatureC: APP_CONFIG.THRESHOLDS.DEFAULT_TEMP_C,
    humidityRh: APP_CONFIG.THRESHOLDS.DEFAULT_HUMIDITY_RH,
    gasPpm: APP_CONFIG.THRESHOLDS.DEFAULT_GAS_PPM,
    gasWarningThreshold: APP_CONFIG.THRESHOLDS.GAS_WARNING_PPM,
    gasDangerThreshold: APP_CONFIG.THRESHOLDS.GAS_DANGER_PPM
  });

  // System Settings State (Terikat ke APP_CONFIG)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    rackId: APP_CONFIG.RACK.DEFAULT_RACK_ID,
    controllerId: APP_CONFIG.RACK.DEFAULT_CONTROLLER_ID,
    mqttBroker: APP_CONFIG.NETWORK.DEFAULT_MQTT_BROKER,
    pollingIntervalMs: APP_CONFIG.NETWORK.DEFAULT_POLLING_INTERVAL_MS,
    tempCompensation: true,
    emailAlerts: true,
    webhookAlerts: false
  });

  // Edge Computing Telemetry Payload State (ESP32 Live Contract via useWarehouseSocket)
  const {
    telemetry: telemetryPayload,
    setTelemetry: setTelemetryPayload,
    isConnected: backendConnected,
    mqttStatus,
    otaStatus,
    firmwareVersion,
    lastUpdated: liveLastUpdated,
    sendBuzzerCommand,
  } = useWarehouseSocket();

  const activeBroker = mqttStatus?.brokerUrl || systemConfig.mqttBroker || APP_CONFIG.NETWORK.DEFAULT_MQTT_BROKER;
  const isMqttConnected = mqttStatus?.connected ?? backendConnected;
  const isTelemetryLive = Boolean(telemetryPayload);

  // Helper to show brief non-intrusive toast banner
  const triggerToast = useCallback((msg: string, type: 'info' | 'danger' = 'info') => {
    setSystemNotification({ msg, type });
    setTimeout(() => {
      setSystemNotification((prev) => (prev?.msg === msg ? null : prev));
    }, 4000);
  }, []);

  // Format current timestamp
  const getFormattedTimestamp = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  // Load master data dinamis dari Backend REST API (SQLite via Prisma)
  const refreshBackendData = useCallback(async () => {
    try {
      const [fetchedProducts, fetchedHistory, fetchedSensors, fetchedAlerts] = await Promise.all([
        IoTApiService.getProducts(),
        IoTApiService.getInventoryHistory(100),
        IoTApiService.getSensors(),
        IoTApiService.getSensorAlerts(20),
      ]);

      if (fetchedProducts && fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      }
      if (fetchedHistory && Array.isArray(fetchedHistory)) {
        setInventoryHistory(fetchedHistory);
      }
      if (fetchedSensors && fetchedSensors.length > 0) {
        setSensors(fetchedSensors);
      }
      if (fetchedAlerts && Array.isArray(fetchedAlerts) && fetchedAlerts.length > 0) {
        const formattedAlerts: GasAlert[] = fetchedAlerts.map((a: any, idx: number) => {
          let timeFormatted = a.timestamp;
          try {
            const d = new Date(a.timestamp);
            if (!isNaN(d.getTime())) {
              const pad = (n: number) => String(n).padStart(2, '0');
              timeFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            }
          } catch {}
          return {
            id: a.id || `GA-${idx + 1}`,
            timestamp: timeFormatted,
            readingPpm: a.readingPpm ?? a.gasPpm ?? 0,
            status: a.status || 'Normal',
            message: a.message || `Telemetri gas tercatat pada ${a.readingPpm ?? 0} ADC.`,
          };
        });
        setGasAlerts(formattedAlerts);
      }
    } catch (err) {
      console.warn('[App] Gagal memuat data awal dari backend:', err);
    }
  }, []);

  // Fetch data saat aplikasi pertama kali dimuat
  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  // Refresh riwayat stok saat paket telemetri baru diterima dari ESP32 (karena bisa jadi ada kardus masuk/keluar)
  useEffect(() => {
    if (!telemetryPayload) return;
    IoTApiService.getInventoryHistory(100).then((history) => {
      if (history && Array.isArray(history)) {
        setInventoryHistory(history);
      }
    });
  }, [telemetryPayload?.summary?.total_items]);

  // Sinkronisasi data lingkungan dan jarak rak saat paket telemetri baru diterima
  useEffect(() => {
    if (!telemetryPayload) return;

    if (telemetryPayload.environment) {
      const curTemp = Number((telemetryPayload.environment.temperature_c ?? envData.temperatureC).toFixed(1));
      const curHum = Number((telemetryPayload.environment.humidity_pct ?? envData.humidityRh).toFixed(1));
      const curGas = Number(telemetryPayload.environment.gas_raw ?? envData.gasPpm);

      setEnvData((prev) => ({
        ...prev,
        temperatureC: curTemp,
        humidityRh: curHum,
        gasPpm: curGas,
      }));

      // Stream data titik baru ke riwayat grafik lingkungan real-time
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      setEnvHistory((prev) => {
        const isStaticInitial = prev.length > 0 && prev[0].time.startsWith('14:');
        if (isStaticInitial) {
          const initPoints: EnvHistoryPoint[] = [];
          for (let i = 7; i >= 1; i--) {
            const past = new Date(now.getTime() - i * 2500);
            initPoints.push({
              time: `${pad(past.getHours())}:${pad(past.getMinutes())}:${pad(past.getSeconds())}`,
              temp: curTemp,
              humidity: curHum,
              gasPpm: curGas,
            });
          }
          initPoints.push({
            time: timeStr,
            temp: curTemp,
            humidity: curHum,
            gasPpm: curGas,
          });
          return initPoints;
        }

        if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            time: timeStr,
            temp: curTemp,
            humidity: curHum,
            gasPpm: curGas,
          };
          return updated;
        }

        const next = [
          ...prev,
          {
            time: timeStr,
            temp: curTemp,
            humidity: curHum,
            gasPpm: curGas,
          },
        ];

        return next.length > 10 ? next.slice(next.length - 10) : next;
      });

      // Auto-catat peringatan gas jika ambang batas terlampaui secara real-time
      if (curGas >= envData.gasWarningThreshold || telemetryPayload.environment?.hazard_detected) {
        const alertStatus: 'Normal' | 'Warning' | 'Danger' =
          curGas >= envData.gasDangerThreshold || telemetryPayload.environment?.hazard_detected ? 'Danger' : 'Warning';
        const alertMsg =
          alertStatus === 'Danger'
            ? `Peringatan BAHAYA kebocoran gas: ${curGas} ADC (≥ ambang bahaya ${envData.gasDangerThreshold})!`
            : `Peringatan WASPADA konsentrasi gas naik: ${curGas} ADC (≥ ambang waspada ${envData.gasWarningThreshold}).`;

        setGasAlerts((prevAlerts) => {
          if (prevAlerts.length > 0 && prevAlerts[0].status === alertStatus && Math.abs(prevAlerts[0].readingPpm - curGas) < 20) {
            return prevAlerts;
          }
          const autoAlert: GasAlert = {
            id: `GA-${Date.now().toString().slice(-4)}`,
            timestamp: getFormattedTimestamp(),
            readingPpm: curGas,
            status: alertStatus,
            message: alertMsg,
          };
          return [autoAlert, ...prevAlerts.slice(0, 19)];
        });
      }
    }

    if (telemetryPayload.floors && telemetryPayload.floors.length > 0) {
      setRows((prevRows) =>
        prevRows.map((r, idx) => {
          const floor = telemetryPayload.floors.find((f) => f.floor === r.rowNumber) || telemetryPayload.floors[idx];
          if (!floor) return r;
          return {
            ...r,
            leftDistanceCm: floor.distance_left_cm,
            rightDistanceCm: floor.distance_right_cm,
            lastUpdated: telemetryPayload.timestamp || new Date().toISOString(),
          };
        })
      );
    }

    if (liveLastUpdated) {
      setLastSyncTime(liveLastUpdated);
      setSensors((prev) =>
        prev.map((s) => ({
          ...s,
          online: true,
          lastSeen: liveLastUpdated
        }))
      );
    }
  }, [telemetryPayload, liveLastUpdated]);

  // Pulse per 3 detik agar grafik lingkungan terus mengalir secara real-time
  useEffect(() => {
    const timer = setInterval(() => {
      const curTemp = Number((telemetryPayload?.environment?.temperature_c ?? envData.temperatureC).toFixed(1));
      const curHum = Number((telemetryPayload?.environment?.humidity_pct ?? envData.humidityRh).toFixed(1));
      const curGas = Number(telemetryPayload?.environment?.gas_raw ?? envData.gasPpm);

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      setEnvHistory((prev) => {
        const isStaticInitial = prev.length > 0 && prev[0].time.startsWith('14:');
        if (isStaticInitial) {
          const initPoints: EnvHistoryPoint[] = [];
          for (let i = 7; i >= 1; i--) {
            const past = new Date(now.getTime() - i * 3000);
            initPoints.push({
              time: `${pad(past.getHours())}:${pad(past.getMinutes())}:${pad(past.getSeconds())}`,
              temp: curTemp,
              humidity: curHum,
              gasPpm: curGas,
            });
          }
          initPoints.push({
            time: timeStr,
            temp: curTemp,
            humidity: curHum,
            gasPpm: curGas,
          });
          return initPoints;
        }

        if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
          return prev;
        }

        const next = [
          ...prev,
          {
            time: timeStr,
            temp: curTemp,
            humidity: curHum,
            gasPpm: curGas,
          },
        ];

        return next.length > 10 ? next.slice(next.length - 10) : next;
      });

      // Auto-catat peringatan gas jika ambang batas terlampaui secara real-time
      if (curGas >= envData.gasWarningThreshold || telemetryPayload.environment?.hazard_detected) {
        const alertStatus: 'Normal' | 'Warning' | 'Danger' =
          curGas >= envData.gasDangerThreshold || telemetryPayload.environment?.hazard_detected ? 'Danger' : 'Warning';
        const alertMsg =
          alertStatus === 'Danger'
            ? `Peringatan BAHAYA kebocoran gas: ${curGas} ADC (≥ ambang bahaya ${envData.gasDangerThreshold})!`
            : `Peringatan WASPADA konsentrasi gas naik: ${curGas} ADC (≥ ambang waspada ${envData.gasWarningThreshold}).`;

        setGasAlerts((prevAlerts) => {
          if (prevAlerts.length > 0 && prevAlerts[0].status === alertStatus && Math.abs(prevAlerts[0].readingPpm - curGas) < 20) {
            return prevAlerts;
          }
          const autoAlert: GasAlert = {
            id: `GA-${Date.now().toString().slice(-4)}`,
            timestamp: getFormattedTimestamp(),
            readingPpm: curGas,
            status: alertStatus,
            message: alertMsg,
          };
          return [autoAlert, ...prevAlerts.slice(0, 19)];
        });
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [telemetryPayload, envData.temperatureC, envData.humidityRh, envData.gasPpm]);

  // Compute enriched rows langsung dari data Edge Computing ESP32 (Hapus kalkulasi browser)
  const enrichedRows: EnrichedRow[] = useMemo(() => {
    return rows.map((row, idx) => {
      const product = products.find((p) => p.sku === row.sku) || {
        id: `unassigned-${row.sku}`,
        name: 'Unassigned SKU',
        sku: row.sku,
        lengthCm: 20,
        widthCm: 15,
        heightCm: 15,
        description: 'Auto fallback product'
      };
      const leftSensor = sensors.find((s) => s.id === row.leftSensorId || (s as any).sensorId === row.leftSensorId);
      const rightSensor = sensors.find((s) => s.id === row.rightSensorId || (s as any).sensorId === row.rightSensorId);
      const sensorsOnline = Boolean((leftSensor?.online ?? true) && (rightSensor?.online ?? true));

      // Ambil nilai yang sudah dihitung langsung oleh ESP32 / Backend
      const floor = telemetryPayload?.floors?.find((f) => f.floor === row.rowNumber) || telemetryPayload?.floors?.[idx];

      const capacity = 4; // Kapasitas fisik ambalan tetap 4 kardus (58 cm / 14.5 cm)
      const leftDetected = floor ? floor.distance_left_cm > 0 && floor.distance_left_cm < 18.0 : false;
      const rightDetected = floor ? floor.distance_right_cm > 0 && floor.distance_right_cm < 18.0 : false;

      const isFull = floor?.status === 'FULL' || floor?.led_color === 'GREEN' || (leftDetected && rightDetected);
      const isEmpty = floor?.status === 'EMPTY' || floor?.led_color === 'RED' || (!leftDetected && !rightDetected && (!floor || floor.item_count === 0));

      const estimatedStock = isFull ? capacity : isEmpty ? 0 : floor ? floor.item_count : 0;
      const occupiedSpan = floor ? floor.occupied_span_cm : 0;
      const occupancyPct = Math.min(100, Math.round((estimatedStock / capacity) * 100));
      const rawEstimated = product.lengthCm > 0 ? Number((occupiedSpan / product.lengthCm).toFixed(2)) : estimatedStock;
      const status: 'IN STOCK' | 'EMPTY' | 'LOW STOCK' | 'FULL CAPACITY' | 'SENSOR FAULT' =
        !sensorsOnline
          ? 'SENSOR FAULT'
          : isFull
          ? 'FULL CAPACITY'
          : isEmpty
          ? 'EMPTY'
          : 'IN STOCK';

      const led_color = floor?.led_color || (isFull ? 'GREEN' : isEmpty ? 'RED' : 'BLUE');

      return {
        ...row,
        capacity,
        product,
        leftSensor,
        rightSensor,
        sensorsOnline,
        occupiedSpan,
        rawEstimated,
        estimatedStock,
        occupancyPct,
        status,
        led_color,
        floorTelemetry: floor
      };
    });
  }, [rows, products, sensors, telemetryPayload]);

  // Compute Gas Condition based on thresholds (Normal / Warning / Danger)
  const gasStatus = useMemo(() => {
    // 1. Ambil nilai gas aktual (prioritaskan telemetri ESP32, fallback ke envData)
    const currentGas = telemetryPayload?.environment?.gas_raw ?? envData.gasPpm;

    // 2. Evaluasi bahaya jika ada pemicu safety state atau hazard dari ESP32
    if (
      String(telemetryPayload?.environment?.safety_state || '').includes('ALARM') ||
      telemetryPayload?.environment?.hazard_detected
    ) {
      return 'Danger';
    }

    // 3. Evaluasi ambang batas bahaya gas (Default: Bahaya >= 1800, Waspada >= 700)
    if (currentGas >= envData.gasDangerThreshold) return 'Danger';
    if (currentGas >= envData.gasWarningThreshold) return 'Warning';

    return 'Normal';
  }, [envData, telemetryPayload]);

  // Compute aggregate metrics from Edge Telemetry summary
  const summaryMetrics = useMemo(() => {
    const totalStock = telemetryPayload?.summary?.total_items ?? enrichedRows.reduce((acc, r) => acc + r.estimatedStock, 0);
    const activeRowsCount = telemetryPayload?.summary?.occupied_floors ?? enrichedRows.filter((r) => r.estimatedStock > 0).length;
    const totalCapacity = enrichedRows.reduce((acc, r) => acc + r.capacity, 0);
    const onlineSensorsCount = telemetryPayload ? 8 : sensors.filter((s) => s.online).length;
    const totalSensorsCount = 8;
    return {
      totalStock,
      totalCapacity,
      activeRowsCount,
      totalRowsCount: enrichedRows.length,
      onlineSensorsCount,
      totalSensorsCount
    };
  }, [enrichedRows, sensors, telemetryPayload]);

  // Handler: Update ultrasonic sensor distances for a row and automatically log stock change if quantity changed
  const handleUpdateRowDistances = useCallback(
    (rowId: string, newLeftCm: number, newRightCm: number, sourceLabel: string = 'Manual Override') => {
      const ts = getFormattedTimestamp();
      setLastSyncTime(ts);

      const clampedLeft = Math.max(0, Math.min(APP_CONFIG.RACK.DEFAULT_ROW_SPAN_CM, Number(newLeftCm)));
      const clampedRight = Math.max(0, Math.min(APP_CONFIG.RACK.DEFAULT_ROW_SPAN_CM - clampedLeft, Number(newRightCm)));
      const occupiedSpan = Math.max(0, APP_CONFIG.RACK.DEFAULT_ROW_SPAN_CM - clampedLeft - clampedRight);
      const boxLen = 14.5;
      const newItemCount = Math.min(4, Math.max(0, Math.round(occupiedSpan / boxLen)));
      const newStatus = newItemCount === 0 ? 'EMPTY' : newItemCount >= 4 ? 'FULL' : 'PARTIAL';

      // Update telemetryPayload Edge state
      setTelemetryPayload((prev) => {
        if (!prev) return null;
        const rowMatch = rowId.match(/\d+/);
        const targetFloorNum = rowMatch ? parseInt(rowMatch[0], 10) : 1;

        const updatedFloors = prev.floors.map((f, idx) => {
          const floorNum = f.floor || idx + 1;
          if (floorNum !== targetFloorNum) return f;

          const ledColor = prev.environment?.hazard_detected
            ? 'BLINK_RED'
            : newStatus === 'EMPTY'
            ? 'RED'
            : newStatus === 'FULL'
            ? 'GREEN'
            : 'BLUE';

          return {
            ...f,
            distance_left_cm: clampedLeft,
            distance_right_cm: clampedRight,
            occupied_span_cm: Number(occupiedSpan.toFixed(1)),
            item_count: newItemCount,
            is_occupied: newItemCount > 0,
            status: newStatus as any,
            led_color: ledColor as any,
          };
        });

        const totalItems = updatedFloors.reduce((acc, f) => acc + f.item_count, 0);
        const occupiedFloors = updatedFloors.filter((f) => f.item_count > 0).length;

        return {
          ...prev,
          floors: updatedFloors,
          summary: {
            ...prev.summary,
            total_items: totalItems,
            occupied_floors: occupiedFloors,
            warehouse_status: totalItems === 0 ? 'EMPTY' : totalItems >= 12 ? 'FULL' : 'PARTIAL',
          },
        };
      });

      setRows((prevRows) =>
        prevRows.map((row) => {
          if (row.rowId !== rowId) return row;

          const product = products.find((p) => p.sku === row.sku) || { lengthCm: 20 };
          const leftSensor = sensors.find((s) => s.id === row.leftSensorId || (s as any).sensorId === row.leftSensorId);
          const rightSensor = sensors.find((s) => s.id === row.rightSensorId || (s as any).sensorId === row.rightSensorId);
          const sensorsOnline = Boolean((leftSensor?.online ?? true) && (rightSensor?.online ?? true));

          const prevCalc = calculateRowStock(
            row.rowSpanCm,
            row.leftDistanceCm,
            row.rightDistanceCm,
            product.lengthCm,
            row.capacity,
            sensorsOnline
          );

          const nextCalc = calculateRowStock(
            row.rowSpanCm,
            clampedLeft,
            clampedRight,
            product.lengthCm,
            row.capacity,
            sensorsOnline
          );

          // If estimated stock quantity changed, create an Inventory History transaction
          if (sensorsOnline && nextCalc.estimatedStock !== prevCalc.estimatedStock) {
            const diff = nextCalc.estimatedStock - prevCalc.estimatedStock;
            const nowD = new Date();
            const padD = (n: number) => String(n).padStart(2, '0');
            const todayStr = `${nowD.getFullYear()}-${padD(nowD.getMonth() + 1)}-${padD(nowD.getDate())}`;

            const newTx: InventoryHistory = {
              id: `TX-${Math.floor(1050 + Math.random() * 8900)}`,
              timestamp: ts,
              dateOnly: todayStr,
              rackId: 'RACK-001',
              rowId: row.rowId,
              sku: row.sku,
              prevStock: prevCalc.estimatedStock,
              currentStock: nextCalc.estimatedStock,
              diff,
              eventType: diff > 0 ? 'Stock In' : 'Stock Out',
              trigger: `${sourceLabel} (L:${clampedLeft}cm, R:${clampedRight}cm)`
            };
            setInventoryHistory((prevHistory) => [newTx, ...prevHistory]);
          }

          return {
            ...row,
            leftDistanceCm: clampedLeft,
            rightDistanceCm: clampedRight,
            lastUpdated: ts
          };
        })
      );
    },
    [products, sensors]
  );

  // Handler: Quick Add / Remove 1 Box on a Row (adjusts ultrasonic distance realistically)
  const handleStepRowBox = (rowId: string, deltaBoxes: number) => {
    const targetRow = enrichedRows.find((r) => r.rowId === rowId);
    if (!targetRow) return;
    const capacity = 4;
    const newCount = Math.max(0, Math.min(capacity, targetRow.estimatedStock + deltaBoxes));
    if (newCount === targetRow.estimatedStock) return;

    const boxLen = 14.5; // Panjang standar 1 kardus (4 x 14.5 cm = 58 cm)
    const newOccupiedSpan = Number((newCount * boxLen).toFixed(1));
    const newTotalEmpty = Number(Math.max(0, 58.0 - newOccupiedSpan).toFixed(1));

    // Kardus menempel di dinding kiri (0cm) dan sisa ruang kosong di sisi kanan
    const nextLeft = 0;
    const nextRight = newCount === 0 ? 58.0 : newTotalEmpty;

    handleUpdateRowDistances(rowId, nextLeft, nextRight, deltaBoxes > 0 ? 'Box Loaded' : 'Box Picked');
    triggerToast(`${rowId}: ${deltaBoxes > 0 ? 'Ditambah' : 'Diambil'} 1x kardus. Stok sekarang ${newCount} kardus.`);
  };

  // Handler: Reset semua nilai demonstrasi ke konfigurasi standar APP_CONFIG
  const handleResetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setRows(INITIAL_ROWS);
    setSensors(INITIAL_SENSORS);
    setEnvData({
      temperatureC: APP_CONFIG.THRESHOLDS.DEFAULT_TEMP_C,
      humidityRh: APP_CONFIG.THRESHOLDS.DEFAULT_HUMIDITY_RH,
      gasPpm: APP_CONFIG.THRESHOLDS.DEFAULT_GAS_PPM,
      gasWarningThreshold: APP_CONFIG.THRESHOLDS.GAS_WARNING_PPM,
      gasDangerThreshold: APP_CONFIG.THRESHOLDS.GAS_DANGER_PPM
    });
    setLastSyncTime(getFormattedTimestamp());
    triggerToast('Konfigurasi berhasil disinkronkan ke default.');
  };

  // Toggle Sensor Online/Offline status
  const toggleSensorConnection = (sensorId: string) => {
    const ts = getFormattedTimestamp();
    setSensors((prev) =>
      prev.map((s) => {
        if (s.id !== sensorId) return s;
        const nextOnline = !s.online;
        triggerToast(
          `Sensor ${s.id} (${s.name}) ${nextOnline ? 'reconnected to ESP32 bus' : 'disconnected / fault simulated'}.`,
          nextOnline ? 'info' : 'danger'
        );
        return {
          ...s,
          online: nextOnline,
          lastSeen: nextOnline ? ts.split(' ')[1] : s.lastSeen
        };
      })
    );
  };

  const navLabels: Record<string, string> = {
    overview: 'Ringkasan',
    rack: 'Monitoring Rak',
    products: 'Manajemen Produk',
    history: 'Riwayat Stok',
    sensors: 'Monitoring Sensor',
    settings: 'Pengaturan'
  };

  const sensorAlertCount = sensors.filter((s) => !s.online).length + (gasStatus !== 'Normal' ? 1 : 0);

  return (
    <div className="min-h-screen lg:h-screen flex lg:overflow-hidden bg-[#F7F5F2] text-[#263238] font-sans antialiased selection:bg-[#EA580C] selection:text-white">
      {/* INTERACTIVE POP-UP TUTORIAL MODAL OVERLAY */}
      <RackInstructionTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mqttBroker={activeBroker}
        isBackendConnected={backendConnected}
        isMqttConnected={isMqttConnected}
        isTelemetryLive={isTelemetryLive}
        firmwareVersion={firmwareVersion}
        otaStatus={otaStatus}
        onlineSensorsCount={summaryMetrics.onlineSensorsCount}
        totalSensorsCount={summaryMetrics.totalSensorsCount}
        sensorAlertCount={sensorAlertCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        isFireAlert={
          gasStatus === 'Danger' ||
          String(telemetryPayload?.environment?.safety_state || '').includes('ALARM') ||
          telemetryPayload?.actuators?.buzzer === true
        }
        gasPpm={telemetryPayload?.environment?.gas_raw ?? envData.gasPpm}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <Header
          rackId={systemConfig.rackId}
          currentPageLabel={navLabels[activePage] || 'Ringkasan'}
          firmwareVersion={firmwareVersion}
          lastSyncTime={lastSyncTime}
          isBackendConnected={backendConnected}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />

        {/* ACTIVE OTA UPDATE BANNER (DOWNLOADING -> BURNING -> SUCCESS) */}
        {otaStatus && otaStatus.status !== 'IDLE' && (
          <div className={`px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-all ${
            otaStatus.status === 'SUCCESS'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : otaStatus.status === 'FAILED'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                otaStatus.status === 'SUCCESS'
                  ? 'bg-emerald-600 text-white'
                  : otaStatus.status === 'FAILED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                OTA {otaStatus.status}
              </span>
              <span className="font-semibold text-xs">
                {otaStatus.status === 'DOWNLOADING' && 'ESP32 sedang mengunduh file binary firmware baru via Wi-Fi...'}
                {otaStatus.status === 'BURNING' && 'ESP32 sedang membakar (flashing) partisi Flash OTA... Jangan matikan daya!'}
                {otaStatus.status === 'SUCCESS' && `Update firmware berhasil diselesaikan! Firmware aktif: ${firmwareVersion}`}
                {otaStatus.status === 'FAILED' && `Update firmware gagal: ${otaStatus.message || 'Error flashing'}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Topik: warehouse/small_warehouse/ota/status
            </span>
          </div>
        )}

        {/* LIVE TELEMETRY STREAMING / STATUS BAR */}
        <div className={`border-b px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
          telemetryPayload
            ? 'bg-emerald-500/10 border-emerald-200'
            : backendConnected
            ? 'bg-amber-500/10 border-amber-200'
            : 'bg-rose-500/10 border-rose-200'
        }`}>
          <div className="flex flex-wrap items-center gap-2 text-[#263238]">
            {telemetryPayload ? (
              <>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  JALUR TELEMETRI LIVE HARDWARE (ESP32)
                </span>
                <span className="text-emerald-900 text-xs font-mono">
                  Streaming telemetri langsung dari ESP32 via EMQX TLS &amp; WebSocket Gateway. 
                </span>
              </>
            ) : backendConnected ? (
              <>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  GATEWAY STANDBY
                </span>
                <span className="text-amber-900 text-xs font-mono">
                  Gateway terhubung ke Backend. Menunggu ESP32 mem-publish paket telemetri ke MQTT broker...
                </span>
              </>
            ) : (
              <>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  GATEWAY DISCONNECTED
                </span>
                <span className="text-rose-900 text-xs font-mono">
                  Backend offline di {APP_CONFIG.NETWORK.BACKEND_URL}. Pastikan server backend Node.js berjalan.
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshBackendData}
              className="text-[11px] font-mono text-orange-950 hover:text-orange-700 hover:underline flex items-center gap-1 font-semibold"
              title="Sinkronisasi ulang data master dari SQLite database"
            >
              <RotateCcw className="w-3 h-3 text-orange-600" />
              Sinkronisasi DB
            </button>
          </div>
        </div>

        {/* TOAST NOTIFICATION BANNER */}
        {systemNotification && (
          <div className="mx-4 sm:mx-6 mt-4 px-4 py-2.5 bg-[#172B3A] text-white text-xs font-mono rounded-sm flex items-center justify-between border-l-4 border-[#66856A] shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#66856A] shrink-0" />
              <span>{systemNotification.msg}</span>
            </div>
            <button onClick={() => setSystemNotification(null)} className="text-slate-300 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activePage === 'overview' && (
            <Dashboard
              telemetry={telemetryPayload}
              isConnected={backendConnected}
              lastUpdated={liveLastUpdated}
              sendBuzzerCommand={sendBuzzerCommand}
            />
          )}

          {activePage === 'rack' && (
            !telemetryPayload ? (
              <Dashboard
                telemetry={telemetryPayload}
                isConnected={backendConnected}
                lastUpdated={liveLastUpdated}
                sendBuzzerCommand={sendBuzzerCommand}
              />
            ) : (
              <RackMonitoringPage
                enrichedRows={enrichedRows}
                selectedRowId={selectedRowId}
                onSelectRow={setSelectedRowId}
                envData={envData}
                gasStatus={gasStatus}
                sensors={sensors}
                telemetryPayload={telemetryPayload}
              />
            )
          )}

          {activePage === 'products' && (
            <ProductManagementPage
              products={products}
              setProducts={setProducts}
              rows={rows}
              triggerToast={triggerToast}
            />
          )}

          {activePage === 'history' && (
            <InventoryHistoryPage
              inventoryHistory={inventoryHistory}
              products={products}
              onRefresh={refreshBackendData}
            />
          )}

          {activePage === 'sensors' && (
            <SensorMonitoringPage
              sensors={sensors}
              enrichedRows={enrichedRows}
              envData={envData}
              setEnvData={setEnvData}
              gasStatus={gasStatus}
              gasAlerts={gasAlerts}
              setGasAlerts={setGasAlerts}
              envHistory={envHistory}
              onToggleSensor={toggleSensorConnection}
              triggerToast={triggerToast}
              telemetryPayload={telemetryPayload}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              rows={rows}
              setRows={setRows}
              products={products}
              envData={envData}
              setEnvData={setEnvData}
              systemConfig={systemConfig}
              setSystemConfig={setSystemConfig}
              firmwareVersion={firmwareVersion}
              otaStatus={otaStatus}
              triggerToast={triggerToast}
              onResetDemo={handleResetDemoData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
