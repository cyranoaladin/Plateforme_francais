import { renderToString } from 'react-dom/server';
import { OralWorkSelector } from '@/app/atelier-oral/components/OralWorkSelector';

describe('OralWorkSelector', () => {
  it('renders works, persona buttons, and warning when requested', () => {
    const html = renderToString(
      <OralWorkSelector
        availableWorks={['Manon Lescaut', 'La Peau de chagrin']}
        currentWork="Manon Lescaut"
        selectedMode="SIMULATION"
        onSelectWork={() => {}}
        onChangeMode={() => {}}
        examinerProfile="NEUTRE"
        onChangeProfile={() => {}}
        showProgrammeWarning
      />,
    );

    expect(html).toContain('Simulation officielle');
    expect(html).toContain('Pratique libre');
    expect(html).toContain('Manon Lescaut');
    expect(html).toContain('programme 2026-2027');
  });

  it('toggler buttons exist for each persona label', () => {
    const html = renderToString(
      <OralWorkSelector
        availableWorks={['Manon Lescaut']}
        currentWork="Manon Lescaut"
        selectedMode="SIMULATION"
        onSelectWork={() => {}}
        onChangeMode={() => {}}
        examinerProfile="BIENVEILLANT"
        onChangeProfile={() => {}}
        showProgrammeWarning={false}
      />,
    );

    expect(html).toContain('Bienveillant');
  });
});
