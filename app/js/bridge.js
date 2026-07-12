/* Platform bridge: uses Electron IPC when available, falls back to
   browser download/upload so the app also runs in a plain browser. */

const el = window.desk;

export const isElectron = !!(el && el.isElectron);

function download(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function saveProject({ filePath, data, suggestedName }) {
  if (isElectron) return el.saveProject({ filePath, data, suggestedName });
  download((suggestedName || 'world') + '.rpgworld', new Blob([data], { type: 'application/json' }));
  return { canceled: false, filePath: null };
}

export async function saveProjectAs({ data, suggestedName }) {
  if (isElectron) return el.saveProjectAs({ data, suggestedName });
  download((suggestedName || 'world') + '.rpgworld', new Blob([data], { type: 'application/json' }));
  return { canceled: false, filePath: null };
}

export async function openProject() {
  if (isElectron) return el.openProject();
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rpgworld,.json';
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return resolve({ canceled: true });
      const r = new FileReader();
      r.onload = () => resolve({ canceled: false, filePath: null, data: r.result });
      r.readAsText(f);
    };
    input.click();
    // if the user closes the dialog we simply never resolve; harmless
  });
}

export async function exportFile({ defaultName, dataBase64, dataText, filters }) {
  if (isElectron) return el.exportFile({ defaultName, dataBase64, dataText, filters });
  if (dataBase64 != null) {
    const bin = atob(dataBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    download(defaultName, new Blob([bytes]));
  } else {
    download(defaultName, new Blob([dataText || ''], { type: 'text/html' }));
  }
  return { canceled: false };
}

export function onMenu(handler) {
  if (isElectron) el.onMenu(handler);
}
