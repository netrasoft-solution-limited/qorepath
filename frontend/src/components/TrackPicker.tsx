// Track switcher for tutors on more than one track (e.g. teaching Cohort 1 and Cohort 2).
export function TrackPicker({ programs, value, onChange }: { programs: any[]; value: string; onChange: (id: string) => void }) {
  if (programs.length < 2) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-qore-medium bg-white"
    >
      {programs.map((p) => (
        <option key={p.id} value={p.id}>{p.track}{p.cohort?.name ? ` · ${p.cohort.name}` : ''}</option>
      ))}
    </select>
  );
}
