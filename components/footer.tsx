import { Instagram, Send, Twitter, Youtube } from "lucide-react";

const groups = [
  { title: "Company", links: ["About us", "Careers", "Press", "Contact"] },
  { title: "Support", links: ["Help center", "Safety tips", "Community", "Report"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
];

export function Footer() {
  return <footer><div className="container footer-grid"><div className="footer-brand"><a href="#home" className="flirtschat-wordmark" aria-label="Flirtschat home"><strong>FLIRTSCHAT</strong></a><p>The dating app for honest profiles, shared energy and better conversations.</p><div className="socials"><a href="https://instagram.com" aria-label="Instagram"><Instagram/></a><a href="https://x.com" aria-label="X"><Twitter/></a><a href="https://youtube.com" aria-label="YouTube"><Youtube/></a></div></div>{groups.map(g=><nav aria-label={g.title} key={g.title}><strong>{g.title}</strong>{g.links.map(x=><a key={x} href={`#${x.toLowerCase().replaceAll(" ","-")}`}>{x}</a>)}</nav>)}<div className="newsletter"><strong>Stay in the loop</strong><p>Good stories and product news. No noise.</p><form><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" required placeholder="you@email.com"/><button type="submit" aria-label="Subscribe"><Send/></button></form></div></div><div className="container footer-bottom"><span>© 2026 Flirtschat. Made for Gen Z</span></div></footer>;
}
