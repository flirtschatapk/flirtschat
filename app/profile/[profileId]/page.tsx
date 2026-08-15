import {PublicProfileRoute} from "@/components/profile/public-profile-route";

export default async function ProfilePage({params}:{params:Promise<{profileId:string}>}){
  const{profileId}=await params;
  return <PublicProfileRoute profileId={profileId}/>;
}
