CREATE TABLE `affiliateApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`graduationYear` varchar(4) NOT NULL,
	`position` varchar(64) NOT NULL,
	`highSchool` varchar(255) NOT NULL,
	`clubTeam` varchar(255) NOT NULL,
	`instagramHandle` varchar(100),
	`whyJoin` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliateConversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`couponCode` varchar(20) NOT NULL,
	`convertedUserEmail` varchar(320) NOT NULL,
	`subscriptionType` enum('monthly','annual') NOT NULL,
	`commissionAmount` decimal(8,2) NOT NULL,
	`paid` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateConversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`couponCode` varchar(20) NOT NULL,
	`discountPercent` int NOT NULL DEFAULT 15,
	`commissionMonthly` decimal(8,2) NOT NULL DEFAULT '3.00',
	`commissionAnnual` decimal(8,2) NOT NULL DEFAULT '5.00',
	`totalConversions` int NOT NULL DEFAULT 0,
	`totalEarned` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalPaid` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_email_unique` UNIQUE(`email`),
	CONSTRAINT `affiliates_couponCode_unique` UNIQUE(`couponCode`)
);
