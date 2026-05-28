ALTER TABLE `users` ADD `gmailAccessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gmailRefreshToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gmailAddress` varchar(320);