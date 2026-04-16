-- Fix WowSpec.BEAST_MASTERY typo: 'BeastMastery' -> 'Beast Mastery'
-- Run once against any environment that has existing raider_profile data.
UPDATE raider_profile SET spec = 'Beast Mastery' WHERE spec = 'BeastMastery';
