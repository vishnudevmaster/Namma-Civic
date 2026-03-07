import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Clerk Backend client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to generate complaint IDs (NC-YYYY-NNNNN)
function generateComplaintId(id: number | string): string {
  const year = new Date().getFullYear();
  return `NC-${year}-${String(id).padStart(5, '0')}`;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Custom auth middleware that verifies the Clerk session token
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Admin auth: No Bearer token found in request');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      console.error('Admin auth: Token is empty/null/undefined');
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    // Verify the token with Clerk
    try {
      const verifiedToken = await clerkClient.verifyToken(token);
      req.auth = verifiedToken;
      next();
    } catch (verifyError: any) {
      console.error('Admin auth: Token verification failed:', verifyError.message);
      return res.status(401).json({ error: 'Token verification failed: ' + verifyError.message });
    }
  } catch (error: any) {
    console.error('Admin auth: Unexpected error:', error.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// API: List complaints with filters
app.get('/api/complaints', async (req, res) => {
  try {
    let query = supabase.from('complaints').select('*');

    if (req.query.status && req.query.status !== 'all') {
      query = query.eq('status', req.query.status);
    }
    if (req.query.type && req.query.type !== 'all') {
      query = query.eq('type', req.query.type);
    }
    if (req.query.ward && req.query.ward !== 'all') {
      query = query.eq('ward', req.query.ward);
    }
    if (req.query.user_id) {
      query = query.eq('user_id', req.query.user_id);
    }

    // Sort
    const sort = req.query.sort as string;
    if (sort === 'upvotes') {
      query = query.order('upvotes', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: complaints, error } = await query;

    if (error) throw error;
    res.json(complaints);
  } catch (error: any) {
    console.error('Error fetching complaints:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Get single complaint
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try fetching by actual DB ID first, then by the generated complaint_id
    let query = supabase.from('complaints').select('*');

    // If it looks like a number, try ID, otherwise try complaint_id
    if (!isNaN(Number(id))) {
      query = query.eq('id', id);
    } else {
      query = query.eq('complaint_id', id);
    }

    const { data: complaint, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      throw error;
    }

    res.json(complaint);
  } catch (error: any) {
    console.error(`Error fetching complaint ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload image to Cloudinary
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'nammacivic_complaints',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    console.log('[Cloudinary] Image uploaded:', result.secure_url);
    res.json({ url: result.secure_url });
  } catch (error: any) {
    console.error('[Cloudinary] Upload error:', error.message);
    res.status(500).json({ error: 'Image upload failed: ' + error.message });
  }
});

// API: Submit new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { type, location, ward, description, photo_url, user_id, reporter_name, reporter_phone, reporter_email } = req.body;

    // 1. Insert the initial record with a temporary complaint_id
    const { data: inserted, error: insertError } = await supabase
      .from('complaints')
      .insert([{
        complaint_id: `TEMP-${Date.now()}`, // Temporary ID
        type,
        location,
        ward: ward || '',
        description,
        photo_url,
        user_id: user_id || 'anonymous',
        reporter_name: reporter_name || 'Anonymous',
        reporter_phone: reporter_phone || '',
        reporter_email: reporter_email || '',
        status: 'submitted',
        admin_notes: [],
        upvoted_by: []
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Generate the real complaint ID based on the DB-assigned primary key (id)
    const complaintId = generateComplaintId(inserted.id);

    // 3. Update the record with the real complaint_id
    const { data: newComplaint, error: updateError } = await supabase
      .from('complaints')
      .update({ complaint_id: complaintId })
      .eq('id', inserted.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json(newComplaint);
  } catch (error: any) {
    console.error('Error creating complaint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Update complaint status
app.patch('/api/complaints/:id/status', requireAuth, async (req: any, res: any) => {
  try {
    const { status, assigned_to, admin_note } = req.body;
    const { id } = req.params;

    console.log(`[Admin] Updating complaint ${id}:`, { status, assigned_to, admin_note });

    const updates: any = { updated_at: new Date().toISOString() };

    if (status) {
      updates.status = status;
    }
    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to;
    }

    // If an admin note was provided, we need to fetch existing notes first
    if (admin_note) {
      const { data: complaint, error: fetchError } = await supabase
        .from('complaints')
        .select('admin_notes')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      let currentNotes = complaint.admin_notes || [];
      if (typeof currentNotes === 'string') {
        try { currentNotes = JSON.parse(currentNotes); } catch (e) { currentNotes = []; }
      }

      updates.admin_notes = [
        ...currentNotes,
        { note: admin_note, timestamp: new Date().toISOString(), author: 'Admin' }
      ];
    }

    // Perform the update
    const { data: updatedComplaint, error: updateError } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error(`[Admin] Supabase update error for complaint ${id}:`, updateError);
      throw updateError;
    }

    console.log(`[Admin] Successfully updated complaint ${id}`);
    res.json(updatedComplaint);
  } catch (error: any) {
    console.error(`Error updating complaint ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Toggle upvote
app.post('/api/complaints/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'anonymous';

    // 1. Fetch current upvotes
    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      throw fetchError;
    }

    const upvotedBy = Array.isArray(complaint.upvoted_by) ? complaint.upvoted_by : [];
    const alreadyUpvoted = upvotedBy.includes(userId);

    let newUpvotedBy;
    let newUpvoteCount;

    if (alreadyUpvoted) {
      // Remove upvote
      newUpvotedBy = upvotedBy.filter((u: string) => u !== userId);
      newUpvoteCount = Math.max(0, (complaint.upvotes || 0) - 1);
    } else {
      // Add upvote
      newUpvotedBy = [...upvotedBy, userId];
      newUpvoteCount = (complaint.upvotes || 0) + 1;
    }

    // 2. Perform update
    const { data: updated, error: updateError } = await supabase
      .from('complaints')
      .update({
        upvotes: newUpvoteCount,
        upvoted_by: newUpvotedBy
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(updated);
  } catch (error: any) {
    console.error(`Error toggling upvote for ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Analytics
app.get('/api/analytics', async (_req, res) => {
  try {
    // For Supabase, we can use the powerful RPC features for complex analytics,
    // but to keep it simple and equivalent to the SQLite version without requiring
    // custom database functions, we'll fetch all required fields and calculate in memory

    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('type, status, ward');

    if (error) throw error;

    if (!complaints) {
      return res.json({
        byType: [], byStatus: [], byWard: [],
        summary: { total: 0, resolved: 0, pending: 0, inProgress: 0 }
      });
    }

    // Calculate 'byType'
    const typeMap = complaints.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    const byType = Object.keys(typeMap).map(name => ({ name, value: typeMap[name] }));

    // Calculate 'byStatus'
    const statusMap = complaints.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});
    const byStatus = Object.keys(statusMap).map(name => ({ name, value: statusMap[name] }));

    // Calculate 'byWard'
    const wardMap = complaints.reduce((acc: Record<string, number>, curr) => {
      if (curr.ward) {
        acc[curr.ward] = (acc[curr.ward] || 0) + 1;
      }
      return acc;
    }, {});
    const byWard = Object.keys(wardMap)
      .map(name => ({ name, value: wardMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Summary
    let resolved = 0, pending = 0, inProgress = 0;
    complaints.forEach(c => {
      if (['resolved', 'closed'].includes(c.status)) resolved++;
      else if (['submitted', 'under_review'].includes(c.status)) pending++;
      else if (['assigned', 'in_progress'].includes(c.status)) inProgress++;
    });

    res.json({
      byType,
      byStatus,
      byWard,
      summary: { total: complaints.length, resolved, pending, inProgress }
    });
  } catch (error: any) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then(vite => {
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏙️ NammaCivic server running on http://localhost:${PORT} (Dev)`);
      console.log(`🔌 Database connected to Supabase`);
    });
  });
} else {
  // Production serving static files
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🏙️ NammaCivic server running on http://localhost:${PORT} (Prod)`);
      console.log(`🔌 Database connected to Supabase`);
    });
  }
}

export default app;
