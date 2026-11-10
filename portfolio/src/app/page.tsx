import { redirect } from "next/navigation";

/** האתר הציבורי חי תחת /portfolio — השורש מפנה אליו */
export default function Root() {
  redirect("/portfolio");
}
