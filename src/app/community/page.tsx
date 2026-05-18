
import type { Metadata } from 'next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Heart, Landmark, Music, Wind, Hand, TreePine, Accessibility, Download, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Projects | Bishops Hull Hub',
  description:
    'Discover the community projects supported by Bishops Hull Hub — the sensory trail, garden, accessibility initiatives and ways to get involved in Bishops Hull, Taunton.',
  alternates: { canonical: '/community' },
  openGraph: {
    title: 'Community Projects | Bishops Hull Hub',
    description:
      'Sensory trail, community garden and other projects at the heart of Bishops Hull.',
    url: 'https://bhhub.co.uk/community',
    type: 'website',
  },
};

export default function CommunityPage() {
  const sensoryMain = PlaceHolderImages.find(img => img.id === 'sensory-trail-main');
  // const phase1Img = PlaceHolderImages.find(img => img.id === 'sensory-phase-1');
  // const phase2Img = PlaceHolderImages.find(img => img.id === 'sensory-phase-2');
  // const phase3Img = PlaceHolderImages.find(img => img.id === 'sensory-phase-3');

  return (
    <div className="container mx-auto px-4 py-16 space-y-24">
      {/* Introduction */}
      <section className="max-w-3xl space-y-6">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Community & Support</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The Hub is more than just a building; it's a testament to what our village can achieve together. 
          Discover how you can get involved and support our ongoing projects.
        </p>
      </section>

      {/* Volunteer Section */}
      <section className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="h-20 w-20 bg-primary text-primary-foreground rounded-3xl flex items-center justify-center shrink-0 shadow-lg">
          <Users className="h-10 w-10" />
        </div>
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">Volunteer with the Hub</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            There are so many ways to help keep the Hub running — from supporting the committee and attending meetings, to welcoming hirers and helping with day-to-day operations.
            We'd love to get to know you and find a role that suits you perfectly.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Whether it's just an hour here and there or something more involved, every bit of help makes a real difference.
            Let us know you're interested and we'll be glad to have you on the team.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="rounded-xl px-8">
              <a href="mailto:bishopshullhub@gmail.com?subject=Volunteer%20Interest">Get in Touch</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Sensory Trail - The Main Feature */}
      <section id="sensory-trail" className="scroll-mt-24 space-y-16">
        <div className="relative rounded-[3rem] overflow-hidden bg-primary text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 opacity-20 z-0">
             <Image 
                src={sensoryMain?.imageUrl || "https://picsum.photos/seed/sensory-1/1200/600"} 
                alt="Sensory Trail Entrance" 
                fill 
                className="object-cover"
                data-ai-hint="sensory garden entrance"
             />
          </div>
          <div className="relative z-10 p-8 md:p-16 space-y-8 max-w-4xl">
            
            <h2 className="text-4xl md:text-6xl font-headline font-bold leading-tight">The Bishops Hull Sensory Trail</h2>
            <p className="text-xl md:text-2xl opacity-90 leading-relaxed font-medium">
              A new way to discover the natural beauty of Bishops Hull. Designed for all ages and abilities to connect with nature through touch, sight, sound, and smell.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="secondary" size="lg" className="rounded-2xl px-8 h-14">
                <a href="/Sensory-Walk-Master-Plan-Amendment-031122.pdf" download>
                  <Download className="mr-2 h-5 w-5" /> Download Trail Map
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Trail Narrative Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-headline font-bold text-primary">Phase 1: Connection and Access</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Provision of access steps and ramp from the Hub and Pavilion up to the top path and play park.
              Additional planting and hedgerows to increase natural greenery.
            </p>
            <div className="p-6 bg-muted/50 rounded-2xl border border-border flex gap-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Hand className="h-5 w-5" />
              </div>
              <p className="text-sm italic">Seamless connection through the natural environment.</p>
            </div>
          </div>
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white">
            <Image 
              src="/Phase 1.jpg" 
              alt="Phase 1 Connection" 
              fill 
              className="object-cover"
              data-ai-hint="garden path"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white lg:order-2">
            <Image 
              src="/Phase 2.jpg" 
              alt="Phase 2 Amphitheatre" 
              fill 
              className="object-cover"
              data-ai-hint="outdoor seating"
            />
          </div>
          <div className="space-y-6 lg:order-1">
            <h3 className="text-3xl font-headline font-bold text-primary">Phase 2: Planting and Amphitheatre</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Additional timber steps from the playing field to the top path.
              Proposed Amphitheatre/ informal seating area.
            </p>
            <div className="p-6 bg-muted/50 rounded-2xl border border-border flex gap-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Music className="h-5 w-5" />
              </div>
              <p className="text-sm italic">Close your eyes and listen to the natural symphony of our local wildlife.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-headline font-bold text-primary">Phase 3: Natural Play</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Kids play area with mounds, log beams and boulders.
              New access path to Jarmyns.
              Re-landscaped mound.
            </p>
            <div className="p-6 bg-muted/50 rounded-2xl border border-border flex gap-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Wind className="h-5 w-5" />
              </div>
              <p className="text-sm italic">Explore the re-landscaped mound and natural play structures.</p>
            </div>
          </div>
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white">
            <Image 
              src="/Phase 3.jpg" 
              alt="Phase 3 Natural Play" 
              fill 
              className="object-cover"
              data-ai-hint="play area"
            />
          </div>
        </div>

        {/* Accessibility Note */}
        <div className="bg-accent/5 border-2 border-accent/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="h-20 w-20 bg-accent text-primary rounded-3xl flex items-center justify-center shrink-0 shadow-lg">
            <Accessibility className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-bold font-headline text-primary">Fully Accessible Design</h4>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The entire 100m trail loop has been meticulously planned to be fully accessible. With wide, level paths and high-contrast markers, we ensure that wheelchair users and those with visual impairments can enjoy the trail independently.
            </p>
          </div>
        </div>
      </section>

      {/* Fundraising Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div id="100-club" className="space-y-6 p-10 rounded-[3rem] bg-primary/5 border border-primary/10 scroll-mt-24 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-14 w-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-headline font-bold text-primary">Join the 100 Club</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The 100 Club is a fantastic way to support the maintenance of the Hub while having a chance to win! 
            For just £5 a month, you are entered into our monthly prize draw. All profits go directly towards Hub improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-xl px-8">Sign Up Digitally</Button>
            <Button variant="outline" size="lg" className="rounded-xl px-8">Download Form</Button>
          </div>
        </div>

        <div id="buy-a-brick" className="space-y-6 p-10 rounded-[3rem] bg-accent/5 border border-accent/20 scroll-mt-24 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-14 w-14 bg-accent text-primary rounded-2xl flex items-center justify-center">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-headline font-bold text-primary">Buy a Brick</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Leave a lasting legacy by buying a commemorative brick. Your name or a message will be permanently 
            engraved and placed in our special tribute wall. A perfect gift or memorial for a loved one.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-xl px-8">Order Your Brick</Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-16 space-y-8 border-t border-muted bg-primary/5 rounded-[3rem]">
        <div className="h-16 w-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <TreePine className="h-8 w-8" />
        </div>
        <h2 className="text-2xl md:text-4xl font-headline font-bold text-primary">Want to start a new project?</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          We are always open to new ideas that benefit the Bishops Hull community. 
          Get in touch with the management committee today.
        </p>
        <Button asChild size="lg" className="rounded-2xl px-12 h-14 text-lg shadow-xl">
          <a href="mailto:info@bhhub.co.uk">Contact the Committee</a>
        </Button>
      </section>
    </div>
  );
}
