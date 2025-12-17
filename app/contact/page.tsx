import ContactForm from "@/components/contact-form";
import HeaderSection from "@/components/header-section";
import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderSection
        title="Get in Touch"
        subTitle="Drop us a message anytime."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Container Glassmorphism */}
        <div className="relative rounded-2xl border border-white/70 bg-white/80 backdrop-blur-2xl shadow-soft overflow-hidden flex flex-col lg:flex-row">
          {/* DEKORASI BACKGROUND */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-[#f64e42]/20 rounded-full blur-3xl opacity-50"></div>
          </div>

          {/* === KOLOM KIRI: INFO (Dark Mode) === */}
          <div className="lg:w-5/12 bg-gray-900 text-white p-10 sm:p-12 relative z-10 flex flex-col justify-between overflow-hidden">
            <div
              className="absolute inset-0 z-0 opacity-20"
              style={{
                backgroundImage: "url('/lapangan-about.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(100%)",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900/95 z-0"></div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Let's Connect!
              </h2>
              <p className="text-[15px] text-gray-400 text-lg mb-10">
                Just drop us a line. Our admin is basically online 24/7 (unless
                they're touching grass).
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-[#f64e42] transition-colors">
                    <PhoneIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Call / WhatsApp
                    </p>
                    <p className="text-[15px] font-medium">+62 878-8938-7992</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-[#f64e42] transition-colors">
                    <EnvelopeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Email Inquiry
                    </p>
                    <p className="text-[15px] font-medium">lapang.in@example.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-[#f64e42] transition-colors">
                    <MapPinIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Headquarters
                    </p>
                    <p className="text-[15px] font-medium">
                      Jl. Babarsari Jl. Tambak Bayan No.2, Janti, Caturtunggal,
                      Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta
                      55281
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            
          </div>

          {/* === KOLOM KANAN: FORM === */}
          <div className="lg:w-7/12 bg-white p-10 sm:p-17 relative z-10">
            <div className="max-w-md mx-auto lg:ml-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Slide into our Inbox
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
            FAQ (Frequently Asked Qs)
          </h3>
          <div className="grid gap-4 text-left">
            {/* FAQ 1 */}
            <details className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:border-[#f64e42]/50">
              <summary className="flex justify-between items-center font-bold text-gray-800 list-none">
                Can I just pull up without booking? (Walk-in)
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                Big no, bestie. We're fully booked most of the time. Secure your
                slot via the web first or you'll be watching from the sidelines.
                Don't risk it!
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:border-[#f64e42]/50">
              <summary className="flex justify-between items-center font-bold text-gray-800 list-none">
                I forgot my gear, do you guys rent stuff?
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                We got you covered. Balls, rackets, vests—we have 'em on deck.
                Just ask the admin at the counter. But for shoes? Nah, bring
                your own kicks, hygiene first!
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:border-[#f64e42]/50">
              <summary className="flex justify-between items-center font-bold text-gray-800 list-none">
                Can we extend if the game is heating up? (Overtime)
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                If the slot after you is empty, GAS! You can pay the extra hour
                on the spot. But if someone else booked it, you gotta respect
                the schedule. Fair play, right?
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:border-[#f64e42]/50">
              <summary className="flex justify-between items-center font-bold text-gray-800 list-none">
                Is there a shower? I don't wanna smell funky.
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                Of course! Hot water included. Fresh body, fresh mind. Just
                don't forget your own towel and toiletries, we're not a hotel
                (yet).
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
