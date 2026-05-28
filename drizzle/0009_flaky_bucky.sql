ALTER TABLE `users` ADD `hasPaidAccess` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `interestedInPro` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripePaymentIntentId` varchar(255);