type SkeletonVariant="chat"|"discovery"|"matches"|"profile";

export function FlirtschatSkeleton({variant}:{variant:SkeletonVariant}){
  if(variant==="chat")return <main className="fc-skeleton-page fc-chat-skeleton" role="status" aria-label="Loading conversation"><div className="fc-skeleton-chat-header"><i/><span/><b/></div><div className="fc-skeleton-chat-body"><i/><i/><i/><i/><i/></div><div className="fc-skeleton-composer"><i/><span/><b/></div></main>;
  if(variant==="discovery")return <div className="fc-content-skeleton fc-discovery-skeleton" role="status" aria-label="Loading profiles"><div className="fc-skeleton-card"><i/><span/><span/><span/></div><div className="fc-skeleton-actions"><b/><b/><b/></div></div>;
  if(variant==="matches")return <div className="fc-content-skeleton fc-matches-skeleton" role="status" aria-label="Loading matches">{[1,2,3,4].map(item=><div className="fc-skeleton-match" key={item}><i/><span/><b/></div>)}</div>;
  return <div className="fc-content-skeleton fc-profile-skeleton" role="status" aria-label="Loading profile"><i/><span/><span/><div><b/><b/><b/><b/></div></div>;
}
