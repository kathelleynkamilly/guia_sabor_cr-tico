-- ==========================================================
-- GUIA SABOR CRÍTICO - SCHEMA DO BANCO DE DADOS MYSQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `guia_sabor_critico`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `guia_sabor_critico`;

-- ----------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (users)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'user',
  `created_at` VARCHAR(64) NOT NULL,
  `created_timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. TABELA DE RESTAURANTES (restaurants)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurants` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `cuisine` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `hours` VARCHAR(100) NOT NULL,
  `rating` DECIMAL(3, 1) NOT NULL DEFAULT 5.0,
  `description` TEXT NULL,
  `image` TEXT NULL,
  `price_range` VARCHAR(10) NOT NULL DEFAULT 'R$$',
  `phone` VARCHAR(50) NULL,
  `website` VARCHAR(255) NULL,
  `cnpj` VARCHAR(25) NULL,
  `legal_name` VARCHAR(255) NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `verification_status` ENUM('verified', 'pending', 'unverified') NOT NULL DEFAULT 'unverified',
  `verified_date` VARCHAR(50) NULL,
  `verified_by` VARCHAR(255) NULL,
  `safety_score` INT NOT NULL DEFAULT 50,
  `report_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_restaurants_city` (`city`),
  INDEX `idx_restaurants_cuisine` (`cuisine`),
  INDEX `idx_restaurants_verified` (`is_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. COMODIDADES DO RESTAURANTE (restaurant_amenities)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_amenities` (
  `id` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `amenity_name` VARCHAR(120) NOT NULL,
  CONSTRAINT `fk_amenities_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_amenities_restaurant` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. SELOS DE SEGURANÇA E CONFIANÇA (restaurant_badges)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `restaurant_badges` (
  `id` INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `badge_name` VARCHAR(150) NOT NULL,
  CONSTRAINT `fk_badges_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_badges_restaurant` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. ITENS DO CARDÁPIO (menu_items)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `category` ENUM('Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas') NOT NULL DEFAULT 'Pratos Principais',
  `is_popular` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_vegetarian` BOOLEAN NOT NULL DEFAULT FALSE,
  `image` TEXT NULL,
  CONSTRAINT `fk_menu_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_menu_restaurant` (`restaurant_id`),
  INDEX `idx_menu_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. AVALIAÇÕES E CRÍTICAS (reviews)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `author_email` VARCHAR(255) NULL,
  `stars` INT NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `created_timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reviews_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_reviews_restaurant` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. DENÚNCIAS DE FRAUDES E GOLPES (fraud_reports)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fraud_reports` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `restaurant_id` VARCHAR(64) NOT NULL,
  `restaurant_name` VARCHAR(255) NOT NULL,
  `reporter_name` VARCHAR(255) NOT NULL,
  `reporter_email` VARCHAR(255) NULL,
  `reason` ENUM(
    'perfil_falso',
    'golpe_pix',
    'endereco_inexistente',
    'cardapio_fraudulento',
    'marca_clonada',
    'outro'
  ) NOT NULL DEFAULT 'outro',
  `description` TEXT NOT NULL,
  `status` ENUM('em_analise', 'resolvido') NOT NULL DEFAULT 'em_analise',
  `created_at` VARCHAR(64) NOT NULL,
  `created_timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reports_restaurant`
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_reports_restaurant` (`restaurant_id`),
  INDEX `idx_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
