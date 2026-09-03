import React, { useState } from 'react';
import { Code, X, Copy, Check, Folder, ChevronDown, ChevronRight, Search, FileCode, Layers, ShieldCheck } from 'lucide-react';

interface FlaskCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileItem {
  name: string;
  path: string;
  type: string;
  category: 'Frontend' | 'Backend';
  iconColor: string;
  lang: string;
}

export const FlaskCodeViewerModal: React.FC<FlaskCodeViewerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const filesList: FileItem[] = [
    // Frontend Folder
    { name: 'Frontend/src/App.tsx', path: '/Frontend/src/App.tsx', type: 'React App Entry Point', category: 'Frontend', iconColor: 'text-amber-500', lang: 'typescript' },
    { name: 'Frontend/src/main.tsx', path: '/Frontend/src/main.tsx', type: 'React Main Entry Point', category: 'Frontend', iconColor: 'text-amber-500', lang: 'typescript' },
    { name: 'Frontend/package.json', path: '/Frontend/package.json', type: 'NPM Manifest & Scripts', category: 'Frontend', iconColor: 'text-amber-500', lang: 'json' },
    { name: 'Frontend/vite.config.ts', path: '/Frontend/vite.config.ts', type: 'Vite Bundler Config', category: 'Frontend', iconColor: 'text-amber-500', lang: 'typescript' },

    // Backend Folder
    { name: 'Backend/app.py', path: '/Backend/app.py', type: 'Python Flask Entry Point', category: 'Backend', iconColor: 'text-emerald-400', lang: 'python' },
    { name: 'Backend/config.py', path: '/Backend/config.py', type: 'Flask Settings & Atlas ENV', category: 'Backend', iconColor: 'text-emerald-400', lang: 'python' },
    { name: 'Backend/database/db.py', path: '/Backend/database/db.py', type: 'MongoDB PyMongo Setup', category: 'Backend', iconColor: 'text-emerald-400', lang: 'python' },
    { name: 'Backend/models/student.py', path: '/Backend/models/student.py', type: 'Student Model (Mongo)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'Backend/models/professor.py', path: '/Backend/models/professor.py', type: 'Professor Model (Mongo)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'Backend/models/subject.py', path: '/Backend/models/subject.py', type: 'Subject Model (CRUD & Code)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'Backend/models/classroom.py', path: '/Backend/models/classroom.py', type: 'Classroom Model (CRUD & Status)', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'Backend/models/timetable.py', path: '/Backend/models/timetable.py', type: 'Timetable & Clash Model', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'Backend/models/notification.py', path: '/Backend/models/notification.py', type: 'Notification Model', category: 'Backend', iconColor: 'text-purple-400', lang: 'python' },
    { name: 'Backend/routes/auth.py', path: '/Backend/routes/auth.py', type: 'Authentication Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'Backend/routes/student.py', path: '/Backend/routes/student.py', type: 'Student Dashboard Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'Backend/routes/professor.py', path: '/Backend/routes/professor.py', type: 'Professor Dashboard Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'Backend/routes/admin.py', path: '/Backend/routes/admin.py', type: 'Admin CRUD Blueprint', category: 'Backend', iconColor: 'text-blue-400', lang: 'python' },
    { name: 'Backend/utils/pdf_generator.py', path: '/Backend/utils/pdf_generator.py', type: 'ReportLab PDF Generator', category: 'Backend', iconColor: 'text-rose-400', lang: 'python' },
    { name: 'Backend/utils/seed_data.py', path: '/Backend/utils/seed_data.py', type: 'MongoDB Seeder Script', category: 'Backend', iconColor: 'text-rose-400', lang: 'python' },
    { name: 'Backend/requirements.txt', path: '/Backend/requirements.txt', type: 'PIP Dependencies', category: 'Backend', iconColor: 'text-slate-400', lang: 'text' },
    { name: 'Backend/.env.example', path: '/Backend/.env.example', type: 'Secrets & Environment Variables', category: 'Backend', iconColor: 'text-slate-400', lang: 'text' }
  ];

  const [selectedFile, setSelectedFile] = useState<FileItem>(filesList[4]);
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<{ Frontend: boolean; Backend: boolean }>({
    Frontend: true,
    Backend: true
  });

  const toggleFolder = (folder: 'Frontend' | 'Backend') => {
    setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // File contents snippets
  const getFileContent = (filename: string) => {
    const cleanName = filename.replace(/^Frontend\//, '').replace(/^Backend\//, '');
    switch (cleanName) {
      case 'app.py':
        return `from flask import Flask, render_template, redirect, url_for, session\nfrom config import Config\nfrom database.db import init_db, get_db\nfrom routes.auth import auth_bp\nfrom routes.student import student_bp\nfrom routes.professor import professor_bp\nfrom routes.admin import admin_bp\n\napp = Flask(__name__)\napp.config.from_object(Config)\ninit_db(app)\n\n# Register Flask Blueprints\napp.register_blueprint(auth_bp)\napp.register_blueprint(student_bp)\napp.register_blueprint(professor_bp)\napp.register_blueprint(admin_bp)\n\n@app.route('/')\ndef index():\n    if 'user' in session:\n        role = session['user'].get('role')\n        if role == 'student':\n            return redirect(url_for('student.dashboard'))\n        elif role == 'professor':\n            return redirect(url_for('professor.dashboard'))\n        elif role == 'admin':\n            return redirect(url_for('admin.dashboard'))\n    return redirect(url_for('auth.login'))\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=3000, debug=True)`;

      case 'config.py':
        return `import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\nclass Config:\n    SECRET_KEY = os.getenv('SECRET_KEY', 'ssec_it_dept_secret_key_2026')\n    MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0')\n    MONGO_DBNAME = os.getenv('MONGO_DB_NAME', 'ssec_timetable_db')\n    DEBUG = True`;

      case 'database/db.py':
        return `import os\nfrom flask_pymongo import PyMongo\nfrom pymongo import MongoClient\nfrom pymongo.server_api import ServerApi\n\nMONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0')\nMONGO_DBNAME = os.getenv('MONGO_DB_NAME', 'ssec_timetable_db')\n\nmongo = PyMongo()\n_client = None\n\ndef init_db(app):\n    global _client\n    app.config['MONGO_URI'] = MONGO_URI\n    try:\n        mongo.init_app(app)\n        _client = MongoClient(MONGO_URI, server_api=ServerApi('1'))\n        _client.admin.command('ping')\n        print("Connected to MongoDB Atlas platform successfully.")\n    except Exception as e:\n        print(f"MongoDB Atlas Notice: {e}")\n\ndef get_db():\n    if mongo.db is not None:\n        return mongo.db\n    if _client is not None:\n        return _client[MONGO_DBNAME]\n    fallback_client = MongoClient(MONGO_URI)\n    return fallback_client[MONGO_DBNAME]`;

      case 'models/subject.py':
        return `from database.db import get_db\nfrom bson.objectid import ObjectId\n\nclass SubjectModel:\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.subjects.find())\n\n    @staticmethod\n    def create(code, name, semester, credits, type_):\n        db = get_db()\n        if db.subjects.find_one({"code": code}):\n            return None, f"Subject Code '{code}' already exists!"\n        new_sub = {\n            "code": code,\n            "name": name,\n            "semester": int(semester),\n            "credits": int(credits),\n            "type": type_\n        }\n        res = db.subjects.insert_one(new_sub)\n        return str(res.inserted_id), None\n\n    @staticmethod\n    def update(subject_id, update_data):\n        db = get_db()\n        if "code" in update_data:\n          existing = db.subjects.find_one({"code": update_data["code"], "_id": {"$ne": ObjectId(subject_id)}})\n          if existing:\n            return False, f"Subject Code '{update_data['code']}' is already in use!"\n        db.subjects.update_one({"_id": ObjectId(subject_id)}, {"$set": update_data})\n        return True, None\n\n    @staticmethod\n    def delete(subject_id):\n        db = get_db()\n        db.subjects.delete_one({"_id": ObjectId(subject_id)})\n        return True`;

      case 'models/classroom.py':
        return `from database.db import get_db\nfrom bson.objectid import ObjectId\n\nclass ClassroomModel:\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.classrooms.find())\n\n    @staticmethod\n    def create(room_number, building, capacity, type_, status="Available"):\n        db = get_db()\n        if db.classrooms.find_one({"room_number": room_number}):\n            return None, f"Room Number '{room_number}' already exists!"\n        new_room = {\n            "room_number": room_number,\n            "building": building,\n            "capacity": int(capacity),\n            "type": type_,\n            "status": status\n        }\n        res = db.classrooms.insert_one(new_room)\n        return str(res.inserted_id), None\n\n    @staticmethod\n    def update(room_id, update_data):\n        db = get_db()\n        if "room_number" in update_data:\n          existing = db.classrooms.find_one({"room_number": update_data["room_number"], "_id": {"$ne": ObjectId(room_id)}})\n          if existing:\n            return False, f"Room Number '{update_data['room_number']}' is already taken!"\n        db.classrooms.update_one({"_id": ObjectId(room_id)}, {"$set": update_data})\n        return True, None\n\n    @staticmethod\n    def delete(room_id):\n        db = get_db()\n        db.classrooms.delete_one({"_id": ObjectId(room_id)})\n        return True`;

      case 'models/timetable.py':
        return `from database.db import get_db\nfrom bson.objectid import ObjectId\n\nclass TimetableModel:\n    @staticmethod\n    def create(semester, classroom, day, time_slot, subject, professor, room_number):\n        db = get_db()\n        # Collision detection logic...\n        collision = db.timetables.find_one({"day": day, "time_slot": time_slot, "room_number": room_number})\n        if collision:\n            return None, "Room clash detected!"\n        # Insert into mongodb...`;

      case 'models/student.py':
        return `from database.db import get_db\n\nclass StudentModel:\n    @staticmethod\n    def get_by_enrollment(enrollment_no):\n        db = get_db()\n        return db.students.find_one({"enrollment_no": enrollment_no})\n\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.students.find())`;

      case 'models/professor.py':
        return `from database.db import get_db\n\nclass ProfessorModel:\n    @staticmethod\n    def get_by_id(professor_id):\n        db = get_db()\n        return db.professors.find_one({"professor_id": professor_id})\n\n    @staticmethod\n    def get_all():\n        db = get_db()\n        return list(db.professors.find())`;

      case 'routes/admin.py':
        return `from flask import Blueprint, render_template, request, jsonify, redirect, url_for\nfrom models.subject import SubjectModel\nfrom models.classroom import ClassroomModel\nfrom models.timetable import TimetableModel\n\nadmin_bp = Blueprint('admin', __name__, url_prefix='/admin')\n\n@admin_bp.route('/dashboard')\ndef dashboard():\n    subjects = SubjectModel.get_all()\n    classrooms = ClassroomModel.get_all()\n    return render_template('admin_dashboard.html', subjects=subjects, classrooms=classrooms)\n\n@admin_bp.route('/subjects/add', methods=['POST'])\ndef add_subject():\n    code = request.form.get('code')\n    name = request.form.get('name')\n    semester = request.form.get('semester')\n    credits = request.form.get('credits')\n    type_ = request.form.get('type')\n    res, err = SubjectModel.create(code, name, semester, credits, type_)\n    if err:\n        return jsonify({"success": False, "error": err})\n    return jsonify({"success": True, "subject_id": res})`;

      case 'requirements.txt':
        return `Flask==3.0.2\nflask-pymongo==2.3.0\npymongo[srv]==4.6.2\npython-dotenv==1.0.1\nreportlab==4.1.0\ngunicorn==21.2.0`;

      case '.env.example':
        return `SECRET_KEY=ssec_it_department_secure_key_2026\nMONGO_URI=mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0\nMONGO_DB_NAME=ssec_timetable_db\nPORT=3000`;

      default:
        return `# Source file available in workspace at ${selectedFile.path}\n# Run: python3 app.py to start Flask backend server!`;
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(getFileContent(selectedFile.name));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = filesList.filter(f =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    f.type.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const frontendFiles = filteredFiles.filter(f => f.category === 'Frontend');
  const backendFiles = filteredFiles.filter(f => f.category === 'Backend');

  const fileContent = getFileContent(selectedFile.name);
  const codeLines = fileContent.split('\n');

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* IDE Top Navigation Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-slate-200">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm text-slate-100 tracking-wide">Frontend / Backend Project Explorer</span>
              <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                SSEC IT Dept Architecture
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IDE Split Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900">
          
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-72 bg-slate-950/90 border-r border-slate-800 flex flex-col shrink-0">
            {/* Explorer Header & Search */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Project Structure
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                  {filesList.length} files
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Tree Navigation */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 font-mono text-xs">
              
              {/* FOLDER 1: FRONTEND */}
              <div>
                <button
                  onClick={() => toggleFolder('Frontend')}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    {openFolders.Frontend ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    <span className="font-bold text-slate-200">Frontend</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans group-hover:text-slate-400">
                    {frontendFiles.length} items
                  </span>
                </button>

                {openFolders.Frontend && (
                  <div className="ml-4 pl-2 border-l border-slate-800 space-y-0.5 mt-1">
                    {frontendFiles.length === 0 ? (
                      <span className="text-[11px] text-slate-600 px-2 py-1 block italic font-sans">No matching files</span>
                    ) : (
                      frontendFiles.map(f => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFile(f)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                            selectedFile.name === f.name
                              ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileCode className={`w-3.5 h-3.5 shrink-0 ${f.iconColor}`} />
                            <span className="truncate">{f.name.replace('Frontend/', '')}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* FOLDER 2: BACKEND */}
              <div>
                <button
                  onClick={() => toggleFolder('Backend')}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    {openFolders.Backend ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    <span className="font-bold text-slate-200">Backend</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans group-hover:text-slate-400">
                    {backendFiles.length} items
                  </span>
                </button>

                {openFolders.Backend && (
                  <div className="ml-4 pl-2 border-l border-slate-800 space-y-0.5 mt-1">
                    {backendFiles.length === 0 ? (
                      <span className="text-[11px] text-slate-600 px-2 py-1 block italic font-sans">No matching files</span>
                    ) : (
                      backendFiles.map(f => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFile(f)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                            selectedFile.name === f.name
                              ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileCode className={`w-3.5 h-3.5 shrink-0 ${f.iconColor}`} />
                            <span className="truncate">{f.name.replace('Backend/', '')}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Sidebar Footer info */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1 font-sans">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Atlas Connected
              </div>
              <p className="text-[10px] text-slate-500">PyMongo MongoDB Driver & React Frontend</p>
            </div>

          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
            
            {/* Editor File Tab Header */}
            <div className="bg-slate-950/80 border-b border-slate-800 flex justify-between items-center px-4 py-2.5">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-sky-300 px-3 py-1 rounded-lg text-xs font-mono">
                  <FileCode className={`w-3.5 h-3.5 ${selectedFile.iconColor}`} />
                  <span className="font-semibold">{selectedFile.path}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                  {selectedFile.type}
                </span>
              </div>

              <button
                onClick={copyContent}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Editor Content Area with Line Numbers */}
            <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs flex">
              {/* Line Numbers Column */}
              <div className="py-4 px-3 text-right bg-slate-950 text-slate-600 border-r border-slate-800/80 select-none font-mono min-w-[3rem]">
                {codeLines.map((_, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Code Lines */}
              <div className="p-4 flex-1 text-slate-200 leading-relaxed overflow-x-auto whitespace-pre font-medium">
                {fileContent}
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex justify-between items-center text-[11px] text-slate-500 font-sans">
              <div className="flex items-center space-x-3 font-mono">
                <span>{selectedFile.lang.toUpperCase()}</span>
                <span>•</span>
                <span>{codeLines.length} lines</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">SSEC IT Dept Backend Architecture</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
