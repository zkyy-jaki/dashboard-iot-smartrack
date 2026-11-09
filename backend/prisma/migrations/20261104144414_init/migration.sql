-- CreateTable
CREATE TABLE "Rack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rackId" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Warehouse A',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RackRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rowId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rackId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "rowSpanCm" REAL NOT NULL,
    "leftSensorId" TEXT NOT NULL,
    "rightSensorId" TEXT NOT NULL,
    "leftDistanceCm" REAL NOT NULL DEFAULT 0,
    "rightDistanceCm" REAL NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RackRow_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RackRow_sku_fkey" FOREIGN KEY ("sku") REFERENCES "Product" ("sku") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RackRow_leftSensorId_fkey" FOREIGN KEY ("leftSensorId") REFERENCES "Sensor" ("sensorId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RackRow_rightSensorId_fkey" FOREIGN KEY ("rightSensorId") REFERENCES "Sensor" ("sensorId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lengthCm" REAL NOT NULL,
    "widthCm" REAL NOT NULL,
    "heightCm" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sensorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "gpio" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "signalRssi" INTEGER NOT NULL DEFAULT -60,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "txId" TEXT NOT NULL,
    "rackId" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "prevStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "diff" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "leftDistCm" REAL NOT NULL,
    "rightDistCm" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLedger_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryLedger_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "RackRow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryLedger_sku_fkey" FOREIGN KEY ("sku") REFERENCES "Product" ("sku") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelemetrySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rackId" TEXT NOT NULL,
    "temperatureC" REAL NOT NULL,
    "humidityRh" REAL NOT NULL,
    "gasPpm" REAL NOT NULL,
    "soundSpeedMs" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelemetrySnapshot_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Rack_rackId_key" ON "Rack"("rackId");

-- CreateIndex
CREATE UNIQUE INDEX "RackRow_rowId_key" ON "RackRow"("rowId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensorId_key" ON "Sensor"("sensorId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLedger_txId_key" ON "InventoryLedger"("txId");
