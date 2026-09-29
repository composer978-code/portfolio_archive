CREATE TABLE `archive_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('video','image','file','note') NOT NULL,
	`platform` enum('youtube','instagram'),
	`title` varchar(200) NOT NULL,
	`summary` varchar(1000) NOT NULL DEFAULT '',
	`body` text,
	`tags` varchar(500) NOT NULL DEFAULT '',
	`sourceUrl` varchar(2048),
	`fileName` varchar(255),
	`mimeType` varchar(160),
	`storageKey` varchar(512),
	`coverKey` varchar(512),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archive_items_id` PRIMARY KEY(`id`)
);
