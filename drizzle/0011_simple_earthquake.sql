ALTER TABLE `users` ADD `gmailAccessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gmailRefreshToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gmailConnectedEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `gmailConnectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailsSent` int DEFAULT 0 NOT NULL;