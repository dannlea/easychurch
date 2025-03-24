-- Create sermon_series table
CREATE TABLE IF NOT EXISTS sermon_series (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  artwork VARCHAR(255),
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  organizationId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create speakers table
CREATE TABLE IF NOT EXISTS speakers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  profilePicture VARCHAR(255),
  organizationId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create sermon_plans table
CREATE TABLE IF NOT EXISTS sermon_plans (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(255),
  seriesId VARCHAR(36),
  speakerId VARCHAR(36),
  notes TEXT,
  planningCenterPlanId VARCHAR(255),
  planningCenterStatus VARCHAR(50),
  storageIntegration ENUM('onedrive', 'dropbox'),
  storagePath VARCHAR(255),
  organizationId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seriesId) REFERENCES sermon_series(id) ON DELETE SET NULL,
  FOREIGN KEY (speakerId) REFERENCES speakers(id) ON DELETE SET NULL,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  organizationId VARCHAR(36) PRIMARY KEY,
  serviceDays JSON NOT NULL, -- Array of weekday numbers (0-6)
  servicesPerDay INT NOT NULL DEFAULT 1,
  planningCenterFolderId VARCHAR(255),
  storageIntegration ENUM('onedrive', 'dropbox'),
  storageFolderId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);
