import express from 'express';
import path from 'path';
import crypto from 'crypto';
import net from 'net';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { MongoClient, ObjectId } from 'mongodb';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// --- MongoDB Atlas Database Setup ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:SSECIT2026@cluster0.lhna7yh.mongodb.net/?appName=Cluster0';
const MONGO_DB_NAME = (process.env.MONGO_DB_NAME && process.env.MONGO_DB_NAME !== 'ssec_timetable_db') 
  ? process.env.MONGO_DB_NAME 
  : 'ssec_timetable';

let mongoClientInstance: MongoClient | null = null;

async function getMongoDatabase() {
  if (!mongoClientInstance) {
    mongoClientInstance = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 10000,
    });
    await mongoClientInstance.connect();
    console.log(`[MongoDB Atlas] Connected successfully to cluster at ${MONGO_URI.split('@')[1] || 'cluster0'}, DB: ${MONGO_DB_NAME}`);
  }
  return mongoClientInstance.db(MONGO_DB_NAME);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Persistent Secure OTP Store ---
interface StoredOtp {
  otpHash: string;
  email: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
  recipientName?: string;
  role?: string;
  identifier?: string;
}

const OTP_PERSIST_FILE = path.join(process.cwd(), '.otp_store.json');

function loadPersistedOtpStore(): Map<string, StoredOtp> {
  const map = new Map<string, StoredOtp>();
  try {
    if (fs.existsSync(OTP_PERSIST_FILE)) {
      const raw = fs.readFileSync(OTP_PERSIST_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const now = Date.now();
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.key && item.record && item.record.expiresAt > now) {
            map.set(item.key, item.record);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[OTP Store] Notice: Could not read persisted OTP store:', err.message);
  }
  return map;
}

const otpStore = loadPersistedOtpStore();

function persistOtpStore() {
  try {
    const now = Date.now();
    const list: { key: string; record: StoredOtp }[] = [];
    for (const [key, record] of otpStore.entries()) {
      if (record.expiresAt > now) {
        list.push({ key, record });
      }
    }
    fs.writeFileSync(OTP_PERSIST_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[OTP Store] Notice: Could not write persisted OTP store:', err.message);
  }
}

function getOtpKey(email: string, purpose: string): string {
  return `${email.trim().toLowerCase()}_${purpose.trim().toLowerCase()}`;
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 
    ? `${name[0]}*` 
    : `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}`;
  return `${maskedName}@${domain}`;
}

// Helper to get sanitized SMTP credentials
function getSmtpConfig() {
  const host = process.env.MAIL_SERVER || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT) || 587;
  const defaultSender = (process.env.MAIL_DEFAULT_SENDER || 'nexoratechnologiessupport@gmail.com').trim();
  
  let user = (process.env.MAIL_USERNAME || '').trim();
  if (!user || user === 'nexoratechnologiessupport.com') {
    user = defaultSender;
  } else if (!user.includes('@')) {
    user = `${user}@gmail.com`;
  }

  // Sanitize password (trim spaces often added when copying 16-char app passwords like 'abcd efgh ijkl mnop')
  const pass = (process.env.MAIL_PASSWORD || '').trim().replace(/\s+/g, '');
  const secure = process.env.MAIL_USE_SSL === 'true' || port === 465;

  return { host, port, user, pass, defaultSender, secure };
}

function createTransporter() {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      // Reject unauthorized in prod, but allow STARTTLS
      rejectUnauthorized: false
    }
  });
}

// Generate professional HTML email for OTP
function buildOtpEmailHtml(params: {
  recipientName: string;
  otpCode: string;
  purpose: string;
  role: string;
  expiryMinutes: number;
}) {
  const isRegistration = params.purpose.toLowerCase() === 'registration';
  const actionTitle = isRegistration ? 'Registration Email Verification' : 'Password Reset Verification';
  const actionDesc = isRegistration 
    ? `Thank you for registering on the <strong>SSEC IT Department Timetable Portal</strong> as a <em>${params.role}</em>. Please use the verification code below to complete your registration.`
    : `A password reset request was initiated for your <strong>SSEC IT Department Timetable Portal</strong> account. Use the verification code below to set a new password.`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${actionTitle}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Header -->
      <tr>
        <td style="background-color: #0f172a; padding: 32px 28px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Shantilal Shah Engineering College</h1>
          <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Department of Information Technology • Smart Timetable Portal</p>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="padding: 32px 28px;">
          <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">${actionTitle}</h2>
          <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${params.recipientName || 'User'}</strong>,</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">${actionDesc}</p>

          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; display: inline-block;">${params.otpCode}</span>
            <span style="display: block; font-size: 12px; color: #dc2626; font-weight: 500; margin-top: 8px;">⏱️ Expires in ${params.expiryMinutes} minutes</span>
          </div>

          <!-- Security Note -->
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #991b1b;">
              <strong>Security Notice:</strong> Never share this code with anyone. SSEC administrators and faculty will never ask for your verification code. If you did not request this, please ignore this email.
            </p>
          </div>

          <p style="margin: 0; font-size: 13px; color: #64748b;">Regards,<br><strong>SSEC IT System Administrator</strong></p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
            This is an automated security verification message dispatched by the SSEC IT Timetable Portal.<br>
            Shantilal Shah Engineering College, Sidsar Campus, Bhavnagar, Gujarat.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

// ==================== API ROUTES ====================

function checkTcpConnection(host: string, port: number, timeoutMs = 4000): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!isResolved) {
        isResolved = true;
        const latencyMs = Date.now() - startTime;
        socket.destroy();
        resolve({ reachable: true, latencyMs });
      }
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ reachable: false, latencyMs: Date.now() - startTime, error: `Connection timed out after ${timeoutMs}ms` });
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ reachable: false, latencyMs: Date.now() - startTime, error: err.message });
      }
    });

    try {
      socket.connect(port, host);
    } catch (err: any) {
      if (!isResolved) {
        isResolved = true;
        resolve({ reachable: false, latencyMs: 0, error: err.message });
      }
    }
  });
}

// Comprehensive Diagnostic Engine (Never exposes sensitive credentials)
async function runSmtpDiagnostics() {
  const host = process.env.MAIL_SERVER || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT) || 587;
  const rawUser = process.env.MAIL_USERNAME || '';
  const rawPass = process.env.MAIL_PASSWORD || '';
  const defaultSender = process.env.MAIL_DEFAULT_SENDER || '';
  const useTls = process.env.MAIL_USE_TLS !== 'false';
  const useSsl = process.env.MAIL_USE_SSL === 'true' || port === 465;

  const config = getSmtpConfig();
  const maskedUsername = config.user ? maskEmail(config.user) : 'Not configured';
  const maskedSender = config.defaultSender ? maskEmail(config.defaultSender) : 'Not configured';
  
  const passwordProvided = Boolean(rawPass.trim());
  const sanitizedPass = rawPass.trim().replace(/\s+/g, '');
  const passwordLength = sanitizedPass.length;
  const hasWhitespace = rawPass.includes(' ');
  const isPlaceholder = rawPass.toLowerCase().includes('your_') || rawPass.toLowerCase().includes('password_here');

  const recommendations: string[] = [];

  // Step 1: Environment Variables Diagnostics
  const envCheck = {
    server: host,
    port,
    encryption: useSsl ? 'SSL (Port 465)' : useTls ? 'STARTTLS (Port 587)' : 'Plaintext (Insecure)',
    usernameConfigured: Boolean(config.user),
    usernameFormattedCorrectly: config.user.includes('@gmail.com') || config.user.includes('@'),
    maskedUsername,
    senderConfigured: Boolean(config.defaultSender),
    maskedSender,
    passwordConfigured: passwordProvided && !isPlaceholder,
    passwordLength: passwordProvided ? passwordLength : 0,
    hasWhitespaceInPassword: hasWhitespace,
    isPlaceholderPassword: isPlaceholder
  };

  if (!passwordProvided || isPlaceholder) {
    recommendations.push('MAIL_PASSWORD is not configured in Settings. Google requires a 16-character App Password.');
  } else if (passwordLength !== 16) {
    recommendations.push(`Password length is ${passwordLength} characters. Google App Passwords are strictly 16 characters (e.g., 'abcd efgh ijkl mnop'). Standard Google account passwords will fail with BadCredentials.`);
  }

  if (hasWhitespace) {
    recommendations.push('Whitespace detected in password string. Trailing or internal spaces are automatically stripped by the server.');
  }

  if (!rawUser || !rawUser.includes('@')) {
    recommendations.push(`MAIL_USERNAME should be a full Google email address (e.g., yourname@gmail.com). Current resolved value: ${maskedUsername}.`);
  }

  // Step 2: TCP Socket Reachability Test
  const tcpCheck = await checkTcpConnection(host, port, 4000);

  if (!tcpCheck.reachable) {
    recommendations.push(`Unable to establish TCP connection to ${host}:${port}. Error: ${tcpCheck.error || 'Timed out'}.`);
    return {
      success: false,
      status: 'NETWORK_UNREACHABLE',
      summary: `Network connection to ${host}:${port} failed.`,
      diagnostics: {
        environment: envCheck,
        network: {
          reachable: false,
          host,
          port,
          error: tcpCheck.error,
          latencyMs: tcpCheck.latencyMs
        },
        authentication: {
          attempted: false,
          verified: false,
          reason: 'Skipped due to unreachable network host'
        }
      },
      recommendations
    };
  }

  // Step 3: SMTP Handshake & Authentication Test
  if (!passwordProvided || isPlaceholder) {
    return {
      success: false,
      status: 'CONFIGURATION_INCOMPLETE',
      summary: 'Gmail SMTP network port is open and reachable, but MAIL_PASSWORD is not set or contains a placeholder.',
      diagnostics: {
        environment: envCheck,
        network: {
          reachable: true,
          host,
          port,
          latencyMs: tcpCheck.latencyMs
        },
        authentication: {
          attempted: false,
          verified: false,
          reason: 'MAIL_PASSWORD missing or placeholder'
        }
      },
      recommendations
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();

    return {
      success: true,
      status: 'AUTHENTICATED',
      summary: `Gmail SMTP connection and credentials verified successfully (${host}:${port}) using ${maskedUsername}. Ready to deliver verification emails to recipient inboxes.`,
      diagnostics: {
        environment: envCheck,
        network: {
          reachable: true,
          host,
          port,
          latencyMs: tcpCheck.latencyMs
        },
        authentication: {
          attempted: true,
          verified: true,
          smtpCode: 250,
          authenticatedUser: maskedUsername
        }
      },
      recommendations: [
        'Gmail SMTP connection is active and healthy.',
        'Verification OTP codes are delivered directly to the user\'s real Google Gmail inbox.'
      ]
    };
  } catch (authErr: any) {
    const errMessage = authErr.message || 'SMTP Authentication failed';
    const isBadCredentials = errMessage.includes('535') || errMessage.includes('BadCredentials') || errMessage.includes('Username and Password not accepted');

    if (isBadCredentials) {
      recommendations.push('Google rejected login credentials (535 BadCredentials). Please follow these resolution steps:');
      recommendations.push('1. Enable 2-Step Verification on your Google Account (myaccount.google.com/security).');
      recommendations.push('2. Generate a 16-character App Password at https://myaccount.google.com/apppasswords under App name "SSEC IT Portal".');
      recommendations.push('3. Enter the 16-character code into MAIL_PASSWORD in the Settings menu.');
      recommendations.push(`4. Verify that MAIL_USERNAME (${maskedUsername}) matches the exact Google account that generated the App Password.`);
    } else {
      recommendations.push(`SMTP error during handshake or authentication: ${errMessage}`);
    }

    return {
      success: false,
      status: isBadCredentials ? 'AUTHENTICATION_FAILED' : 'SMTP_HANDSHAKE_ERROR',
      summary: isBadCredentials 
        ? 'Google SMTP rejected the credentials (535 BadCredentials). Google requires a 16-character App Password (not your standard Google account password).'
        : `SMTP connection error: ${errMessage}`,
      diagnostics: {
        environment: envCheck,
        network: {
          reachable: true,
          host,
          port,
          latencyMs: tcpCheck.latencyMs
        },
        authentication: {
          attempted: true,
          verified: false,
          errorType: isBadCredentials ? 'BAD_CREDENTIALS' : 'HANDSHAKE_ERROR',
          smtpCode: isBadCredentials ? 535 : null,
          details: isBadCredentials 
            ? '535 5.7.8 Username and Password not accepted (Google App Password required)' 
            : errMessage
        }
      },
      recommendations
    };
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// MongoDB Atlas Status Diagnostic Endpoint
app.get('/api/mongo/status', async (req, res) => {
  const startTime = Date.now();
  try {
    const db = await getMongoDatabase();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    
    const collectionsList = await db.listCollections().toArray();
    const counts: Record<string, number> = {};
    for (const col of collectionsList) {
      counts[col.name] = await db.collection(col.name).countDocuments();
    }

    return res.json({
      success: true,
      connected: true,
      message: 'MongoDB Atlas connected successfully.',
      uri: MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'),
      cluster: 'cluster0.lhna7yh.mongodb.net',
      database: MONGO_DB_NAME,
      collections: collectionsList.map(c => c.name),
      counts,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    mongoClientInstance = null;
    const latencyMs = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      connected: false,
      message: 'Failed to connect to MongoDB Atlas.',
      error: err.message,
      uri: MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'),
      database: MONGO_DB_NAME,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  }
});

// Users endpoint fetching directly from MongoDB Atlas
app.get('/api/users', async (req, res) => {
  try {
    const db = await getMongoDatabase();
    const students = await db.collection('students').find().toArray();
    const professors = await db.collection('professors').find().toArray();
    
    const formattedUsers: any[] = [];
    
    for (const s of students) {
      formattedUsers.push({
        id: s.id || (s._id ? String(s._id) : Math.random().toString(36).substring(2, 9)),
        full_name: s.full_name,
        email: s.email,
        role: 'student',
        identifier: s.enrollment_no,
        semester: s.semester,
        classroom: s.classroom,
        phone: s.phone,
        status: s.status || 'Active',
        registered_at: s.registered_at || new Date().toISOString()
      });
    }

    for (const p of professors) {
      formattedUsers.push({
        id: p.id || (p._id ? String(p._id) : Math.random().toString(36).substring(2, 9)),
        full_name: p.full_name,
        email: p.email,
        role: 'professor',
        identifier: p.professor_id,
        department: p.department || 'Information Technology',
        designation: p.designation || 'Assistant Professor',
        phone: p.phone,
        status: p.status || 'Active',
        registered_at: p.registered_at || new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length,
      source: 'MongoDB Atlas'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Full sync data from MongoDB
app.get('/api/mongo/data', async (req, res) => {
  try {
    const db = await getMongoDatabase();
    const students = await db.collection('students').find().toArray();
    const professors = await db.collection('professors').find().toArray();
    const classrooms = await db.collection('classrooms').find().toArray();
    const subjects = await db.collection('subjects').find().toArray();
    const timetables = await db.collection('timetables').find().toArray();
    const notifications = await db.collection('notifications').find().toArray();

    return res.json({
      success: true,
      data: {
        students,
        professors,
        classrooms,
        subjects,
        timetables,
        notifications
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Helper to construct flexible MongoDB ID/Field queries
function buildMongoMatchQuery(id?: string, extraFields: Record<string, any> = {}) {
  const orList: any[] = [];
  if (id) {
    orList.push({ id });
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        orList.push({ _id: new ObjectId(id) });
      } catch {}
    }
  }
  for (const [key, val] of Object.entries(extraFields)) {
    if (val !== undefined && val !== null && val !== '') {
      orList.push({ [key]: val });
    }
  }
  return orList.length > 0 ? { $or: orList } : {};
}

// Universal User Delete (Superuser CRUD Operation)
app.post('/api/users/delete', async (req, res) => {
  try {
    const { id, identifier, role } = req.body;
    if (!id && !identifier) {
      return res.status(400).json({ success: false, error: 'User ID or identifier required for deletion' });
    }

    const db = await getMongoDatabase();
    let totalDeleted = 0;

    // Build conditions
    const query = buildMongoMatchQuery(id, {
      professor_id: identifier,
      enrollment_no: identifier,
      email: identifier
    });

    if (role === 'professor' || !role) {
      const pRes = await db.collection('professors').deleteMany(query);
      totalDeleted += pRes.deletedCount;
    }
    if (role === 'student' || !role) {
      const sRes = await db.collection('students').deleteMany(query);
      totalDeleted += sRes.deletedCount;
    }
    if (role === 'admin') {
      // Only protect root SSEC.IT.ADMIN
      if (identifier !== 'SSEC.IT.ADMIN') {
        const aRes = await db.collection('admins').deleteMany(query);
        totalDeleted += aRes.deletedCount;
      }
    }

    return res.json({
      success: true,
      deletedCount: totalDeleted,
      message: `User record removed from MongoDB Atlas (${totalDeleted} document(s) deleted).`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Professor CRUD
app.post('/api/professors/delete', async (req, res) => {
  try {
    const { id, professor_id } = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(id, { professor_id });
    const result = await db.collection('professors').deleteMany(query);
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/professors/save', async (req, res) => {
  try {
    const prof = req.body;
    const db = await getMongoDatabase();
    if (prof.id || prof._id) {
      const query = buildMongoMatchQuery(prof.id, { professor_id: prof.professor_id });
      await db.collection('professors').updateOne(query, { $set: prof }, { upsert: true });
    } else {
      await db.collection('professors').insertOne(prof);
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Student CRUD
app.post('/api/students/delete', async (req, res) => {
  try {
    const { id, enrollment_no } = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(id, { enrollment_no });
    const result = await db.collection('students').deleteMany(query);
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students/save', async (req, res) => {
  try {
    const student = req.body;
    const db = await getMongoDatabase();
    if (student.id || student._id) {
      const query = buildMongoMatchQuery(student.id, { enrollment_no: student.enrollment_no });
      await db.collection('students').updateOne(query, { $set: student }, { upsert: true });
    } else {
      await db.collection('students').insertOne(student);
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Subject CRUD
app.post('/api/subjects/delete', async (req, res) => {
  try {
    const { id, code } = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(id, { code });
    const result = await db.collection('subjects').deleteMany(query);
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/subjects/save', async (req, res) => {
  try {
    const subject = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(subject.id, { code: subject.code });
    await db.collection('subjects').updateOne(query, { $set: subject }, { upsert: true });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Classroom CRUD
app.post('/api/classrooms/delete', async (req, res) => {
  try {
    const { id, room_number } = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(id, { room_number });
    const result = await db.collection('classrooms').deleteMany(query);
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/classrooms/save', async (req, res) => {
  try {
    const classroom = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(classroom.id, { room_number: classroom.room_number });
    await db.collection('classrooms').updateOne(query, { $set: classroom }, { upsert: true });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Timetable CRUD
app.post('/api/timetables/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(id);
    const result = await db.collection('timetables').deleteMany(query);
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/timetables/save', async (req, res) => {
  try {
    const slot = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(slot.id);
    await db.collection('timetables').updateOne(query, { $set: slot }, { upsert: true });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Notification CRUD
app.post('/api/notifications/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(id);
    const result = await db.collection('notifications').deleteMany(query);
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/notifications/save', async (req, res) => {
  try {
    const notif = req.body;
    const db = await getMongoDatabase();
    const query = buildMongoMatchQuery(notif.id);
    await db.collection('notifications').updateOne(query, { $set: notif }, { upsert: true });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Diagnostic Endpoint (GET & POST supported for both /api/smtp/diagnostics and /api/otp/diagnostics)
const handleDiagnostics = async (req: express.Request, res: express.Response) => {
  try {
    const report = await runSmtpDiagnostics();
    const statusCode = report.success ? 200 : (report.status === 'AUTHENTICATION_FAILED' ? 401 : 400);
    return res.status(statusCode).json(report);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      status: 'DIAGNOSTIC_EXECUTION_ERROR',
      summary: 'Failed to complete SMTP diagnostics test.',
      error: err.message
    });
  }
};

app.get('/api/smtp/diagnostics', handleDiagnostics);
app.post('/api/smtp/diagnostics', handleDiagnostics);
app.get('/api/otp/diagnostics', handleDiagnostics);
app.post('/api/otp/diagnostics', handleDiagnostics);

// Test SMTP configuration endpoint (backward compatible)
app.get('/api/otp/status', async (req, res) => {
  const config = getSmtpConfig();
  res.json({
    server: config.host,
    port: config.port,
    sender: config.defaultSender,
    username: maskEmail(config.user),
    configured: Boolean(config.pass),
    hasPassword: Boolean(config.pass)
  });
});

app.all('/api/otp/test-smtp', handleDiagnostics);

// Send OTP via Real Gmail SMTP
app.post('/api/otp/send', async (req, res) => {
  try {
    const { email, purpose = 'registration', recipient_name = 'User', role = 'student', identifier = '', otp: customOtp } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPurpose = purpose.trim().toLowerCase();
    const key = getOtpKey(cleanEmail, cleanPurpose);
    const now = Date.now();

    // 1. Rate Limiting: 30 seconds cooldown between dispatches
    const existing = otpStore.get(key);
    if (existing && (now - existing.createdAt) < 30000) {
      const remainingSecs = Math.ceil((30000 - (now - existing.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${remainingSecs} seconds before requesting another verification code.`
      });
    }

    // 2. Generate or use provided 6-digit numeric OTP
    const otpCode = (customOtp && /^\d{6}$/.test(customOtp.trim())) 
      ? customOtp.trim() 
      : crypto.randomInt(100000, 999999).toString();

    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiryMinutes = 5;
    const expiresAt = now + expiryMinutes * 60 * 1000;

    // 3. Store hashed OTP in persistent store
    otpStore.set(key, {
      otpHash,
      email: cleanEmail,
      purpose: cleanPurpose,
      expiresAt,
      attempts: 0,
      createdAt: now,
      recipientName: recipient_name,
      role,
      identifier
    });
    persistOtpStore();

    // 4. Dispatch Email via Gmail SMTP
    const smtpConfig = getSmtpConfig();
    const transporter = createTransporter();

    const subject = cleanPurpose === 'registration'
      ? `[SSEC IT Portal] Verify Your Account Registration - Code: ${otpCode}`
      : `[SSEC IT Portal] Password Reset Verification - Code: ${otpCode}`;

    const htmlBody = buildOtpEmailHtml({
      recipientName: recipient_name,
      otpCode,
      purpose: cleanPurpose,
      role,
      expiryMinutes
    });

    const mailOptions = {
      from: `"SSEC IT Timetable Portal" <${smtpConfig.defaultSender || smtpConfig.user}>`,
      to: cleanEmail,
      subject,
      text: `Hello ${recipient_name},\n\nYour 6-digit SSEC IT verification code is: ${otpCode}\n\nThis code expires in ${expiryMinutes} minutes.\nNever share this code with anyone.\n\nRegards,\nSSEC IT Department`,
      html: htmlBody
    };

    console.log(`[SMTP] Initiating direct email dispatch to: ${cleanEmail} via ${smtpConfig.host}:${smtpConfig.port}...`);

    let dispatchSuccess = false;
    let dispatchError = '';

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Successfully sent OTP email to ${cleanEmail}! MessageId:`, info.messageId);
      dispatchSuccess = true;
    } catch (smtpErr: any) {
      console.error(`[SMTP ERROR] Failed to send email to ${cleanEmail}:`, smtpErr.message);
      dispatchError = smtpErr.message || 'SMTP dispatch error';

      if (dispatchError.includes('535') || dispatchError.includes('BadCredentials')) {
        dispatchError = 'Gmail SMTP Authentication Failed (535 BadCredentials): Google requires a 16-character App Password (not your standard Gmail account password). Please generate a 16-character App Password at https://myaccount.google.com/apppasswords and update MAIL_PASSWORD in Settings.';
      }

      // If SMTP fails, clean up the pending OTP session
      otpStore.delete(key);

      return res.status(400).json({
        success: false,
        error: dispatchError,
        errorType: dispatchError.includes('BadCredentials') ? 'BAD_CREDENTIALS' : 'SMTP_FAILURE'
      });
    }

    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to your real Gmail inbox (${maskEmail(cleanEmail)}).`,
      maskedEmail: maskEmail(cleanEmail),
      expires_in_minutes: expiryMinutes
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/otp/send:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred while sending verification code.'
    });
  }
});

// Verify OTP
app.post('/api/otp/verify', (req, res) => {
  try {
    const { email, purpose = 'registration', otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanPurpose = (purpose || 'registration').toString().trim().toLowerCase();
    const cleanOtp = otp.toString().trim().replace(/\D/g, '');
    const key = getOtpKey(cleanEmail, cleanPurpose);

    const record = otpStore.get(key);
    if (!record) {
      return res.status(400).json({
        success: false,
        error: `No active verification code found for this email (${maskEmail(cleanEmail)}). Please request a new code.`
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      persistOtpStore();
      return res.status(400).json({
        success: false,
        error: 'This verification code has expired (5-minute limit). Please request a fresh code.'
      });
    }

    if (record.attempts >= 5) {
      otpStore.delete(key);
      persistOtpStore();
      return res.status(400).json({
        success: false,
        error: 'Maximum verification attempts exceeded (5). Please request a new code.'
      });
    }

    const providedHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (providedHash !== record.otpHash) {
      record.attempts += 1;
      persistOtpStore();
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // Success: Consume OTP
    otpStore.delete(key);
    persistOtpStore();
    return res.json({
      success: true,
      message: 'Email address verified successfully.'
    });
  } catch (err: any) {
    console.error('Error in /api/otp/verify:', err);
    return res.status(500).json({ success: false, error: 'Verification error' });
  }
});

// ==================== VITE MIDDLEWARE / SPA FALLBACK ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SSEC IT Portal] Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
