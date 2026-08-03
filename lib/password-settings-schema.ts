import {z} from "zod";

const securePassword=z.string().min(8,"Use at least 8 characters").regex(/[A-Z]/,"Add one uppercase letter").regex(/[a-z]/,"Add one lowercase letter").regex(/[0-9]/,"Add one number").regex(/[^A-Za-z0-9]/,"Add one symbol");

export const passwordSettingsSchema=z.object({currentPassword:z.string().min(8,"Enter your current password"),newPassword:securePassword,confirmPassword:z.string().min(1,"Confirm your new password"),signOutOtherDevices:z.boolean()}).refine(value=>value.newPassword===value.confirmPassword,{path:["confirmPassword"],message:"Passwords do not match"}).refine(value=>value.currentPassword!==value.newPassword,{path:["newPassword"],message:"New password must be different"});
export type PasswordSettingsValues=z.infer<typeof passwordSettingsSchema>;
