ALTER TABLE `users` ADD `subscriptionType` enum('monthly','annual','grandfathered');--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','cancelled','past_due');