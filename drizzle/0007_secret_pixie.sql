CREATE TABLE `coaches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` varchar(64) NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`position` text NOT NULL,
	`email` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaches_id` PRIMARY KEY(`id`)
);
