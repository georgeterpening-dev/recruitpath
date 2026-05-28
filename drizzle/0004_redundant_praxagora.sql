CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`position` varchar(32),
	`year` varchar(32),
	`graduationYear` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`state` varchar(8),
	`division` varchar(16),
	`conference` varchar(64),
	`hasRosterData` boolean NOT NULL DEFAULT false,
	`brandColor` varchar(16),
	`athleticsDomain` text,
	`coachName` text,
	`coachTitle` text,
	`coachEmail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schools_id` PRIMARY KEY(`id`)
);
