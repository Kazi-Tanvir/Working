-- CreateTable
CREATE TABLE `media_entries` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(250) NOT NULL,
    `type` ENUM('anime', 'manga', 'game', 'movie', 'series') NOT NULL,
    `status` ENUM('watching', 'reading', 'playing', 'completed', 'on_hold', 'dropped', 'plan_to_consume') NOT NULL DEFAULT 'plan_to_consume',
    `coverImage` VARCHAR(500) NOT NULL DEFAULT '',
    `releaseYear` INTEGER NOT NULL DEFAULT 2026,
    `genres` JSON NOT NULL,
    `rating` DOUBLE NULL,
    `progressCurrent` INTEGER NOT NULL DEFAULT 0,
    `progressTotal` INTEGER NULL,
    `progressUnit` ENUM('ep', 'ch', 'hrs', 'mins') NOT NULL DEFAULT 'ep',
    `notes` TEXT NULL,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `rewatchCount` INTEGER NOT NULL DEFAULT 0,
    `externalId` VARCHAR(100) NULL,
    `externalSource` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `media_entries_type_idx`(`type`),
    INDEX `media_entries_status_idx`(`status`),
    INDEX `media_entries_type_status_idx`(`type`, `status`),
    INDEX `media_entries_updatedAt_idx`(`updatedAt`),
    UNIQUE INDEX `media_entries_title_type_key`(`title`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
