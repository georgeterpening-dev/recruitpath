CREATE TABLE `sent_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolId` varchar(64) NOT NULL,
	`schoolName` text NOT NULL,
	`coachName` text,
	`coachEmail` varchar(320),
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'no_response',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sent_emails_id` PRIMARY KEY(`id`)
);
