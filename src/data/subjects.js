// DEMO DATA — "Matérias da Faculdade" maps disciplines to their Google Drive
// folders. In the real app the folder structure is read once and the contents
// are shown live via Drive's embedded folder view, so nothing is duplicated.
// The folder IDs below are placeholders — no real Drive IDs in the public build.

export const SUBJECTS_ROOT = {
  id: '',
  title: 'Semestre — RI (exemplo)',
  viewUrl: 'https://drive.google.com/drive/folders/',
};

// Discipline subfolders (placeholders).
export const SUBJECTS = [
  { id: '', label: 'Temas II', modified: '2026-07-27' },
  { id: '', label: 'Cenários Estratégicos I', modified: '2026-07-27' },
  { id: '', label: 'DI — Privado', modified: '2026-07-27' },
  { id: '', label: 'ECOBRA II', modified: '2026-07-27' },
  { id: '', label: 'Negócios II', modified: '2026-07-27' },
  { id: '', label: 'PEB I', modified: '2026-07-27' },
  { id: '', label: 'ECO INTER II', modified: '2026-07-27' },
  { id: '', label: 'Políticas Públicas II', modified: '2026-07-27' },
  { id: '', label: 'Monografia I', modified: '2026-07-27' },
];

// Live, embeddable view of a Drive folder's contents.
export const embeddedFolderUrl = (id, view = 'grid') =>
  `https://drive.google.com/embeddedfolderview?id=${id}#${view}`;

export const driveFolderUrl = (id) => `https://drive.google.com/drive/folders/${id}`;
