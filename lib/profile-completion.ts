import type {CurrentProfile} from "@/lib/profile-types";
export const profileCompletionFields=(profile:CurrentProfile)=>[
  profile.displayName,profile.bio,profile.gender,profile.interestedIn,profile.dateOfBirth,
  profile.country||profile.city,profile.interests.length,profile.relationshipGoal,profile.primaryPhotoUrl,
];
export function getProfileCompletion(profile:CurrentProfile){const fields=profileCompletionFields(profile);return Math.round(fields.filter(Boolean).length/fields.length*100)}
