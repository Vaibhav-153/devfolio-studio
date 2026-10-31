import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"Devfolio Studio — Build your developer portfolio",template:"%s | Devfolio Studio"},description:"A thoughtfully designed, no-code portfolio builder for developers. Create, customize and publish your work."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a><div id="main-content">{children}</div></body></html>}
