import { useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { PitchPage } from './components/PitchPage';
import { PlannerPage } from './components/PlannerPage';
import { JournalPage } from './components/JournalPage';
import { navItems, type CityName } from './data/mockData';

type PageId = (typeof navItems)[number]['id'];
type FootprintDetail = 'places' | 'mileage' | 'cities' | 'photos';

function App() {
  const [page, setPage] = useState<PageId>('home');
  const [plannerCity, setPlannerCity] = useState<CityName>('宜昌');
  const [plannerPrompt, setPlannerPrompt] = useState('');
  const [journalFocus, setJournalFocus] = useState<FootprintDetail | null>(null);

  const navigate = (next: PageId) => {
    if (next !== 'journal') {
      setJournalFocus(null);
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCity = (city: CityName) => {
    setPlannerCity(city);
    navigate('planner');
  };

  const openFootprintDetail = (detail: FootprintDetail) => {
    setJournalFocus(detail);
    setPage('journal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-ink">
      <Header page={page} nav={navItems} onNavigate={navigate} />
      {page === 'home' && <LandingPage onStart={(prompt) => { setPlannerPrompt(prompt ?? ''); navigate('planner'); }} onCitySelect={selectCity} onFootprintDetail={openFootprintDetail} />}
      {page === 'planner' && <PlannerPage initialCity={plannerCity} initialPrompt={plannerPrompt} />}
      {page === 'journal' && <JournalPage onPlan={() => navigate('planner')} initialFocus={journalFocus} />}
      {page === 'pitch' && <PitchPage />}
      <Footer />
    </div>
  );
}

export default App;
