import {NextResponse} from "next/server";
export function GET(){return NextResponse.json({status:"ok",service:"devfolio-studio",phase:5},{headers:{"cache-control":"no-store"}});}
