
import React, { useState } from 'react';
import { X, Copy, Check, Cloud, HelpCircle } from 'lucide-react';

interface GoogleIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptUrl: string;
  onSaveUrl: (url: string) => void;
}

export const GoogleIntegrationModal: React.FC<GoogleIntegrationModalProps> = ({
  isOpen,
  onClose,
  scriptUrl,
  onSaveUrl
}) => {
  const [urlInput, setUrlInput] = useState(scriptUrl);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveUrl(urlInput);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(gsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gsCode = `
function doGet() {
  return ContentService.createTextOutput(JSON.stringify(getAllData()))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  saveData(data);
  return ContentService.createTextOutput("Success");
}

function getAllData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    result.push(row);
  }
  return result;
}

function saveData(jsonData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clearContents();
  
  if (jsonData.length === 0) return;
  
  var headers = Object.keys(jsonData[0]);
  sheet.appendRow(headers);
  
  var rows = jsonData.map(function(item) {
    return headers.map(function(header) { return item[header]; });
  });
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}
  `.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#002F6C] text-white">
          <div className="flex items-center">
            <Cloud className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-bold">Integrasi Google Drive (Sheets)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900 flex items-center mb-2">
              <HelpCircle className="w-5 h-5 mr-2" />
              Cara Menghubungkan ke Google Drive:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2 ml-2">
              <li>Buka <strong>Google Drive</strong> dan buat <strong>Google Spreadsheet</strong> baru.</li>
              <li>Di menu spreadsheet, klik <strong>Ekstensi</strong> {'>'} <strong>Apps Script</strong>.</li>
              <li>Hapus semua kode yang ada, lalu <strong>Copy & Paste</strong> kode di bawah ini.</li>
              <li>Klik tombol <strong>Terapkan (Deploy)</strong> {'>'} <strong>Deployment Baru</strong>.</li>
              <li>Pilih jenis: <strong>Aplikasi Web</strong>.</li>
              <li>Akses: set ke <strong>Siapa saja (Anyone)</strong>.</li>
              <li>Klik <strong>Terapkan</strong>, lalu salin <strong>URL Aplikasi Web</strong>.</li>
              <li>Tempel URL tersebut ke kolom input di bagian bawah halaman ini.</li>
            </ol>
          </div>

          {/* Section 2: Code Snippet */}
          <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-mono">Code.gs</span>
              <button 
                onClick={handleCopy}
                className="flex items-center text-xs text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
              >
                {copied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                {copied ? 'Disalin!' : 'Salin Kode'}
              </button>
            </div>
            <pre className="p-4 text-gray-300 text-xs font-mono overflow-x-auto h-64">
              {gsCode}
            </pre>
          </div>

          {/* Section 3: Input URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Aplikasi Web (Web App URL)
            </label>
            <input 
              type="text" 
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              *Pastikan deployment script diatur ke "Siapa saja" (Anyone) agar aplikasi dapat menyimpan data.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-[#EE2E24] text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm transition-colors"
          >
            Simpan & Koneksikan
          </button>
        </div>
      </div>
    </div>
  );
};
