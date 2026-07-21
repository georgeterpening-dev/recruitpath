ALTER TABLE `athlete_profiles` ADD `dateOfBirth` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `hasCompletedOnboarding` boolean DEFAULT false NOT NULL;