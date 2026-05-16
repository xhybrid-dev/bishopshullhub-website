import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Navigation, ExternalLink, ParkingCircle, Mail, AlertTriangle, Lock, Phone } from "lucide-react";
import { SITE_CONTACT } from "@/lib/site-contact";
import { FindUsMap } from "@/components/FindUsMap";
import { GettingHereTabs } from "@/components/GettingHereTabs";
import { CopyAddressButton } from "@/components/CopyAddressButton";

export const metadata: Metadata = {
  title: "How to Find Us | Bishops Hull Hub",
  description:
    "Directions and travel information for Bishops Hull Hub — located on Bishops Hull Playing Field, accessed off Bishops Hull Hill, Taunton TA1 5EB.",
};

const entrancePhotos = [
  {
    src: "https://bhhub.co.uk/wp-content/uploads/2021/11/IMG_20211101_082809-scaled-e1637571368165.jpg",
    alt: "Bishops Hull Hub building",
    caption: "The Hub building on the playing field",
  },
  {
    src: "/images/find-us/HUB-RoadEntrance.jpg",
    alt: "Car park entrance off Bishops Hull Hill",
    caption: "The car park entrance is off Bishops Hull Hill",
  },
  {
    src: "/images/find-us/HUB-CarParkEntrance.jpg",
    alt: "Hub car park",
    caption: "Free on-site parking in the Hub car park",
  },
  {
    src: "/images/find-us/HUB-Gate.jpg",
    alt: "Car park height restriction gate",
    caption: "Height restriction applies at the car park entrance at 2.0m — contact the duty manager if assistance is required",
  },
];

export default function FindUsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <MapPin className="h-4 w-4" />
              Bishops Hull, Taunton
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              How to Find Us
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We&apos;re located on{" "}
              <span className="text-foreground font-medium">Bishops Hull Playing Field</span>,
              accessed off Bishops Hull Hill. Here&apos;s everything you need to find us easily.
            </p>

            {/* Address card */}
            <div className="bg-card border border-border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 max-w-lg shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Bishops Hull Hub</p>
                  <p className="text-sm text-muted-foreground">Bishops Hull Hill</p>
                  <p className="text-sm text-muted-foreground">Taunton, TA1 5EB</p>
                </div>
              </div>
              <CopyAddressButton address="Bishops Hull Hub, Bishops Hull Hill, Taunton, TA1 5EB" />
            </div>
          </div>

          {/* Nav app buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <a
              href="https://maps.app.goo.gl/BBxK3zLuSw2dXfpNA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-teal-500 text-white font-semibold rounded-full px-5 py-2.5 text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
            >
              <Navigation className="h-4 w-4" />
              Google Maps
            </a>
            <a
              href="https://maps.apple.com/?q=Bishops+Hull+Hub,+Bishops+Hull+Hill,+Taunton+TA1+5EB"
              target="_blank"
              className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-muted hover:scale-105 transition-all duration-200"
            >
              <Navigation className="h-4 w-4" />
              Apple Maps
            </a>
            <a
              href="https://waze.com/ul?ll=51.0160639,-3.1349833&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-muted hover:scale-105 transition-all duration-200"
            >
              <Navigation className="h-4 w-4" />
              Waze
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Map */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Find us on the map</h2>
          <p className="text-muted-foreground mb-6">
            Click the marker for address details. Use Street View to see the approach before you arrive.
          </p>
          <div className="rounded-3xl overflow-hidden shadow-xl shadow-primary/10 ring-1 ring-border">
            <FindUsMap />
          </div>
        </div>
      </section>

      {/* Getting Here tabs */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Getting here</h2>
          <p className="text-muted-foreground mb-2">
            Step-by-step directions for every way of travelling to the Hub.
          </p>
          <p className="text-sm text-primary font-medium mb-8">
            The Hub is centrally located in Bishops Hull — walking is our preferred and encouraged way to visit, with footpath access from across the village.
          </p>
          <GettingHereTabs />
        </div>
      </section>

      {/* Spot the entrance */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Recognise the entrance</h2>
          <p className="text-muted-foreground mb-3">
            The gate is set back slightly from the road and can be easy to miss at speed — here&apos;s what to look for.
          </p>
          <div className="inline-flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-8">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Tip:</span> Look for the playing field sign on Bishops Hull Hill. Slow down — the entrance is easy to overshoot.
            </p>
          </div>

          {/* POV entrance video */}
          <div className="rounded-3xl overflow-hidden bg-card border border-border shadow-md mb-8">
            <video
              src="/images/find-us/HUB-EntryVID.mp4"
              controls
              playsInline
              className="w-full max-h-[480px] object-cover"
            />
            <div className="px-5 py-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">
                Point-of-view approach — arriving at the Hub from Bishops Hull Hill
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {entrancePhotos.map((photo, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-foreground">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key info cards */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Good to know</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-card rounded-3xl border border-border p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ParkingCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Free Parking</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Free on-site parking is available in the Hub car park, reserved for users of the Hub and Playing Field only.
                </p>
                <div className="flex items-start gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    The car park gate may be locked outside of operating hours to prevent unauthorised access to the playing field.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Full Address</h3>
                <p className="text-sm text-muted-foreground">
                  Bishops Hull Hub<br />
                  Bishops Hull Playing Field<br />
                  Bishops Hull Hill<br />
                  Taunton, TA1 5EB
                </p>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Can&apos;t Find Us?</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Drop us an email and we&apos;ll help you out.
                </p>
                <a
                  href="mailto:bhhubbookings@gmail.com"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  bhhubbookings@gmail.com
                </a>
              </div>
            </div>

            <div className="bg-amber-50 rounded-3xl border-2 border-amber-300 p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-200 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-amber-800" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Site Contact (During Your Hire)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  If you&apos;re already on-site and have an issue (access, facilities, anything urgent), call {SITE_CONTACT.name}.
                </p>
                <a
                  href={SITE_CONTACT.telHref}
                  className="text-base font-bold text-amber-900 hover:underline"
                >
                  {SITE_CONTACT.name} — {SITE_CONTACT.displayPhone}
                </a>
                <p className="text-xs text-amber-800 mt-2 font-medium">
                  {SITE_CONTACT.notForBookings}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
