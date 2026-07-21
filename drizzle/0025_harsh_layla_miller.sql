CREATE TABLE `commits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`position` varchar(32),
	`club` text,
	`highSchool` text,
	`gradYear` int NOT NULL DEFAULT 2026,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commits_id` PRIMARY KEY(`id`)
);
