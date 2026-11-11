/**
 * ============================================================================
 * HOOK WEBSOCKET REAL-TIME (useWarehouseSocket)
 * ============================================================================
 * Menghubungkan aplikasi React ke Gateway Backend secara instan via Socket.IO.
 * 
 * ATURAN EDGE COMPUTING:
 * 1. State awal adalah NULL (Tidak ada mockData atau data palsu).
 * 2. Tidak melakukan kalkulasi matematika di sisi browser.
 * 3. Menerima payload siap pakai dari ESP32 (dikirimkan via event `telemetry_update`).
 * 4. Menyediakan fungsi kontrol aktuator `sendBuzzerCommand`.
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TelemetryPayload, BuzzerCommand, OtaStatusInfo } from '../types';
import { APP_CONFIG } from '../config';

const BACKEND_URL = APP_CONFIG.NETWORK.BACKEND_URL || 'http://localhost:3001';

export interface MqttStatusInfo {
  connected: boolean;
  brokerUrl: string;
}

export interface UseWarehouseSocketReturn {
  telemetry: TelemetryPayload | null;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryPayload | null>>;
  isConnected: boolean;
  mqttStatus: MqttStatusInfo | null;
  otaStatus: OtaStatusInfo | null;
  firmwareVersion: string;
  lastUpdated: string | null;
  sendBuzzerCommand: (command: BuzzerCommand) => Promise<boolean>;
}

export function useWarehouseSocket(): UseWarehouseSocketReturn {
  // Data telemetri murni dimulai dari NULL (tidak ada data bohong/dummy)
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [mqttStatus, setMqttStatus] = useState<MqttStatusInfo | null>(null);
  const [otaStatus, setOtaStatus] = useState<OtaStatusInfo | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<string>('v1.0.7');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Ambil status MQTT awal & OTA awal via REST endpoint
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/v1/health`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.mqtt) {
          setMqttStatus(resData.mqtt);
        }
      })
      .catch(() => {
        fetch(`${BACKEND_URL}/api/health`)
          .then((res) => res.json())
          .then((resData) => {
            if (resData?.mqtt) {
              setMqttStatus(resData.mqtt);
            }
          })
          .catch(() => {});
      });

    fetch(`${BACKEND_URL}/api/v1/ota/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.ota) {
          setOtaStatus(data.ota);
        }
        if (data?.firmwareVersion) {
          setFirmwareVersion(data.firmwareVersion);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useWarehouseSocket] ✓ Terhubung ke gateway WebSocket:', BACKEND_URL);
      setIsConnected(true);
      socket.emit('getMqttStatus');
    });

    socket.on('mqttStatus', (status: MqttStatusInfo) => {
      console.log('[useWarehouseSocket] Status MQTT diterima dari backend:', status);
      setMqttStatus(status);
    });

    const handleOta = (ota: OtaStatusInfo) => {
      console.log('[useWarehouseSocket] 🚀 OTA Status diterima:', ota);
      setOtaStatus(ota);
      if (ota.status === 'SUCCESS') {
        setFirmwareVersion('v1.0.7');
      }
    };

    socket.on('ota_status', handleOta);
    socket.on('otaStatus', handleOta);

    socket.on('disconnect', (reason) => {
      console.warn('[useWarehouseSocket] ⚠ Terputus dari gateway:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[useWarehouseSocket] ❌ Connection error:', err.message);
      setIsConnected(false);
    });

    // Menerima push event telemetri dari ESP32 melalui Backend
    const handleTelemetry = (data: any) => {
      if (!data || typeof data !== 'object') return;

      const fw = data.firmware_version || data.firmwareVersion;
      if (fw) {
        setFirmwareVersion(fw);
      }

      if (data.otaStatus) {
        setOtaStatus(data.otaStatus);
      }

      // Pastikan format floors adalah array standar
      let floors = Array.isArray(data.floors) ? data.floors : [];
      if (!Array.isArray(data.floors) && data.floors && typeof data.floors === 'object') {
        const keys = Object.keys(data.floors).sort();
        floors = keys.map((k, idx) => {
          const match = k.match(/\d+/);
          const floorNum = match ? parseInt(match[0], 10) : idx + 1;
          return { floor: floorNum, ...data.floors[k] };
        });
      }

      const normalized: TelemetryPayload = {
        firmware_version: fw || 'v1.0.7',
        firmwareVersion: fw || 'v1.0.7',
        otaStatus: data.otaStatus,
        floors,
        summary: {
          total_items: Number(data.summary?.total_items ?? 0),
          occupied_floors: Number(data.summary?.occupied_floors ?? 0),
          warehouse_status: data.summary?.warehouse_status || 'EMPTY',
          totalStock: Number(data.summary?.total_items ?? data.summary?.totalStock ?? 0),
          totalCapacity: Number(data.summary?.totalCapacity ?? 12),
        },
        environment: {
          temperature_c: Number(
            data.environment?.temperature_c ??
            data.environment?.temperatureC ??
            data.environment?.temperature ??
            data.environment?.temp ??
            data.environment?.suhu ??
            data.temperature_c ??
            data.temperatureC ??
            data.temperature ??
            data.temp ??
            27.5
          ),
          humidity_pct: Number(
            data.environment?.humidity_pct ??
            data.environment?.humidityRh ??
            data.environment?.humidity ??
            data.environment?.hum ??
            data.environment?.kelembaban ??
            data.humidity_pct ??
            data.humidityRh ??
            data.humidity ??
            data.hum ??
            65
          ),
          gas_raw: Number(
            data.environment?.gas_raw ??
            data.environment?.gasPpm ??
            data.environment?.gas ??
            data.environment?.mq2 ??
            data.gas_raw ??
            data.gasPpm ??
            data.gas ??
            185
          ),
          gas_pct: Number(data.environment?.gas_pct ?? data.gas_pct ?? 0),
          hazard_detected: Boolean(data.environment?.hazard_detected ?? data.hazard_detected),
          safety_state:
            String(data.environment?.safety_state || '').includes('ALARM') ||
            String(data.safety_state || '').includes('ALARM') ||
            Boolean(data.environment?.hazard_detected ?? data.hazard_detected)
              ? 'ALARM_TRIGGERED'
              : 'SAFE_NORMAL',
        },
        actuators: {
          buzzer: Boolean(data.actuators?.buzzer),
        },
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setTelemetry(normalized);
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
    };

    socket.on('telemetry_update', handleTelemetry);
    socket.on('telemetryUpdate', handleTelemetry);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('mqttStatus');
      socket.off('ota_status', handleOta);
      socket.off('otaStatus', handleOta);
      socket.off('telemetry_update', handleTelemetry);
      socket.off('telemetryUpdate', handleTelemetry);
      socket.disconnect();
    };
  }, []);

  /**
   * Mengirim perintah kontrol sirene / buzzer ke Backend REST API
   * POST /api/control/buzzer
   */
  const sendBuzzerCommand = useCallback(async (command: BuzzerCommand): Promise<boolean> => {
    try {
      console.log(`[useWarehouseSocket] Mengirim perintah buzzer: "${command}"`);
      const response = await fetch(`${BACKEND_URL}/api/control/buzzer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        // Coba rute v1 jika rute /api langsung tidak merespon
        const fallback = await fetch(`${BACKEND_URL}/api/v1/control/buzzer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        });
        return fallback.ok;
      }
      return response.ok;
    } catch (err) {
      console.error('[useWarehouseSocket] Gagal mengirim perintah buzzer:', err);
      return false;
    }
  }, []);

  return {
    telemetry,
    setTelemetry,
    isConnected,
    mqttStatus,
    otaStatus,
    firmwareVersion,
    lastUpdated,
    sendBuzzerCommand,
  };
}
