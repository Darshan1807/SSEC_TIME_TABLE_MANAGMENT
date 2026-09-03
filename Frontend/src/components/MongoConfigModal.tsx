import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Database, X, CheckCircle2, Copy, Sparkles, Terminal } from 'lucide-react';

interface MongoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoConfigModal: React.FC<MongoConfigModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const config = StorageService.getMongoConfig();
  const [mongoUri, setMongoUri] = useState(config.mongo_uri);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    StorageService.setMongoConfig({
      ...config,
      mongo_uri: mongoUri,
      is_connected: true
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const copyPySnippet = () => {
    const snippet = `from flask_pymongo import PyMongo\napp.config["MONGO_URI"] = "${mongoUri}"\nmongo = PyMongo(app)`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8">
        
        <div className="flex justify-between items-center border-b border-slate-200 pb-5 bg-sky-50/50 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 pt-6 sm:pt-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">MongoDB Atlas Integration</h3>
              <p className="text-xs font-semibold text-slate-500">Database: <span className="text-emerald-700 font-mono">ssec_timetable_db</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Connection Status</span>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Atlas Active
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">MongoDB Atlas URI Connection String</label>
            <input
              type="text"
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all shadow-xs"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-500 font-medium">Configured in <code className="text-sky-700 font-mono font-semibold">Backend/.env</code> & <code className="text-sky-700 font-mono font-semibold">Backend/config.py</code></span>
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
            >
              {saved ? 'Saved!' : 'Save URI Config'}
            </button>
          </div>
        </div>

        {/* Python PyMongo Integration Snippet */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-600" />
              Flask PyMongo Integration Code
            </span>
            <button
              onClick={copyPySnippet}
              className="text-sky-600 hover:text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
            </button>
          </div>

          <pre className="bg-white p-4 rounded-xl text-xs text-slate-800 font-mono overflow-x-auto border border-slate-200 leading-relaxed font-medium shadow-xs">
            {`from flask import Flask\nfrom flask_pymongo import PyMongo\n\napp = Flask(__name__)\napp.config["MONGO_URI"] = "${mongoUri}"\nmongo = PyMongo(app)\n\n# Collections: students, professors, timetables`}
          </pre>
        </div>

      </div>
    </div>
  );
};
