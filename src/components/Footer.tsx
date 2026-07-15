import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

const SOCIAL_LINKS = [
  { Icon: Facebook, href: "https://www.facebook.com/PydahCollegeOfEngineering", label: "Facebook" },
  {
    Icon: Instagram,
    href: "https://www.instagram.com/pydahgroupkakinada?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    label: "Instagram",
  },
  { Icon: Linkedin, href: "https://www.linkedin.com/company/pydahengineering/", label: "LinkedIn" },
  { Icon: Youtube, href: "https://youtube.com/@pydahgroupkakinada?si=clu6RvdjVrrDsCso", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Campus Life */}
          <div>
            <h3 className="font-display text-lg font-bold text-white">Campus Life</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:text-accent">NCC & NSS Cell</a></li>
              <li><a href="#" className="hover:text-accent">Student Clubs</a></li>
              <li><a href="#" className="hover:text-accent">Professional Bodies</a></li>
              <li><a href="#" className="hover:text-accent">College Events</a></li>
              <li><a href="#" className="hover:text-accent">Campus News Letter</a></li>
            </ul>

            <h3 className="mt-8 font-display text-lg font-bold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link to="/tour" className="hover:text-accent">Virtual Tour</Link></li>
              <li><Link to="/departments" className="hover:text-accent">Departments</Link></li>
              <li><Link to="/gallery" className="hover:text-accent">Gallery</Link></li>
              <li><Link to="/about" className="hover:text-accent">About</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Key Contacts</Link></li>
              <li><Link to="/placements" className="hover:text-accent">Careers</Link></li>
              <li><a href="#" className="hover:text-accent">Alumni</a></li>
              <li><a href="#" className="hover:text-accent">e-office</a></li>
              <li><a href="#" className="hover:text-accent">NAAC</a></li>
              <li><a href="#" className="hover:text-accent">AQAR</a></li>
              <li><a href="#" className="hover:text-accent">NIRF 2026</a></li>
              <li><a href="#" className="hover:text-accent">Hostel Portal</a></li>
            </ul>
          </div>

          {/* Innovate & Disclosure */}
          <div>
            <h3 className="font-display text-lg font-bold text-white">Innovate</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:text-accent">Incubation Center</a></li>
              <li><a href="#" className="hover:text-accent">Software Company</a></li>
              <li><a href="#" className="hover:text-accent">Aicte Idea Lab</a></li>
              <li><a href="#" className="hover:text-accent">Innovation Cell</a></li>
            </ul>

            <h3 className="mt-8 font-display text-lg font-bold text-white">Mandatory Disclosure</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:text-accent">Public Self - Disclosure</a></li>
              <li><a href="#" className="hover:text-accent">Grievances</a></li>
              <li><a href="#" className="hover:text-accent">RTI</a></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-display text-lg font-bold text-white">Admissions Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> <a href="tel:+917382456539" className="hover:text-accent">+91 73824 56539</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> <a href="tel:+917382015999" className="hover:text-accent">+91 73820 15999</a></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> <a href="mailto:admissions@pydah.edu.in" className="hover:text-accent break-all">admissions@pydah.edu.in</a></li>
            </ul>

            <h3 className="mt-8 font-display text-lg font-bold text-white">Placements Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> <a href="tel:+919849617788" className="hover:text-accent">+91 98496 17788</a></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> <a href="mailto:tpo@pydah.edu.in" className="hover:text-accent">tpo@pydah.edu.in</a></li>
            </ul>

            <h3 className="mt-8 font-display text-lg font-bold text-white">24×7 Women Helpline</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> <a href="tel:+919849617788" className="hover:text-accent">+91 98496 17788</a></li>
            </ul>
          </div>

          {/* About + Address */}
          <div>
            <h3 className="font-display text-lg font-bold text-white">Pydah College of Engineering</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              A premier autonomous engineering institution established in 2009. Recognized with NAAC Grade 'A', we are committed to providing cutting-edge technical education and fostering innovation, ensuring our graduates are prepared to lead the rapidly evolving technological landscape in Andhra Pradesh and globally.
            </p>

            <h3 className="mt-8 font-display text-lg font-bold text-white">Campus Address:</h3>
            <p className="mt-3 flex gap-2 text-sm leading-relaxed text-white/80">
              <MapPin className="h-4 w-4 shrink-0 text-accent" />
              <span>
                Kakinada - Yanam Road, Patavala,<br />
                Tallarevu (M),<br />
                Kakinada District, Andhra Pradesh, India<br />
                Pincode 533461
              </span>
            </p>

            <p className="mt-6 text-sm font-semibold text-white">
              EAPCET / POLYCET / ECET / ICET / PGECET<br />
              <span className="text-accent">CODE: PYDE</span>
            </p>

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row">
          <p>© {new Date().getFullYear()} PYDAH College — Virtual Tour. All rights reserved. Proudly created by Department of Computer Science Engineering.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent">Terms and Conditions</a>
            <a href="#" className="hover:text-accent">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
