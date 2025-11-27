// src/components/OurStoryTimeline.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Phone, Briefcase, Heart, Lightbulb, CheckCircle, Users } from 'lucide-react';
import { HeartPulse } from 'lucide-react';

// Define the structure for a story point
interface StoryPoint {
  id: number;
  title: string;
  description: string; // Now directly holds the full story
  icon: React.ElementType; // Type for Lucide icons
}

// The story broken down into key points with the full story directly
const storyPoints: StoryPoint[] = [
  {
    id: 1,
    title: "How we Started",
    description: "We began not as a company, but as weekly phone calls. We were friends, but we shared the same private crisis. Watching the immense toll of eldercare fall on our families.",
    icon: Phone,
  },
  {
    id: 2,
    title: "The Turning Point",
    description: "My father-in-law's vascular dementia was the turning point. I watched my wife, a banking executive, wrestle with hospital appointments, frustrating calls to health officials, and endless financial applications just to provide a dignified life for her father. For us, this was the very definition of the administrative chaos most career professionals have to endure.",
    icon: HeartPulse,
  },
  {
    id: 3,
    title: "Our Therapeutic Space",
    description: "We were successful professionals who felt powerless. Our weekly calls became our only therapeutic space, a place where we could trade insights, admit the sheer impossibility of the juggling act and be completely vulnerable about the stresses we both faced supporting our wives and keeping our families together.",
    icon: Briefcase,
  },
  {
    id: 4,
    title: "The Shared Challenge",
    description: "We realized that our bond was only understood by other career professionals experiencing the same challenge. And that shared challenge was the true foundation of poetiq. A private community where everyone understood your struggle.",
    icon: Heart,
  },
  {
    id: 5,
    title: "Our Strategic Approach",
    description: "Enough was enough, we are competent career professionals with 30+ years in corporate spaces as Lawyers, directors, founders, vice presidents. So we decided to stop trying to simply survive. We started applying three decades of building solutions to our personal chaos.",
    icon: Lightbulb,
  },
  {
    id: 6,
    title: "The Profound Relief",
    description: "Now, we are committed to sharing that blueprint. We don't just help you find answers to complex demands like grant applications or care home reviews; we help you experience the profound relief of knowing you are not compromising your parents' dignity or your own professional future.",
    icon: CheckCircle,
  },
  {
    id: 7,
    title: "Our Promise to You",
    description: <>We’re building a community of exceptional professionals who care deeply about the current state of eldercare and strive to fix it. Not just for their parents but for generations to come. We're building this community because we need it. <br/><br/> Let's build it together! ❤️🧡💛</>,
    icon: Users,
  },
];

export function OurStoryTimeline() {
  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = parseInt(entry.target.getAttribute('data-id') || '0');
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(id));
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.3,
      }
    );

    timelineRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      timelineRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, []);

  return (
    <section className="py-8 sm:py-8 bg-white"> {/* Changed bg-gray-50 to bg-white */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-red-400 text-center mb-16">
          Our Story 
        </h2>

        <div className="relative">
          {/* Vertical Line: This is the central line of the timeline */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-gray-100 to-gray-50 h-full rounded-full"></div>

          {storyPoints.map((point, index) => {
            const isEven = index % 2 === 0;
            const isVisible = visibleItems.has(point.id);
            const IconComponent = point.icon;

            return (
              <div
                key={point.id}
                ref={(el) => (timelineRefs.current[index] = el)}
                data-id={point.id}
                className={`mb-12 flex items-center w-full relative ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}
              >
                {/* Content Block: Displays the title and description */}
                <div
                  className={`w-full md:w-1/2 p-6 rounded-lg shadow-md bg-white shadow-red-500/60 hover:shadow-xl hover:shadow-red-500/80 
                    ${isEven ? 'md:ml-auto md:text-left' : 'md:mr-auto md:text-left'}
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                    transition-all duration-700 ease-out
                    ${isEven ? 'md:pr-16 md:pl-16' : 'md:pr-10 md:pl-10'} 
                    `}
                   
                >
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{point.title}</h3>
                  <p className="text-gray-700">{point.description}</p> {/* Directly display description */}
                </div>

                {/* Circle with Icon: Positioned on the central vertical line */}
                <div className="absolute hidden sm:block left-1/2 transform -translate-x-1/2 z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center 
                    ${isVisible ? 'bg-red-500 text-white shadow-lg scale-100' : 'bg-gray-300 text-gray-600 scale-75'}
                    transition-all duration-700 ease-out`}>
                    <IconComponent className="w-6 h-6 hidden sm:block" />
                  </div>
                </div>

                {/* Spacer: Used to push the content block away from the center line on desktop */}
                <div className="hidden md:block w-1/2"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
