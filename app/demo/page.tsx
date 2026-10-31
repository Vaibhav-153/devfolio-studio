import {Studio} from "@/components/studio/Studio";
import {defaultLayout,exampleSite,exampleProjects} from "@/lib/defaults";
export const metadata={title:"Interactive editor demo"};
export default function Demo(){return <Studio demo pageKey="home" initialLayout={defaultLayout()} site={exampleSite} projects={exampleProjects} template="minimal"/>}
