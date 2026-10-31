import type { Block, LayoutDocument, PortfolioProject, SiteContent, TemplateName } from "./models";

export const exampleSite: SiteContent = {
  name: "Alex Morgan", role: "Full-stack developer", heroOne: "Building thoughtful", heroTwo: "digital experiences.",
  intro: "I turn product ideas into practical, accessible web applications—from the first wireframe to a reliable release.",
  about: "I enjoy building useful products, clear interfaces and dependable systems. My work brings together frontend design, backend engineering and attention to detail.",
  email: "hello@example.com", github: "https://github.com/", linkedin: "https://www.linkedin.com/", skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "APIs"],
};
export const exampleProjects: PortfolioProject[] = [
  { id: "sample-1", title: "Flowboard", slug: "flowboard", category: "Full-stack", summary: "A team planning interface for turning scattered tasks into organized workflows.", tech: ["Next.js", "PostgreSQL", "TypeScript"], github: "", demo: "" },
  { id: "sample-2", title: "Insight Kit", slug: "insight-kit", category: "Analytics", summary: "A clear dashboard experience for exploring trends and making informed decisions.", tech: ["React", "Python", "SQL"], github: "", demo: "" },
  { id: "sample-3", title: "Notes API", slug: "notes-api", category: "Backend", summary: "A clean, documented REST API focused on reliable data handling and testing.", tech: ["Node.js", "API", "Docker"], github: "", demo: "" },
];
const b = (id:string, type:Block["type"], props:Record<string, unknown>={},surface:Block["style"]["surface"]="plain"):Block => ({id,type,props,style:{surface,paddingY:58}});
export function defaultLayout(page:"home"|"projects"="home"):LayoutDocument {
  return {schemaVersion:1,blocks:page==="home"?[
    b("hero", "Hero"),b("work", "ProjectGrid",{title:"Selected work",maxProjects:3,columns:2}),b("about","About"),b("skills","Skills"),
    b("freeform","Freeform",{title:"My approach",height:{desktop:320,tablet:300,mobile:410},nodes:[
      {id:"idea",text:"Understand the problem",layout:{desktop:{x:5,y:12,w:34,h:31},tablet:{x:5,y:10,w:42,h:31},mobile:{x:6,y:5,w:88,h:25}}},
      {id:"build",text:"Build the solution",layout:{desktop:{x:43,y:42,w:48,h:30},tablet:{x:48,y:44,w:45,h:30},mobile:{x:6,y:38,w:88,h:25}}}
    ]}),b("contact","Contact")
  ]:[b("projects-hero","Text",{eyebrow:"Selected projects",title:"Work that tells the story.",body:"Explore practical applications, experiments and things I've learned along the way."}),b("all-projects","ProjectGrid",{title:"All projects",maxProjects:24,columns:2}),b("contact","Contact")]};
}
export const templateOptions:{id:TemplateName; name:string;description:string}[] = [
  {id:"minimal",name:"Signature Minimal",description:"Warm, calm and editorial."},
  {id:"midnight",name:"Midnight Developer",description:"Dark, considered and technical."},
  {id:"grid",name:"Grid Studio",description:"Project-led, structured and visual."}
];
