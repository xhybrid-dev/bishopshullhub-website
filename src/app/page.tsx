import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Ticket, Heart, HelpCircle, ArrowRight, ChefHat, Users, Volume2, MonitorPlay, Wifi, MapPin } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import HeroSection from '@/components/HeroSection';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import DroneTourSection from '@/components/DroneTourSection';

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');
  const youthImage = PlaceHolderImages.find(img => img.id === 'youth-club');

  return (
    <div className="flex flex-col gap-8 md:gap-16 pb-20">
      {/* Hero Section - Parallax with frosted glass scroll effect */}
      <HeroSection heroImageUrl={heroImage?.imageUrl || "https://picsum.photos/seed/bhh-hero/1200/600"} />

      {/* Primary Call to Action Cards */}
      <section className="container mx-auto px-4 -mt-12 md:-mt-24 relative z-30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Card className="bg-white shadow-xl border-t-4 border-t-primary hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/30 transition-all duration-300 ease-out rounded-[2rem]">
            <CardHeader className="p-5 md:p-8 pb-2">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl md:text-2xl font-headline text-primary">Common Questions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 md:p-8 pt-0 space-y-4">
              <p className="text-muted-foreground text-sm md:text-base">Find answers about venue hire, capacities, facilities, and more before you book.</p>
              <Link
                href="/faq"
                className="inline-flex items-center text-primary font-semibold hover:gap-2 transition-all"
              >
                Read our FAQs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-t-4 border-t-primary hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/30 transition-all duration-300 ease-out rounded-[2rem]">
            <CardHeader className="p-5 md:p-8 pb-2">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl md:text-2xl font-headline text-primary">How to Find Us</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 md:p-8 pt-0 space-y-4">
              <p className="text-muted-foreground text-sm md:text-base">We&apos;re on Bishops Hull Playing Field, off Bishops Hull Hill. Get directions, maps, and travel info.</p>
              <Link
                href="/find-us"
                className="inline-flex items-center text-primary font-semibold hover:gap-2 transition-all"
              >
                Get directions <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Facilities & Virtual Tour Section */}
      <section className="container mx-auto px-4 relative z-20">
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-5 md:p-12 space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                  <MapPin className="h-3 w-3" /> Modern Facilities
                </div>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">Everything you need for a perfect event</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Our purpose-built hub is equipped with high-spec facilities designed to support a wide range of activities.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[
                  { icon: ChefHat, title: "Pro Kitchen", desc: "Equipped" },
                  { icon: Users, title: "Capacity", desc: "Up to 100" },
                  { icon: Heart, title: "Furnished", desc: "Tables/Chairs" },
                  { icon: Volume2, title: "Audio", desc: "Surround" },
                  { icon: MonitorPlay, title: "Visuals", desc: "Projector" },
                  { icon: Wifi, title: "Connectivity", desc: "Free Wi-Fi" },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted/30 border border-muted text-center md:text-left">
                    <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm">
                      <item.icon className="h-5 w-5 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-xs md:text-sm text-primary">{item.title}</p>
                      <p className="text-xs md:text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative bg-muted min-h-[300px] md:min-h-[400px]">
              <div className="absolute inset-0">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!4v1776239036628!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ0tfLW1Da2dF!2m2!1d51.0160639!2d-3.1349833!3f260!4f10!5f0.7820865974627469"
                  title="Virtual tour of Bishops Hull Hub"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-black/60 backdrop-blur-md text-white border-none px-4 py-2 uppercase tracking-tighter text-xs font-bold">
                  Virtual Tour
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aerial Drone Tour — pairs with the street-level virtual tour above */}
      <DroneTourSection />

      {/* Quick Access Cards - 50/50 Split on Tablets/Mobile */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
          {[
            {
              title: "Event Tickets",
              desc: "Book upcoming village events and fundraisers. Event's such as our Fish and Chips Quiz Night",
              icon: Ticket,
              href: "/whats-on#tickets",
              color: "bg-white"
            },
            {
              title: "Join the 100 Club",
              desc: "Support your hub and win monthly prizes.",
              icon: Heart,
              href: "/community#100-club",
              color: "bg-white"
            }
          ].map((item, idx) => (
            <Card key={idx} className={`${item.color} shadow-xl border-t-4 border-t-primary hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/30 transition-all duration-300 ease-out rounded-[2rem]`}>
              <CardHeader className="p-5 md:p-8">
                <item.icon className="h-8 w-8 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-xl md:text-2xl font-headline text-primary">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-8 pt-0 space-y-4">
                <p className="text-sm md:text-base text-muted-foreground">{item.desc}</p>
                <Link 
                  href={item.href} 
                  className="inline-flex items-center text-primary font-semibold hover:gap-2 transition-all"
                >
                  Find out more <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Youth Hub Module */}
      <section className="container mx-auto px-4 py-4 md:py-8">
        <div className="bg-primary/5 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-primary/10 grid grid-cols-1 lg:grid-cols-2">
          <div className="p-6 md:p-16 flex flex-col justify-center space-y-4 md:space-y-6">
            <div className="inline-block w-fit px-4 py-1 bg-accent/20 text-primary font-bold rounded-full text-xs md:text-sm uppercase tracking-wider">
              Featured Activity
            </div>
            <h2 className="text-2xl md:text-4xl font-headline font-bold text-primary">The Youth Hub</h2>
            <div className="space-y-4 text-sm md:text-lg text-muted-foreground leading-relaxed">
              <p>
                A safe and vibrant space for our village's teenagers.
              </p>
              <p className="font-semibold text-foreground flex items-center">
                <CalendarDays className="inline mr-2 h-5 w-5 text-primary shrink-0" />
                Every 3rd Saturday
              </p>
            </div>
            <Button asChild size="lg" className="w-fit rounded-xl">
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdbFE1XNPMMnVcUxeR7XnxVJa-qyC7vrPxmlgF3g4AXDmzkoA/viewform" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Register Interest
              </a>
            </Button>
          </div>
          <div className="relative h-[250px] md:h-auto">
            <Image
              src={youthImage?.imageUrl || "https://picsum.photos/seed/bhh-youth/600/400"}
              alt="Youth Activities"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              data-ai-hint="teens playing games"
            />
          </div>
        </div>
      </section>

      {/* Google Reviews Carousel */}
      <ReviewsCarousel />

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary via-primary to-teal-600 text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4 text-center space-y-6 md:space-y-8">
          <h2 className="text-2xl md:text-5xl font-headline font-bold">Ready to Host Your Event?</h2>
          <p className="text-base md:text-xl max-w-2xl mx-auto opacity-90">
            Perfect for birthday parties, meetings, classes, and receptions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-base md:text-lg rounded-xl h-12 md:h-14">
              <Link href="/hire#booking-form">Inquire Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
