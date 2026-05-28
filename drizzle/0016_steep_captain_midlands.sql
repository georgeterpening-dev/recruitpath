ALTER TABLE `users` ADD `googleAuthUser` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(255);