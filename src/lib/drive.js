// Google Drive REST — lists / creates / renames / trashes Google Docs inside
// a specific folder. The docs live only in Drive (no duplication); Life OS is
// just the interface. Google Docs handles real-time editing + autosave natively.

const API = 'https://www.googleapis.com/drive/v3';

// The Drive folder that backs the "Estudos Livres" module. Set your own folder
// ID via .env (see .env.example) — no real Drive ID in the public build.
const FOLDER_ID = import.meta.env.VITE_DRIVE_STUDIES_FOLDER_ID || '';
export const STUDIES_FOLDER = {
  id: FOLDER_ID,
  name: 'Estudos Livres',
  url: `https://drive.google.com/drive/folders/${FOLDER_ID}`,
};

export async function listDocs(token, folderId = STUDIES_FOLDER.id) {
  const q = `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,modifiedTime,createdTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '200',
  });
  const r = await fetch(`${API}/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Drive respondeu ${r.status}`);
  const data = await r.json();
  return data.files || [];
}

export async function createDoc(token, name, folderId = STUDIES_FOLDER.id) {
  const r = await fetch(`${API}/files?fields=id,name,modifiedTime,createdTime`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.document', parents: [folderId] }),
  });
  if (!r.ok) throw new Error(`Falha ao criar o documento (${r.status})`);
  return r.json();
}

export async function renameDoc(token, id, name) {
  const r = await fetch(`${API}/files/${id}?fields=id,name`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error(`Falha ao renomear (${r.status})`);
  return r.json();
}

export async function trashDoc(token, id) {
  const r = await fetch(`${API}/files/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  });
  if (!r.ok) throw new Error(`Falha ao excluir (${r.status})`);
  return true;
}

export const docEditUrl = (id) => `https://docs.google.com/document/d/${id}/edit`;
export const docEmbedUrl = (id) => `https://docs.google.com/document/d/${id}/edit?embedded=true`;
