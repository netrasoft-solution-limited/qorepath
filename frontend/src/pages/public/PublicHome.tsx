import { OrbitHero } from './home/OrbitHero';
import { SkillMarquee } from './home/SkillMarquee';
import { JourneyPath } from './home/JourneyPath';
import { ClassroomPreview } from './home/ClassroomPreview';
import { BentoFeatures } from './home/BentoFeatures';
import { TrackShowcase } from './home/TrackShowcase';
import { Voices } from './home/Voices';
import { Faq, LaunchCta } from './home/FaqAndLaunch';
import { useOpenPrograms } from './home/useOpenPrograms';

// Landing page. Sections live in ./home; track data comes from the live API with static fallbacks.
export function PublicHome() {
  const programs = useOpenPrograms();
  return (
    <div className="w-full overflow-x-hidden bg-white">
      <OrbitHero programs={programs} />
      <SkillMarquee />
      <JourneyPath />
      <ClassroomPreview />
      <BentoFeatures programs={programs} />
      <TrackShowcase programs={programs} />
      <Voices />
      <Faq />
      <LaunchCta />
    </div>
  );
}
